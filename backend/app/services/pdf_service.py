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
    Runs all 5 steps in order:
    1. Extract text (pdfplumber)
    2. Clean text (NLP preprocessing)
    3. Chunk text (LangChain token splitter)
    4. Generate embeddings (SBERT all-MiniLM-L6-v2)
    5. Save to Supabase pgvector
    """
    try:
        # Step 1: Extract
        print(f"Step 1: Extracting text from PDF...")
        raw_text = extract_text_from_pdf(file_path)
        
        if not raw_text:
            return {"error": "Could not extract text from PDF"}
        
        # Step 2: Clean
        print(f"Step 2: Cleaning text...")
        clean = clean_text(raw_text)
        
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