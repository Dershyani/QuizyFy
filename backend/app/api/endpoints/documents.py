import os
import uuid
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import supabase
from app.services.auth_service import get_current_user
from app.services.pdf_service import process_pdf

router = APIRouter()
security = HTTPBearer()

# Temp folder to store uploaded PDFs
UPLOAD_FOLDER = "temp_uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Upload a PDF and process it through our pipeline:
    1. Save PDF temporarily
    2. Extract text (pdfplumber)
    3. Clean + chunk text (spaCy + LangChain)
    4. Generate SBERT embeddings
    5. Save to Supabase pgvector
    6. Return document_id for quiz generation
    """
    # Get current user from token
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Check file is PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed!"
        )

    # Check file size (max 25MB)
    MAX_SIZE = 25 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large! Maximum size is 25MB"
        )

    try:
        # Save PDF temporarily
        document_id = str(uuid.uuid4())
        temp_path = f"{UPLOAD_FOLDER}/{document_id}.pdf"
        
        with open(temp_path, "wb") as f:
            f.write(content)

        # Save document record to Supabase
        doc_result = supabase.table("documents").insert({
            "id": document_id,
            "user_id": user["id"],
            "filename": file.filename,
            "file_size": len(content)
        }).execute()

        # Process PDF through our pipeline
        result = process_pdf(temp_path, document_id)

        # Update text content in Supabase
        if "raw_text" in result:
            supabase.table("documents").update({
                "text_content": result["raw_text"][:5000]
            }).eq("id", document_id).execute()

        # Delete temp file
        os.remove(temp_path)

        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )

        return {
            "message": "PDF uploaded and processed successfully!",
            "document_id": document_id,
            "filename": file.filename,
            "num_chunks": result["num_chunks"],
            "text_length": result["text_length"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-documents")
def get_my_documents(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all documents uploaded by current user"""
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = supabase.table("documents")\
        .select("id, filename, file_size, uploaded_at")\
        .eq("user_id", user["id"])\
        .order("uploaded_at", desc=True)\
        .execute()

    return {"documents": result.data}