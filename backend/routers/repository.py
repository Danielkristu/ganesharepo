"""
Repository Router — handles academic document operations.
All endpoints require a valid Supabase JWT.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import create_client, Client

from config import settings
from middleware.auth import verify_supabase_jwt, get_current_admin
from models.user import UserInfo
from models.document import DocumentMeta

router = APIRouter(prefix="/repository", tags=["Repository"])

# Service-role Supabase client (server-side, never exposed)
_supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_secret_key,
)


@router.get("/documents", response_model=list[DocumentMeta])
async def list_documents(
    search: str = Query(default="", description="Full-text search query"),
    category: str = Query(default="", description="Filter by category"),
    faculty: str = Query(default="", description="Filter by faculty (e.g., STEI, FTTM)"),
    major: str = Query(default="", description="Filter by major (e.g., Teknik Informatika)"),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
    user: Optional[UserInfo] = Depends(verify_supabase_jwt)
):
    """Return a paginated, searchable list of academic documents."""
    query = (
        _supabase.table("documents")
        .select("id, title, abstract, author, category, faculty, major, file_url, material_type, thumbnail_url, year, course_code, course_name, publish_mode, created_at")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )

    if search:
        query = query.ilike("title", f"%{search}%")
    if category:
        query = query.eq("category", category)
    if faculty:
        query = query.eq("faculty", faculty)
    if major:
        query = query.eq("major", major)
        
    # Enforce publish_mode authorization
    if user:
        if user.faculty:
            # Students and faculty users can see public docs, student-only docs, and faculty docs for their faculty.
            query = query.or_(
                f"publish_mode.eq.public,publish_mode.eq.student,and(publish_mode.eq.faculty,faculty.eq.{user.faculty})"
            )
        else:
            # Authenticated users without a faculty can still see public and student-only docs.
            query = query.or_("publish_mode.eq.public,publish_mode.eq.student")
    else:
        # Can only see public docs
        query = query.eq("publish_mode", "public")

    response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    if response.data is None:
        raise HTTPException(status_code=500, detail="Failed to fetch documents.")

    return response.data


@router.get("/documents/{doc_id}", response_model=DocumentMeta)
async def get_document(
    doc_id: str,
    user: Optional[UserInfo] = Depends(verify_supabase_jwt)
):
    """Return metadata for a single document."""
    response = (
        _supabase.table("documents")
        .select("id, title, abstract, author, category, faculty, major, file_url, material_type, thumbnail_url, year, course_code, course_name, publish_mode, created_at")
        .eq("id", doc_id)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc = response.data
    # Enforce publish_mode authorization
    if doc.get("publish_mode") == "faculty":
        if not user or not user.faculty or doc.get("faculty") != user.faculty:
            raise HTTPException(
                status_code=403, 
                detail="Access denied. This document is restricted to students within the same faculty."
            )

    return doc


@router.get("/admin/documents", response_model=list[DocumentMeta])
async def list_admin_documents(
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0),
    admin: UserInfo = Depends(get_current_admin)
):
    """Return a list of documents specifically belonging to the admin's faculty.
    This ensures admins can only manage their own faculty's documents in the dashboard.
    """
    if not admin.faculty:
        raise HTTPException(status_code=403, detail="Admin user has no assigned faculty.")

    query = (
        _supabase.table("documents")
        .select("id, title, abstract, author, category, faculty, major, file_url, material_type, thumbnail_url, year, course_code, course_name, publish_mode, created_at")
        .eq("faculty", admin.faculty)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )

    response = query.execute()
    if response.data is None:
        raise HTTPException(status_code=500, detail="Failed to fetch admin documents.")

    return response.data

import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class DocumentCreate(BaseModel):
    title: str
    abstract: Optional[str] = None
    author: str
    category: str
    faculty: Optional[str] = None
    major: Optional[str] = None
    file_url: str
    material_type: str = "file"
    thumbnail_url: Optional[str] = None
    year: Optional[int] = None
    course_code: str
    course_name: str
    publish_mode: str = "public"

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    faculty: Optional[str] = None
    major: Optional[str] = None
    file_url: Optional[str] = None
    material_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    year: Optional[int] = None
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    publish_mode: Optional[str] = None

@router.post("/documents", response_model=DocumentMeta)
async def create_document(
    doc: DocumentCreate,
    admin: UserInfo = Depends(get_current_admin),
):
    """Create a new document record. Admin-only; document faculty is locked to the admin's faculty."""
    # Enforce: admin can only create docs for their own faculty
    if admin.faculty and doc.faculty and doc.faculty != admin.faculty:
        raise HTTPException(
            status_code=403,
            detail=f"You can only create documents for your faculty ({admin.faculty})."
        )

    # Lock faculty to admin's faculty if not specified
    doc_faculty = doc.faculty or admin.faculty

    new_doc = {
        "id": str(uuid.uuid4()),
        "title": doc.title,
        "abstract": doc.abstract,
        "author": doc.author,
        "category": doc.category,
        "faculty": doc_faculty,
        "major": doc.major,
        "file_url": doc.file_url,
        "material_type": doc.material_type,
        "thumbnail_url": doc.thumbnail_url,
        "year": doc.year,
        "course_code": doc.course_code,
        "course_name": doc.course_name,
        "publish_mode": doc.publish_mode,
        "created_at": datetime.utcnow().isoformat()
    }
    try:
        response = _supabase.table("documents").insert(new_doc).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create document: no data returned.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}. Did you add the 'publish_mode' column?")

@router.put("/documents/{doc_id}", response_model=DocumentMeta)
async def update_document(
    doc_id: str,
    doc_update: DocumentUpdate,
    admin: UserInfo = Depends(get_current_admin),
):
    """Update an existing document record. Admin-only; can only update docs in their faculty."""
    # First fetch the document to verify it belongs to the admin's faculty
    existing = _supabase.table("documents").select("faculty").eq("id", doc_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc_faculty = existing.data.get("faculty")
    if admin.faculty and doc_faculty and doc_faculty != admin.faculty:
        raise HTTPException(
            status_code=403,
            detail=f"You can only update documents belonging to your faculty ({admin.faculty})."
        )

    # Prevent admin from reassigning a doc to a different faculty
    if doc_update.faculty and admin.faculty and doc_update.faculty != admin.faculty:
        raise HTTPException(
            status_code=403,
            detail=f"You cannot reassign a document to a different faculty ({doc_update.faculty})."
        )

    # Use exclude_unset=True so that explicitly provided nulls are kept.
    update_data = doc_update.model_dump(exclude_unset=True) if hasattr(doc_update, "model_dump") else doc_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update.")
        
    try:
        response = _supabase.table("documents").update(update_data).eq("id", doc_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found or update failed.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}.")


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    admin: UserInfo = Depends(get_current_admin),
):
    """Delete a document. Admin-only; can only delete docs in their faculty."""
    existing = _supabase.table("documents").select("faculty").eq("id", doc_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc_faculty = existing.data.get("faculty")
    if admin.faculty and doc_faculty and doc_faculty != admin.faculty:
        raise HTTPException(
            status_code=403,
            detail=f"You can only delete documents belonging to your faculty ({admin.faculty})."
        )

    _supabase.table("documents").delete().eq("id", doc_id).execute()
    return {"message": "Document deleted successfully."}
