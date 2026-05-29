from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class WebinarStatus(str, Enum):
    scheduled = "scheduled"
    live = "live"
    ended = "ended"


class WebinarRoom(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    host_id: str
    status: WebinarStatus
    room_url: Optional[str] = None   # Daily.co / LiveKit room URL
    scheduled_at: datetime
    created_at: datetime


class WebinarQuestion(BaseModel):
    id: str
    webinar_id: str
    user_id: str
    question: str
    upvotes: int = 0
    answered: bool = False
    created_at: datetime


class AskQuestionRequest(BaseModel):
    webinar_id: str
    question: str
