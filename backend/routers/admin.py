from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from supabase import create_client, Client

from config import settings
from models.user import UserInfo
from middleware.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

_supabase: Client = create_client(settings.supabase_url, settings.supabase_secret_key)


class RoleUpdateRequest(BaseModel):
    role: Literal["student", "admin"]


class MemberProfile(BaseModel):
    email: str
    role: str
    faculty: Optional[str] = None
    major: Optional[str] = None


@router.get("/users", response_model=list[MemberProfile])
def list_faculty_members(admin: UserInfo = Depends(get_current_admin)):
    """List all logged-in members belonging to the admin's faculty."""
    if not admin.faculty:
        raise HTTPException(status_code=403, detail="Admin faculty is not configured.")

    query = _supabase.table("profiles").select("email, role, faculty, major").order("email")

    query = query.eq("faculty", admin.faculty)

    response = query.execute()
    return response.data or []


@router.patch("/users/{email}", response_model=MemberProfile)
def update_member_role(
    email: str,
    payload: RoleUpdateRequest,
    admin: UserInfo = Depends(get_current_admin),
):
    """Promote or demote a logged-in member within the admin's faculty."""
    if not admin.faculty:
        raise HTTPException(status_code=403, detail="Admin faculty is not configured.")

    response = _supabase.table("profiles").select("email, role, faculty, major").eq("email", email).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Member not found.")

    member = response.data
    if email == admin.email:
        admins_in_faculty = (
            _supabase.table("profiles")
            .select("email")
            .eq("faculty", admin.faculty)
            .eq("role", "admin")
            .execute()
        )
        if len(admins_in_faculty.data or []) <= 1:
            raise HTTPException(
                status_code=403,
                detail="You are the only admin in your faculty, so you cannot change your own role.",
            )

    if member.get("faculty") and member.get("faculty") != admin.faculty:
        raise HTTPException(
            status_code=403,
            detail=f"You can only manage members belonging to your faculty ({admin.faculty}).",
        )

    updated = (
        _supabase.table("profiles")
        .update({"role": payload.role})
        .eq("email", email)
        .execute()
    )

    if not updated.data:
        raise HTTPException(status_code=500, detail="Failed to update member role.")

    return updated.data[0]

@router.post("/webinar/create")
def create_webinar(admin: UserInfo = Depends(get_current_admin)):
    """
    Privileged endpoint. Only accessible if get_current_admin successfully validates 
    the JWT and confirms the user's role is 'admin' in the database.
    """
    return {
        "status": "success",
        "message": "Webinar created successfully.",
        "admin_id": admin.id
    }
