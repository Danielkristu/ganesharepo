"""
Analytics Router — document download and webinar attendance stats.
Demonstrates Python backend adding value beyond raw Supabase queries.
"""
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client

from config import settings
from middleware.auth import verify_supabase_jwt
from models.user import UserInfo
from services.pdf_processor import process_pdf_from_url
from models.document import DocumentSummaryResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])

_supabase = create_client(settings.supabase_url, settings.supabase_secret_key)


from typing import Optional

@router.get("/documents/{doc_id}/summary", response_model=DocumentSummaryResponse)
async def document_summary(
    doc_id: str,
    user: Optional[UserInfo] = Depends(verify_supabase_jwt),
):
    """
    Fetch a document's PDF from storage, process it with PyMuPDF,
    and return an AI-ready summary with keyword extraction.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required for analytics.")

    # 1. Get document metadata
    resp = (
        _supabase.table("documents")
        .select("id, title, abstract, file_url")
        .eq("id", doc_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc = resp.data

    # 2. Process PDF (Python-specific capability)
    try:
        pdf_data = await process_pdf_from_url(doc["file_url"])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"PDF processing failed: {exc}") from exc

    return DocumentSummaryResponse(
        id=doc["id"],
        title=doc["title"],
        abstract=doc.get("abstract") or pdf_data["preview"],
        page_count=pdf_data["page_count"],
        word_count=pdf_data["word_count"],
        keywords=pdf_data["keywords"],
    )
