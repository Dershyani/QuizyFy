from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.services.auth_service import get_current_user
from app.services.quiz_service import generate_quiz, get_quiz_by_id
from app.services.rag_service import generate_rag_feedback
from app.core.database import supabase
import uuid
import re
from collections import Counter
from datetime import datetime, timedelta

router = APIRouter()
security = HTTPBearer()

class GenerateQuizRequest(BaseModel):
    document_id: str
    num_questions: int = 10
    title: str = "My Quiz"

class SubmitAnswerRequest(BaseModel):
    quiz_attempt_id: str
    question_id: str
    selected_answer: str

@router.post("/generate")
def generate(
    request: GenerateQuizRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = generate_quiz(
        document_id=request.document_id,
        user_id=user["id"],
        num_questions=request.num_questions,
        title=request.title
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/start/{quiz_id}")
def start_quiz(
    quiz_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    attempt_id = str(uuid.uuid4())
    supabase.table("quiz_attempts").insert({
        "id": attempt_id,
        "user_id": user["id"],
        "quiz_id": quiz_id,
        "status": "in_progress",
        "total_questions": 0
    }).execute()
    return {
        "quiz_attempt_id": attempt_id,
        "message": "Quiz started! Good luck!"
    }

@router.post("/submit-answer")
def submit_answer(
    request: SubmitAnswerRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    question = supabase.table("questions")\
        .select("correct_answer, question_text")\
        .eq("id", request.question_id)\
        .execute()
    if not question.data:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = question.data[0]["correct_answer"]
    selected = request.selected_answer.upper()
    is_correct = selected == correct
    supabase.table("answer_attempts").insert({
        "quiz_attempt_id": request.quiz_attempt_id,
        "question_id": request.question_id,
        "selected_answer": selected,
        "is_correct": is_correct
    }).execute()
    return {
        "is_correct": is_correct,
        "correct_answer": correct,
        "selected_answer": selected
    }

@router.post("/finish/{quiz_attempt_id}")
def finish_quiz(
    quiz_attempt_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    answers = supabase.table("answer_attempts")\
        .select("is_correct")\
        .eq("quiz_attempt_id", quiz_attempt_id)\
        .execute()
    total = len(answers.data)
    correct = sum(1 for a in answers.data if a["is_correct"])
    score = (correct / total * 100) if total > 0 else 0
    supabase.table("quiz_attempts").update({
        "score": score,
        "total_questions": total,
        "status": "completed"
    }).eq("id", quiz_attempt_id).execute()
    return {
        "score": round(score, 1),
        "correct": correct,
        "total": total,
        "message": "Quiz completed!"
    }

@router.get("/results/{quiz_attempt_id}")
def get_results(
    quiz_attempt_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    attempt = supabase.table("quiz_attempts")\
        .select("*")\
        .eq("id", quiz_attempt_id)\
        .execute()
    if not attempt.data:
        raise HTTPException(status_code=404, detail="Attempt not found")
    attempt_data = attempt.data[0]
    answers = supabase.table("answer_attempts")\
        .select("*, questions(question_text, correct_answer, option_a, option_b, option_c, option_d)")\
        .eq("quiz_attempt_id", quiz_attempt_id)\
        .execute()
    quiz = supabase.table("quizzes")\
        .select("title")\
        .eq("id", attempt_data["quiz_id"])\
        .execute()
    correct = sum(1 for a in answers.data if a["is_correct"])
    total = len(answers.data)
    score = round((correct / total * 100), 1) if total > 0 else 0
    return {
        "quiz_attempt_id": quiz_attempt_id,
        "quiz_id": attempt_data["quiz_id"],
        "title": quiz.data[0]["title"] if quiz.data else "Quiz",
        "score": score,
        "correct": correct,
        "total": total,
        "answers": [
            {
                "answer_attempt_id": a["id"],
                "question_text": a["questions"]["question_text"],
                "selected_answer": a["selected_answer"],
                "correct_answer": a["questions"]["correct_answer"],
                "is_correct": a["is_correct"],
                "option_a": a["questions"]["option_a"],
                "option_b": a["questions"]["option_b"],
                "option_c": a["questions"]["option_c"],
                "option_d": a["questions"]["option_d"],
            }
            for a in answers.data
        ]
    }

@router.post("/feedback/{answer_attempt_id}")
def get_feedback(
    answer_attempt_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Generate RAG feedback for a wrong answer using SBERT + pgvector + LLaMA 3"""
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get answer attempt with question details
    answer = supabase.table("answer_attempts")\
        .select("*, questions(question_text, correct_answer, option_a, option_b, option_c, option_d, quiz_id)")\
        .eq("id", answer_attempt_id)\
        .execute()

    if not answer.data:
        raise HTTPException(status_code=404, detail="Answer not found")

    answer_data = answer.data[0]
    question = answer_data["questions"]

    # Only generate for wrong answers
    if answer_data["is_correct"]:
        return {
            "message": "Answer was correct!",
            "explanation": None,
            "recommendations": []
        }

    # Get document_id from quiz
    quiz = supabase.table("quizzes")\
        .select("document_id")\
        .eq("id", question["quiz_id"])\
        .execute()

    if not quiz.data:
        raise HTTPException(status_code=404, detail="Quiz not found")

    document_id = quiz.data[0]["document_id"]

    # Get correct option text
    correct_letter = question["correct_answer"]
    option_map = {
        "A": question["option_a"],
        "B": question["option_b"],
        "C": question["option_c"],
        "D": question["option_d"]
    }
    correct_text = option_map.get(correct_letter, "")

    # Generate RAG feedback
    result = generate_rag_feedback(
        question_text=question["question_text"],
        correct_answer=correct_letter,
        correct_option_text=correct_text,
        document_id=document_id,
        answer_attempt_id=answer_attempt_id
    )

    return {
        "question_text": question["question_text"],
        "correct_answer": correct_letter,
        "explanation": result["explanation"],
        "recommendations": result.get("recommendations", [])
    }

@router.get("/progress/dashboard")
def get_dashboard(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get basic student progress - quiz history and count"""
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    attempts = supabase.table("quiz_attempts")\
        .select("*, quizzes(title, total_questions)")\
        .eq("user_id", user["id"])\
        .eq("status", "completed")\
        .order("completed_at", desc=True)\
        .execute()

    if not attempts.data:
        return {
            "total_quizzes": 0,
            "history": []
        }

    history = []
    for a in attempts.data:
        history.append({
            "attempt_id": a["id"],
            "quiz_id": a["quiz_id"],
            "title": a["quizzes"]["title"] if a["quizzes"] else "Unknown",
            "score": round(a["score"], 1),
            "total_questions": a["total_questions"],
            "completed_at": a["completed_at"]
        })

    return {
        "total_quizzes": len(attempts.data),
        "history": history
    }

# ⚠️ IMPORTANT: This MUST be last — generic route catches everything!
@router.get("/{quiz_id}")
def get_quiz(
    quiz_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = get_quiz_by_id(quiz_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/admin/overview")
def get_admin_overview(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Admin dashboard - system overview"""
    user = get_current_user(credentials.credentials)
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")

    # Total students
    students = supabase.table("users")\
        .select("id", count="exact")\
        .eq("role", "student")\
        .limit(1)\
        .execute()

    # Total documents
    documents = supabase.table("documents")\
        .select("id", count="exact")\
        .limit(1)\
        .execute()

    # Total quizzes
    quizzes = supabase.table("quizzes")\
        .select("id", count="exact")\
        .limit(1)\
        .execute()

    # Total attempts
    attempts = supabase.table("quiz_attempts")\
        .select("id, score, completed_at")\
        .eq("status", "completed")\
        .execute()

    # Average score
    scores = [a["score"] for a in attempts.data]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    # Recent students
    recent_students = supabase.table("users")\
        .select("name, student_id, email, created_at")\
        .eq("role", "student")\
        .order("created_at", desc=True)\
        .limit(10)\
        .execute()

    # Recent quiz attempts
    recent_attempts = supabase.table("quiz_attempts")\
        .select("*, users(name, student_id), quizzes(title)")\
        .eq("status", "completed")\
        .order("completed_at", desc=True)\
        .limit(10)\
        .execute()

    # Weak topics based on recommendation titles
    recommendations_res = supabase.table("answer_recommendations").select("title").execute()
    cleaned_topics = []
    for r in recommendations_res.data:
        title = r.get("title", "")
        if not title:
            continue
            
        # 1. Split by common separators (- : |) and take the first part
        # This naturally removes things like "- Wikipedia" or "- Online Course"
        parts = re.split(r'[-:|]', title)
        base_topic = parts[0].strip()
        
        # 2. Remove common tutorial prefixes
        base_topic = re.sub(r'^(GeeksforGeeks\s*|Tutorial\s*|What is\s*|Top \d+\s*)', '', base_topic, flags=re.IGNORECASE).strip()
        
        # 3. Add spaces to combined words (like RiskManagement -> Risk Management)
        # Protect IoT from being split by the camelCase regex
        base_topic = base_topic.replace("IoT", "@@IOT@@")
        base_topic = re.sub(r'([a-z])([A-Z])', r'\1 \2', base_topic)
        base_topic = base_topic.replace("@@IOT@@", "IoT")
        
        # 4. Limit length so it doesn't break UI
        if len(base_topic) > 45:
            base_topic = base_topic[:42] + "..."
            
        if base_topic:
            # Format nicely
            base_topic = base_topic.title()
            base_topic = base_topic.replace("Iot", "IoT")
            base_topic = base_topic.replace("Io T", "IoT")
            base_topic = base_topic.replace("Mqtt", "MQTT")
            base_topic = base_topic.replace(" Cyber Security", " Cybersecurity")
            
            cleaned_topics.append(base_topic)
    
    topic_counts = Counter(cleaned_topics).most_common(7)
    weak_topics = [{"topic": t[0], "count": t[1]} for t in topic_counts]

    # System Usage over time (last 7 days in MYT UTC+8)
    usage_counts = Counter()
    for a in attempts.data:
        date_str = a.get("completed_at")
        if date_str:
            try:
                # Remove Z for python < 3.11 fromisoformat compatibility
                if date_str.endswith('Z'):
                    date_str = date_str[:-1]
                # completed_at from supabase is usually naive UTC or has +00:00
                dt_utc = datetime.fromisoformat(date_str.split('+')[0])
                # Convert to MYT
                dt_my = dt_utc + timedelta(hours=8)
                day = dt_my.strftime("%Y-%m-%d")
                usage_counts[day] += 1
            except Exception:
                day = date_str.split("T")[0]
                usage_counts[day] += 1
            
    system_usage = []
    # Current time in MYT
    today_my = datetime.utcnow() + timedelta(hours=8)
    for i in range(6, -1, -1):
        d = (today_my - timedelta(days=i)).strftime("%Y-%m-%d")
        system_usage.append({"date": d[-5:], "count": usage_counts.get(d, 0)})

    return {
        "stats": {
            "total_students": students.count if students.count is not None else 0,
            "total_documents": documents.count if documents.count is not None else 0,
            "total_quizzes": quizzes.count if quizzes.count is not None else 0,
            "total_attempts": len(attempts.data),
            "average_score": avg_score
        },
        "recent_students": recent_students.data,
        "recent_attempts": [
            {
                "student_name": a["users"]["name"] if a["users"] else "Unknown",
                "student_id": a["users"]["student_id"] if a["users"] else "Unknown",
                "quiz_title": a["quizzes"]["title"] if a["quizzes"] else "Unknown",
                "score": round(a["score"], 1),
                "completed_at": a["completed_at"]
            }
            for a in recent_attempts.data
        ],
        "weak_topics": weak_topics,
        "system_usage": system_usage
    }