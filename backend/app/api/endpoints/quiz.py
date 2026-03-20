from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.services.auth_service import get_current_user
from app.services.quiz_service import generate_quiz, get_quiz_by_id
from app.services.rag_service import generate_rag_feedback
from app.core.database import supabase
import uuid

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