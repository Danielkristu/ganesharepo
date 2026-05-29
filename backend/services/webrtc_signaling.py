"""
WebRTC Signaling Service — placeholder for LiveKit / Daily.co integration.
In production, this would manage room tokens and presence tracking.
"""
from dataclasses import dataclass, field
from typing import Optional
import uuid


@dataclass
class RoomState:
    room_id: str
    is_live: bool = False
    host_id: Optional[str] = None
    participants: set[str] = field(default_factory=set)
    active_speaker: Optional[str] = None


# In-memory room registry (replace with Redis in production)
_rooms: dict[str, RoomState] = {}


def get_or_create_room(room_id: str, host_id: Optional[str] = None) -> RoomState:
    if room_id not in _rooms:
        _rooms[room_id] = RoomState(room_id=room_id, host_id=host_id)
    return _rooms[room_id]


def set_live(room_id: str, is_live: bool) -> RoomState:
    room = get_or_create_room(room_id)
    room.is_live = is_live
    return room


def join_room(room_id: str, user_id: str) -> RoomState:
    room = get_or_create_room(room_id)
    room.participants.add(user_id)
    return room


def leave_room(room_id: str, user_id: str) -> RoomState:
    room = get_or_create_room(room_id)
    room.participants.discard(user_id)
    if room.active_speaker == user_id:
        room.active_speaker = None
    return room


def set_active_speaker(room_id: str, user_id: str) -> RoomState:
    room = get_or_create_room(room_id)
    room.active_speaker = user_id
    return room


def get_room_snapshot(room_id: str) -> dict:
    room = _rooms.get(room_id)
    if not room:
        return {"room_id": room_id, "is_live": False, "participant_count": 0}
    return {
        "room_id": room.room_id,
        "is_live": room.is_live,
        "host_id": room.host_id,
        "participant_count": len(room.participants),
        "active_speaker": room.active_speaker,
    }
