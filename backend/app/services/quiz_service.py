import json
import uuid
from groq import Groq
from app.core.config import settings
from app.core.database import supabase

# Initialize Groq client
client = Groq(api_key=settings.GROQ_API_KEY)

def get_document_chunks(document_id: str) -> list:
    """
    Get all text chunks for a document from Supabase
    These are the chunks we created during PDF processing
    """
    result = supabase.table("text_chunks")\
        .select("chunk_text")\
        .eq("document_id", document_id)\
        .order("chunk_index")\
        .execute()
    
    return [row["chunk_text"] for row in result.data]

def prepare_context(chunks: list, max_chars: int = 6000) -> str:
    """
    Combine chunks into context for LLaMA 3
    We limit to 6000 chars to stay within token limits
    """
    context = ""
    for chunk in chunks:
        if len(context) + len(chunk) < max_chars:
            context += chunk + "\n\n"
        else:
            break
    return context.strip()

def generate_mcq_with_llama(context: str, num_questions: int = 10) -> list:
    """
    Use LLaMA 3 via Groq API to generate MCQ questions
    
    HOW IT WORKS (for supervisor explanation):
    1. We send the PDF context as input to LLaMA 3
    2. We use prompt engineering to tell LLaMA 3 exactly what format we want
    3. LLaMA 3 uses Transformer attention to identify key concepts
    4. It generates questions + 4 options + correct answer
    5. We parse the JSON response and return structured questions
    """
    prompt = f"""You are an expert quiz generator for Computer Science students.

Based on the following lecture notes, generate exactly {num_questions} multiple choice questions.

LECTURE NOTES:
{context}

INSTRUCTIONS:
- Generate exactly {num_questions} questions
- Each question must test understanding, not just memorization
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Make wrong options (distractors) plausible but clearly incorrect
- Questions should cover different topics from the notes
- Difficulty should be mixed (easy, medium, hard)

You MUST respond with ONLY a valid JSON array in this exact format:
[
  {{
    "question_text": "What is...",
    "option_a": "First option",
    "option_b": "Second option", 
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A"
  }}
]

Do not include any text before or after the JSON array.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a quiz generator. Always respond with valid JSON only. No explanations, no markdown, just the JSON array."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_tokens=4000
    )

    # Get the response text
    response_text = response.choices[0].message.content.strip()
    
    # Clean response - remove markdown if present
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()

    # Parse JSON
    questions = json.loads(response_text)
    return questions

def save_quiz_to_db(
    document_id: str,
    user_id: str,
    questions: list,
    title: str
) -> str:
    """
    Save generated quiz and questions to Supabase
    Returns the quiz_id
    """
    # Create quiz record
    quiz_id = str(uuid.uuid4())
    supabase.table("quizzes").insert({
        "id": quiz_id,
        "document_id": document_id,
        "user_id": user_id,
        "title": title,
        "total_questions": len(questions),
        "status": "active"
    }).execute()

    # Save each question
    for q in questions:
        supabase.table("questions").insert({
            "quiz_id": quiz_id,
            "question_text": q["question_text"],
            "option_a": q["option_a"],
            "option_b": q["option_b"],
            "option_c": q["option_c"],
            "option_d": q["option_d"],
            "correct_answer": q["correct_answer"].upper()
        }).execute()

    return quiz_id

def generate_quiz(
    document_id: str,
    user_id: str,
    num_questions: int = 10,
    title: str = "Quiz"
) -> dict:
    """
    MAIN FUNCTION: Complete quiz generation pipeline
    1. Get chunks from Supabase
    2. Prepare context for LLaMA 3
    3. Generate MCQs with LLaMA 3 via Groq
    4. Save quiz to Supabase
    5. Return quiz data
    """
    try:
        # Step 1: Get chunks
        print("Step 1: Getting document chunks...")
        chunks = get_document_chunks(document_id)
        
        if not chunks:
            return {"error": "No text chunks found for this document"}

        # Step 2: Prepare context
        print("Step 2: Preparing context for LLaMA 3...")
        context = prepare_context(chunks)

        # Step 3: Generate with LLaMA 3
        print(f"Step 3: Generating {num_questions} questions with LLaMA 3...")
        questions = generate_mcq_with_llama(context, num_questions)

        if not questions:
            return {"error": "Failed to generate questions"}

        # Step 4: Save to DB
        print("Step 4: Saving quiz to Supabase...")
        quiz_id = save_quiz_to_db(
            document_id, user_id, questions, title
        )

        print(f"✅ Quiz generated successfully! {len(questions)} questions")
        return {
            "success": True,
            "quiz_id": quiz_id,
            "title": title,
            "total_questions": len(questions),
            "questions": questions
        }

    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse AI response: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}

def get_quiz_by_id(quiz_id: str) -> dict:
    """Get quiz with all questions from Supabase"""
    # Get quiz info
    quiz = supabase.table("quizzes")\
        .select("*")\
        .eq("id", quiz_id)\
        .execute()

    if not quiz.data:
        return {"error": "Quiz not found"}

    # Get questions
    questions = supabase.table("questions")\
        .select("id, question_text, option_a, option_b, option_c, option_d")\
        .eq("quiz_id", quiz_id)\
        .execute()

    return {
        "quiz_id": quiz_id,
        "title": quiz.data[0]["title"],
        "total_questions": quiz.data[0]["total_questions"],
        "questions": [
            {
                "question_id": q["id"],
                "question_text": q["question_text"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"]
            }
            for q in questions.data
        ]
    }