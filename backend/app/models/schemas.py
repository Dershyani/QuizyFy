from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ── AUTH ──────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    student_id: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    student_id: str

# ── DOCUMENT ──────────────────────────────────────
class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    message: str

# ── QUIZ ──────────────────────────────────────────
class QuestionSchema(BaseModel):
    question_id: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str

class QuizResponse(BaseModel):
    quiz_id: str
    title: str
    total_questions: int
    questions: List[QuestionSchema]

# ── ANSWER ────────────────────────────────────────
class SubmitAnswer(BaseModel):
    quiz_attempt_id: str
    question_id: str
    selected_answer: str

class AnswerFeedback(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    recommendations: Optional[List[dict]] = None

# ── PROGRESS ──────────────────────────────────────
class QuizHistory(BaseModel):
    quiz_id: str
    title: str
    score: float
    total_questions: int
    completed_at: datetime