from groq import Groq
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.core.database import supabase

client = Groq(api_key=settings.GROQ_API_KEY)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_relevant_chunks(question_text: str, document_id: str, top_k: int = 3) -> list:
    """
    RETRIEVAL step of RAG:
    1. Convert question text to SBERT embedding (384-dim vector)
    2. Search Supabase pgvector using cosine similarity
    3. Return top 3 most similar chunks from student's PDF

    This finds the most relevant parts of 
    the lecture notes for this question
    """
    print(f"   Converting question to SBERT embedding...")
    question_embedding = embedding_model.encode(question_text).tolist()

    print(f"   Searching pgvector with cosine similarity...")
    result = supabase.rpc(
        'match_chunks',
        {
            'query_embedding': question_embedding,
            'match_document_id': document_id,
            'match_count': top_k
        }
    ).execute()

    if result.data:
        print(f"   Found {len(result.data)} relevant chunks!")
        return [row['chunk_text'] for row in result.data]

    # Fallback if RPC fails
    print(f"   Using fallback chunks...")
    fallback = supabase.table("text_chunks")\
        .select("chunk_text")\
        .eq("document_id", document_id)\
        .limit(top_k)\
        .execute()

    return [row['chunk_text'] for row in fallback.data]

def generate_explanation(
    question_text: str,
    correct_answer: str,
    correct_option_text: str,
    relevant_chunks: list
) -> str:
    """
    GENERATION step of RAG:
    1. Combine retrieved chunks as context
    2. Build prompt with question + answer + context
    3. LLaMA 3 generates explanation using student's notes

    This is what makes QuizyFy special —
    explanation comes from YOUR own lecture notes!
    """
    context = "\n\n".join(relevant_chunks)

    prompt = f"""You are a helpful tutor explaining why a student got a quiz question wrong.

Based on the following lecture notes, explain why the correct answer is correct.
Keep your explanation clear and concise (2-3 sentences maximum).
Reference specific concepts from the lecture notes.

LECTURE NOTES:
{context}

QUESTION: {question_text}

CORRECT ANSWER: Option {correct_answer} - {correct_option_text}

Explain why Option {correct_answer} is correct based on the lecture notes above."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful CS tutor. Give clear concise explanations based on the provided lecture notes. Maximum 3 sentences. Always reference the lecture notes."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        max_tokens=300
    )

    return response.choices[0].message.content.strip()

def generate_rag_feedback(
    question_text: str,
    correct_answer: str,
    correct_option_text: str,
    document_id: str
) -> dict:
    """
    MAIN FUNCTION: RAG pipeline for explanation only

    Step 1: RETRIEVE relevant chunks from student's PDF
            using SBERT cosine similarity (all-MiniLM-L6-v2)

    Step 2: GENERATE explanation using LLaMA 3
            grounded in student's own lecture notes
    """
    try:
        # Step 1: Retrieve
        print("RAG Step 1: Retrieving relevant chunks...")
        chunks = get_relevant_chunks(question_text, document_id)

        if not chunks:
            return {
                "success": False,
                "explanation": "Could not find relevant content in your notes.",
                "recommendations": []
            }

        # Step 2: Generate
        print("RAG Step 2: Generating explanation with LLaMA 3...")
        explanation = generate_explanation(
            question_text,
            correct_answer,
            correct_option_text,
            chunks
        )

        print("✅ Explanation generated!")
        return {
            "success": True,
            "explanation": explanation,
            "recommendations": [],
            "chunks_used": len(chunks)
        }

    except Exception as e:
        print(f"❌ RAG error: {e}")
        return {
            "success": False,
            "explanation": "Could not generate explanation. Please try again.",
            "recommendations": []
        }