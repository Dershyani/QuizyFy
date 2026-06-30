from groq import Groq
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.core.database import supabase
import uuid

client = Groq(api_key=settings.GROQ_API_KEY)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_relevant_chunks(question_text: str, document_id: str, top_k: int = 3) -> list:
    """
    RETRIEVAL step of RAG:
    1. Convert question to SBERT embedding (384-dim vector)
    2. Search Supabase pgvector using cosine similarity
    3. Return top 3 most similar chunks from student's PDF
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

    print(f"   Using fallback chunks...")
    fallback = supabase.table("text_chunks")\
        .select("chunk_text")\
        .eq("document_id", document_id)\
        .limit(top_k)\
        .execute()

    return [row['chunk_text'] for row in fallback.data]

def extract_topic(question_text: str) -> str:
    """
    Use LLaMA 3 to extract main topic keywords from question
    This gives us a better search query for web search
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a topic extractor. Extract the main Computer Science topic from a question. Return ONLY 3-5 keywords in English, nothing else. No sentences, no punctuation, just keywords."
            },
            {
                "role": "user",
                "content": f"Extract the main CS topic keywords from this question:\n{question_text}"
            }
        ],
        temperature=0.1,
        max_tokens=20
    )
    return response.choices[0].message.content.strip()

def search_web_resources(topic: str, question_text: str = "") -> list:
    """
    Search for relevant learning resources.
    Always guarantees at least 2 relevant links even if DuckDuckGo fails.
    """
    # Blocklist: sites unrelated to CS education
    blocked_domains = [
        "dictionary.cambridge.org",
        "merriam-webster.com",
        "dictionary.com",
        "thesaurus.com",
        "collinsdictionary.com",
        "vocabulary.com",
        "etymonline.com",
    ]

    trusted_domains = [
        "geeksforgeeks.org",
        "w3schools.com",
        "tutorialspoint.com",
        "javatpoint.com",
        "programiz.com",
        "freecodecamp.org",
        "developer.mozilla.org",
        "docs.python.org",
        "wikipedia.org",
        "medium.com",
        "stackoverflow.com",
        "youtube.com",
        "towardsdatascience.com",
        "cisco.com",
        "ibm.com",
        "nist.gov",
    ]

    # Build guaranteed fallback links using Google search (always works)
    topic_query = topic.replace(' ', '+')
    question_query = (question_text or topic).replace(' ', '+')
    guaranteed_links = [
        {
            "title": f"{topic} - GeeksforGeeks",
            "url": f"https://www.google.com/search?q={topic_query}+site%3Ageeksforgeeks.org",
            "description": f"Click to find articles about {topic} on GeeksforGeeks."
        },
        {
            "title": f"Search: {question_text[:60] if question_text else topic}",
            "url": f"https://www.google.com/search?q={question_query}",
            "description": f"Click to search for more information about this topic."
        }
    ]

    results = []

    try:
        from ddgs import DDGS

        search_query = f"{topic} computer science tutorial"

        with DDGS() as ddgs:
            search_results = list(ddgs.text(
                search_query,
                region="us-en",
                safesearch="on",
                max_results=15
            ))

        for r in search_results:
            url = r.get("href", "")
            if any(blocked in url for blocked in blocked_domains):
                continue
            if any(domain in url for domain in trusted_domains):
                results.append({
                    "title": r.get("title", "Learning Resource"),
                    "url": url,
                    "description": r.get("body", "")[:120] + "..."
                })
            if len(results) >= 2:
                break

    except Exception as e:
        print(f"Search error: {e}")

    # Always pad to 2 results using guaranteed Google links
    for gl in guaranteed_links:
        if len(results) >= 2:
            break
        results.append(gl)

    return results[:2]

def save_recommendations_to_db(answer_attempt_id: str, recommendations: list):
    """
    Save recommendations to answer_recommendations table
    This matches the SRD class diagram exactly:
    - recId (auto generated)
    - answerAttemptId (Foreign Key)
    - recommendedUrl
    - title
    """
    try:
        for rec in recommendations:
            supabase.table("answer_recommendations").insert({
                "id": str(uuid.uuid4()),
                "answer_attempt_id": answer_attempt_id,
                "url": rec["url"],
                "title": rec["title"]
            }).execute()
        print(f"   Saved {len(recommendations)} recommendations to DB!")
    except Exception as e:
        print(f"   Could not save recommendations: {e}")

def generate_explanation(
    question_text: str,
    correct_answer: str,
    correct_option_text: str,
    relevant_chunks: list
) -> str:
    """
    GENERATION step of RAG:
    1. Combine retrieved chunks as context
    2. Build prompt with question + correct answer + context
    3. LLaMA 3 generates explanation using student's own notes
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
                "content": "You are a helpful CS tutor. Give clear concise explanations based on provided lecture notes. Maximum 3 sentences."
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
    document_id: str,
    answer_attempt_id: str = None
) -> dict:
    """
    MAIN FUNCTION: Complete RAG + Recommendation pipeline

    Step 1: RETRIEVE relevant chunks from student's PDF
            using SBERT cosine similarity (all-MiniLM-L6-v2)

    Step 2: GENERATE explanation using LLaMA 3
            grounded in student's own lecture notes

    Step 3: EXTRACT topic using LLaMA 3

    Step 4: SEARCH web for relevant resources
            using DuckDuckGo (dynamic, not hardcoded!)

    Step 5: SAVE recommendations to DB
            matches answer_recommendations table
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

        # Step 2: Generate explanation
        print("RAG Step 2: Generating explanation with LLaMA 3...")
        explanation = generate_explanation(
            question_text,
            correct_answer,
            correct_option_text,
            chunks
        )

        # Step 3: Extract topic
        print("RAG Step 3: Extracting topic for recommendations...")
        topic = extract_topic(question_text)
        print(f"   Topic: {topic}")

        # Step 4: Search web
        print("RAG Step 4: Searching web for resources...")
        recommendations = search_web_resources(topic, question_text)
        print(f"   Found {len(recommendations)} resources!")

        # Step 5: Save to DB if answer_attempt_id provided
        if answer_attempt_id and recommendations:
            print("RAG Step 5: Saving recommendations to DB...")
            save_recommendations_to_db(answer_attempt_id, recommendations)

        print("✅ RAG feedback complete!")
        return {
            "success": True,
            "explanation": explanation,
            "recommendations": recommendations,
            "topic": topic,
            "chunks_used": len(chunks)
        }

    except Exception as e:
        print(f"❌ RAG error: {e}")
        return {
            "success": False,
            "explanation": "Could not generate explanation. Please try again.",
            "recommendations": []
        }