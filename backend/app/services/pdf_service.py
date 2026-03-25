import pdfplumber
import spacy
import uuid
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from app.core.database import supabase

# Load AI models
nlp = spacy.load("en_core_web_sm")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def extract_text_from_pdf(file_path: str) -> str:
    """
    Step 1: Extract raw text from PDF using pdfplumber
    This is the first step in our pipeline
    """
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

def clean_text(text: str) -> str:
    """
    Step 2: Clean the extracted text
    Remove extra spaces, fix encoding issues
    """
    # Remove extra whitespace
    lines = [line.strip() for line in text.splitlines()]
    # Remove empty lines
    lines = [line for line in lines if line]
    return "\n".join(lines)

def verify_cs_content(text: str) -> dict:
    """
    Use LLaMA 3 to verify if PDF content is CS related
    
    WHY: QuizyFy is designed specifically for USM CS students
    Only CS-related lecture notes should be processed
    
    HOW:
    1. Take first 1000 chars of extracted text
    2. Send to LLaMA 3 for classification
    3. LLaMA 3 returns yes/no + reason
    """
    from groq import Groq
    from app.core.config import settings
    
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # Use first 1000 chars as sample
    sample = text[:1000]
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """You are a content classifier for a Computer Science education system.
Your job is to determine if a document is related to Computer Science.

Computer Science topics include:
- Programming, algorithms, data structures
- Networks, operating systems, databases
- AI, machine learning, software engineering
- Web development, cybersecurity, IoT
- Computer architecture, discrete math
- Any CS university course content

Respond with ONLY this JSON format, nothing else:
{"is_cs": true, "reason": "brief reason"}
or
{"is_cs": false, "reason": "brief reason"}"""
            },
            {
                "role": "user",
                "content": f"Is this document Computer Science related?\n\n{sample}"
            }
        ],
        temperature=0.1,
        max_tokens=100
    )
    
    import json
    try:
        result = json.loads(response.choices[0].message.content.strip())
        return result
    except:
        # If parsing fails, allow it through
        return {"is_cs": True, "reason": "Could not verify, allowing through"}

def chunk_text(text: str) -> list:
    """
    Step 3: Split text into chunks using LangChain
    This is token-based chunking that preserves sentence boundaries
    Why: LLaMA 3 has a token limit, so we split into manageable pieces
    Each chunk = ~300 words, with 50 word overlap to preserve context
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,      # characters per chunk
        chunk_overlap=200,    # overlap between chunks
        length_function=len,
        separators=["\n\n", "\n", ".", "!", "?", ",", " "]
    )
    chunks = splitter.split_text(text)
    return chunks

def generate_embeddings(chunks: list) -> list:
    """
    Step 4: Generate SBERT embeddings for each chunk
    Why: Converts text to numbers (vectors) so we can do similarity search
    Model: all-MiniLM-L6-v2 creates 384-dimensional vectors
    These vectors are stored in Supabase pgvector
    """
    embeddings = embedding_model.encode(chunks, show_progress_bar=False)
    return embeddings.tolist()

def save_chunks_to_db(document_id: str, chunks: list, embeddings: list):
    """
    Step 5: Save chunks and embeddings to Supabase pgvector
    This creates our searchable knowledge base from the student's notes
    """
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        supabase.table("text_chunks").insert({
            "document_id": document_id,
            "chunk_text": chunk,
            "embedding": embedding,
            "chunk_index": i
        }).execute()

def process_pdf(file_path: str, document_id: str) -> dict:
    """
    MAIN FUNCTION: Complete PDF processing pipeline
    
    Step 0: VERIFY CS content using LLaMA 3
    Step 1: Extract text (pdfplumber)
    Step 2: Clean text
    Step 3: Chunk text (LangChain)
    Step 4: Generate embeddings (SBERT)
    Step 5: Save to Supabase pgvector
    """
    try:
        # Step 1: Extract first
        print(f"Step 1: Extracting text from PDF...")
        raw_text = extract_text_from_pdf(file_path)
        
        if not raw_text:
            return {"error": "Could not extract text from PDF"}
        
        # Step 2: Clean
        print(f"Step 2: Cleaning text...")
        clean = clean_text(raw_text)
        
        # Step 0: Verify CS content AFTER extraction
        print(f"Step 0: Verifying CS content with LLaMA 3...")
        verification = verify_cs_content(clean)
        print(f"   CS related: {verification['is_cs']}")
        print(f"   Reason: {verification['reason']}")
        
        if not verification["is_cs"]:
            return {
                "error": f"This document does not appear to be Computer Science related. QuizyFy only supports CS lecture notes. ({verification['reason']})"
            }
        
        # Step 3: Chunk
        print(f"Step 3: Chunking text...")
        chunks = chunk_text(clean)
        print(f"   Created {len(chunks)} chunks")
        
        # Step 4: Embeddings
        print(f"Step 4: Generating SBERT embeddings...")
        embeddings = generate_embeddings(chunks)
        print(f"   Generated {len(embeddings)} embeddings")
        
        # Step 5: Save to DB
        print(f"Step 5: Saving to Supabase pgvector...")
        save_chunks_to_db(document_id, chunks, embeddings)
        
        print(f"✅ PDF processed successfully!")
        return {
            "success": True,
            "text_length": len(clean),
            "num_chunks": len(chunks),
            "raw_text": clean
        }
        
    except Exception as e:
        print(f"❌ Error processing PDF: {e}")
        return {"error": str(e)}