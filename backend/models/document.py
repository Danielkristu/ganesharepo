from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentMeta(BaseModel):
    id: str
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
    created_at: datetime


class DocumentSummaryResponse(BaseModel):
    id: str
    title: str
    abstract: Optional[str] = None
    page_count: int
    word_count: int
    keywords: list[str]
