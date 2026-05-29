"""
Webinar Router — handles conference room management and Q&A.
Backed by LiveKit Cloud for real video conferencing.
All endpoints require a valid Supabase JWT.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import create_client, Client
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from config import settings
from middleware.auth import verify_supabase_jwt, get_current_admin
from models.user import UserInfo
from models.webinar import WebinarRoom, WebinarQuestion, AskQuestionRequest

router = APIRouter(prefix="/webinar", tags=["Webinar"])

_supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_secret_key,
)


# ── LiveKit helpers ────────────────────────────────────────────────────────────

def _livekit_available() -> bool:
    return bool(settings.livekit_api_key and settings.livekit_api_secret)


async def _create_livekit_room(room_name: str) -> None:
    """Provision a room on LiveKit Cloud via the server SDK."""
    if not _livekit_available():
        return  # Room is "virtual" — created on first join automatically by LiveKit

    from livekit.api import LiveKitAPI
    from livekit.protocol.room import CreateRoomRequest

    async with LiveKitAPI(
        url=settings.livekit_ws_url,
        api_key=settings.livekit_api_key,
        api_secret=settings.livekit_api_secret,
    ) as lk:
        await lk.room.create_room(
            CreateRoomRequest(
                name=room_name,
                empty_timeout=60 * 30,   # 30 min idle before LiveKit removes it
                max_participants=100,
            )
        )


def _generate_livekit_token(room_name: str, identity: str, display_name: str, can_publish: bool = True) -> str:
    """Generate a signed participant token (no network call)."""
    from livekit.api import AccessToken, VideoGrants

    at = (
        AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(identity)
        .with_name(display_name)
        .with_grants(
            VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=can_publish,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
    )
    return at.to_jwt()


# ── Request models ─────────────────────────────────────────────────────────────

class CreateWebinarRequest(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: str  # ISO 8601


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/rooms", response_model=WebinarRoom)
async def create_room(
    body: CreateWebinarRequest,
    admin: UserInfo = Depends(get_current_admin),
):
    """Admin creates a new webinar room backed by a LiveKit room."""
    room_name = f"ganesha-{uuid.uuid4().hex[:10]}"

    # Provision the room on LiveKit (no-op if keys not configured)
    await _create_livekit_room(room_name)

    room_id = str(uuid.uuid4())
    row = {
        "id": room_id,
        "title": body.title,
        "description": body.description or "",
        "host_id": admin.id,
        "status": "scheduled",
        "room_url": room_name,   # stores the LiveKit room name
        "scheduled_at": body.scheduled_at,
        "created_at": datetime.utcnow().isoformat(),
    }

    resp = _supabase.table("webinar_rooms").insert(row).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to save webinar room.")

    return resp.data[0]


@router.get("/rooms/{room_id}/token")
async def get_room_token(
    room_id: str,
    user: UserInfo = Depends(verify_supabase_jwt),
):
    """
    Generate a LiveKit participant token for a webinar room.
    Any authenticated user can join as a viewer; host/admin can publish.
    """
    if not _livekit_available():
        raise HTTPException(
            status_code=503,
            detail="LiveKit is not configured. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_WS_URL to your .env.local.",
        )

    # Fetch the room to get its LiveKit room name
    room_resp = (
        _supabase.table("webinar_rooms")
        .select("id, room_url, host_id, status")
        .eq("id", room_id)
        .single()
        .execute()
    )
    if not room_resp.data:
        raise HTTPException(status_code=404, detail="Webinar room not found.")

    room = room_resp.data
    if room["status"] == "ended":
        raise HTTPException(status_code=410, detail="This webinar has ended.")

    room_name = room["room_url"]   # We stored the LiveKit room name here
    identity = user.id or user.email or "anonymous"
    display_name = user.email or "Student"

    # Host/admin can publish video+audio; others are viewers by default
    is_host = (room["host_id"] == user.id) or (room["host_id"] == user.email)
    can_publish = is_host

    token = _generate_livekit_token(room_name, identity, display_name, can_publish)

    return {
        "token": token,
        "room_name": room_name,
        "server_url": settings.livekit_ws_url,
    }


@router.get("/rooms", response_model=list[WebinarRoom])
async def list_rooms(user: UserInfo = Depends(verify_supabase_jwt)):
    """Return all webinar rooms ordered by scheduled date."""
    response = (
        _supabase.table("webinar_rooms")
        .select("id, title, description, host_id, status, room_url, scheduled_at, created_at")
        .order("scheduled_at", desc=True)
        .execute()
    )
    return response.data or []


@router.get("/rooms/{room_id}", response_model=WebinarRoom)
async def get_room(room_id: str, user: UserInfo = Depends(verify_supabase_jwt)):
    """Return a single webinar room."""
    response = (
        _supabase.table("webinar_rooms")
        .select("*")
        .eq("id", room_id)
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Webinar room not found.")
    return response.data


@router.patch("/rooms/{room_id}/status")
async def update_room_status(
    room_id: str,
    status: str = Query(...),
    admin: UserInfo = Depends(get_current_admin),
):
    """Admin transitions room status: scheduled → live → ended."""
    if status not in ("scheduled", "live", "ended"):
        raise HTTPException(status_code=400, detail="Invalid status value.")

    # Get the room first to find its livekit room_url
    room_resp = (
        _supabase.table("webinar_rooms")
        .select("room_url")
        .eq("id", room_id)
        .single()
        .execute()
    )
    if not room_resp.data:
        raise HTTPException(status_code=404, detail="Room not found.")

    # Update in DB
    resp = (
        _supabase.table("webinar_rooms")
        .update({"status": status})
        .eq("id", room_id)
        .execute()
    )

    # If ended, forcefully close the LiveKit room so it stops using free tier minutes
    if status == "ended" and _livekit_available():
        room_name = room_resp.data.get("room_url")
        if room_name:
            try:
                from livekit.api import LiveKitAPI
                async with LiveKitAPI(
                    url=settings.livekit_ws_url,
                    api_key=settings.livekit_api_key,
                    api_secret=settings.livekit_api_secret,
                ) as lk:
                    await lk.room.delete_room(room_name)
            except Exception as e:
                print(f"Failed to delete LiveKit room {room_name}: {e}")

    return {"success": True, "status": status}


@router.get("/rooms/{room_id}/questions", response_model=list[WebinarQuestion])
async def list_questions(room_id: str, user: UserInfo = Depends(verify_supabase_jwt)):
    """Return Q&A questions for a webinar room, ordered by upvotes."""
    response = (
        _supabase.table("webinar_questions")
        .select("*")
        .eq("webinar_id", room_id)
        .order("upvotes", desc=True)
        .execute()
    )
    return response.data or []


@router.post("/rooms/{room_id}/questions", response_model=WebinarQuestion)
async def ask_question(
    room_id: str,
    body: AskQuestionRequest,
    user: UserInfo = Depends(verify_supabase_jwt),
):
    """Submit a new question to a webinar's Q&A sidebar."""
    response = (
        _supabase.table("webinar_questions")
        .insert(
            {
                "id": str(uuid.uuid4()),
                "webinar_id": room_id,
                "user_id": user.id,
                "question": body.question[:500],
                "upvotes": 0,
                "answered": False,
                "created_at": datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to submit question.")

    return response.data[0]


@router.post("/rooms/{room_id}/questions/{question_id}/upvote")
async def upvote_question(
    room_id: str,
    question_id: str,
    user: UserInfo = Depends(verify_supabase_jwt),
):
    """Upvote a Q&A question."""
    current = (
        _supabase.table("webinar_questions")
        .select("upvotes")
        .eq("id", question_id)
        .eq("webinar_id", room_id)
        .single()
        .execute()
    )
    if not current.data:
        raise HTTPException(status_code=404, detail="Question not found.")

    new_count = current.data["upvotes"] + 1
    _supabase.table("webinar_questions").update({"upvotes": new_count}).eq("id", question_id).execute()

    return {"success": True, "upvotes": new_count}
