"""
Supabase JWT Authentication Middleware for FastAPI.

Validates the Bearer token from the Authorization header using the
Supabase JWT secret (HMAC HS256). This allows the FastAPI service to
trust Supabase-issued tokens without making a network call.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from typing import Optional
from config import settings
from models.user import TokenPayload, UserInfo
from supabase import create_client, Client

_supabase: Client = create_client(settings.supabase_url, settings.supabase_secret_key)

bearer_scheme = HTTPBearer(auto_error=False)


def verify_supabase_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Optional[UserInfo]:
    """
    Dependency that extracts and validates the Supabase JWT from the
    Authorization: Bearer <token> header.

    Usage:
        @router.get("/protected")
        def protected_route(user: UserInfo = Depends(verify_supabase_jwt)):
            ...
    """
    if not credentials:
        return None

    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            # Supabase tokens are issued for the "authenticated" audience
            options={"verify_aud": False},
        )
        token_data = TokenPayload(**payload)
    except JWTError as exc:
        raise credentials_exception from exc

    if token_data.sub is None:
        raise credentials_exception

    return UserInfo(
        id=token_data.sub,
        email=token_data.email,
        faculty=token_data.faculty,
        major=token_data.major,
        role=token_data.role,
    )


def get_current_admin(user: Optional[UserInfo] = Depends(verify_supabase_jwt)) -> UserInfo:
    """
    Gatekeeper dependency: Verifies JWT, then queries the database to ensure
    the user holds the 'admin' role. Returns an enriched UserInfo with the
    admin's faculty/major from the database (authoritative, not just from JWT).
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )
    
    # Fetch role + faculty + major from profiles (authoritative source)
    response = _supabase.table("profiles").select("role, faculty, major").eq("email", user.email).single().execute()
    
    if not response.data or response.data.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin access required to perform this action."
        )

    # Return enriched UserInfo with db-authoritative faculty/major
    return UserInfo(
        id=user.id,
        email=user.email,
        role=response.data.get("role"),
        faculty=response.data.get("faculty"),
        major=response.data.get("major"),
    )
