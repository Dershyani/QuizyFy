from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.services.auth_service import get_current_user
from app.services.quiz_service import generate_quiz, get_quiz_by_id
from app.core.database import supabase

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
    """
    Generate a quiz from an uploaded PDF document
    Uses LLaMA 3 via Groq API
    """
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

@router.get("/{quiz_id}")
def get_quiz(
    quiz_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get a quiz with all questions (without correct answers)"""
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = get_quiz_by_id(quiz_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result

@router.post("/start/{quiz_id}")
def start_quiz(
    quiz_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Start a quiz attempt - creates attempt record in DB"""
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    import uuid
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
    """
    Submit an answer for a question
    Returns if correct or wrong immediately
    """
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get correct answer from DB
    question = supabase.table("questions")\
        .select("correct_answer, question_text")\
        .eq("id", request.question_id)\
        .execute()

    if not question.data:
        raise HTTPException(status_code=404, detail="Question not found")

    correct = question.data[0]["correct_answer"]
    selected = request.selected_answer.upper()
    is_correct = selected == correct

    # Save answer attempt
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
    """
    Finish a quiz attempt and calculate final score
    """
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Count correct answers
    answers = supabase.table("answer_attempts")\
        .select("is_correct")\
        .eq("quiz_attempt_id", quiz_attempt_id)\
        .execute()

    total = len(answers.data)
    correct = sum(1 for a in answers.data if a["is_correct"])
    score = (correct / total * 100) if total > 0 else 0

    # Update quiz attempt
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