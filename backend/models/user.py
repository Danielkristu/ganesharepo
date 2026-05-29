from pydantic import BaseModel, EmailStr
from typing import Optional


class TokenPayload(BaseModel):
    """Decoded Supabase JWT payload."""
    sub: str          # user UUID
    email: Optional[str] = None
    faculty: Optional[str] = None
    major: Optional[str] = None
    role: Optional[str] = None
    aud: Optional[str] = None
    exp: Optional[int] = None


class UserInfo(BaseModel):
    id: str
    email: Optional[str] = None
    faculty: Optional[str] = None
    major: Optional[str] = None
    role: Optional[str] = None
