import os
import sys
import time

# Ensure we can import app modules from backend directory
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import supabase
from app.services.rag_service import get_relevant_chunks
from sentence_transformers import SentenceTransformer

def check_database_and_index():
    print("=" * 60)
    print("[DIAGNOSTICS] QUIZYFY: DATABASE & HNSW VECTOR INDEX DIAGNOSTICS")
    print("=" * 60)
    
    # 1. Check database connection
    try:
        print("[1/4] Connecting to Supabase...")
        doc_response = supabase.table("documents").select("id, filename").limit(1).execute()
        print(" -> Connection Successful!")
    except Exception as e:
        print(f" -> Connection Failed: {e}")
        print("\nPlease check that your SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env are correct.")
        return

    # 2. Check for processed documents
    print("\n[2/4] Checking for processed lecture notes...")
    docs = supabase.table("documents").select("id, filename").order("uploaded_at", desc=True).limit(5).execute()
    
    if not docs.data:
        print(" -> No documents found in the database yet.")
        print(" -> Action required: Log in as a student/admin and upload a CS PDF to populate the database, then rerun this script.")
        return
        
    print(f" -> Found {len(docs.data)} document(s) in the database:")
    for idx, doc in enumerate(docs.data):
        print(f"   [{idx + 1}] ID: {doc['id']} | File: {doc['filename']}")
        
    selected_doc = docs.data[0]
    print(f"\n -> Using latest document for RAG verification: '{selected_doc['filename']}' ({selected_doc['id']})")

    # 3. Check for text chunks inside pgvector
    print("\n[3/4] Checking for embedded text chunks...")
    chunks_check = supabase.table("text_chunks").select("id").eq("document_id", selected_doc["id"]).limit(5).execute()
    
    if not chunks_check.data:
        print(" -> Error: No text chunks found in database for this document!")
        print(" -> Action required: Re-upload this document through the UI to ensure embeddings are successfully generated and saved.")
        return
    print(f" -> Embedded text chunks are present in the 'text_chunks' table!")

    # 4. Perform vector similarity search and measure execution speed
    query_text = "What is the core computer science concept explained in this slide?"
    print(f"\n[4/4] Testing Cosine Similarity Search (RAG Pipeline)...")
    print(f"   Query: \"{query_text}\"")
    
    try:
        start_time = time.time()
        # Retrieve the relevant chunks using all-MiniLM-L6-v2 + pgvector Cosine similarity
        retrieved_chunks = get_relevant_chunks(query_text, selected_doc["id"], top_k=3)
        end_time = time.time()
        
        duration_ms = (end_time - start_time) * 1000
        print(f" -> Vector search complete in {duration_ms:.2f} ms!")
        
        if retrieved_chunks:
            print(f" -> Successfully retrieved {len(retrieved_chunks)} relevant chunks using pgvector:")
            for idx, chunk in enumerate(retrieved_chunks):
                # Print first 150 characters of the chunk for verification
                preview = chunk.replace('\n', ' ')[:150] + "..." if len(chunk) > 150 else chunk.replace('\n', ' ')
                print(f"   [Chunk {idx + 1}]: {preview}")
        else:
            print(" -> Vector search did not return any chunks (using fallback). Check if 'match_chunks' function exists in Supabase.")
            
    except Exception as e:
        print(f" -> Error executing vector search: {e}")
        print("\n -> Common cause: The Supabase database function 'match_chunks' is missing or has a parameter mismatch.")
        print("Please check that you have created the 'match_chunks' function in your Supabase SQL Editor.")

    print("\n" + "=" * 60)
    print("TO MANUALLY CHECK THE HNSW INDEX STATUS:")
    print("Run the following query in your Supabase SQL Editor:")
    print("   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'text_chunks';")
    print("You should see 'text_chunks_embedding_hnsw_idx' in the results.")
    print("=" * 60)

if __name__ == "__main__":
    check_database_and_index()
