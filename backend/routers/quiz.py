"""
Quiz Router — admin creates quizzes, students submit answers and get graded.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

from config import settings
from middleware.auth import verify_supabase_jwt, get_current_admin
from models.user import UserInfo

router = APIRouter(prefix="/quiz", tags=["Quiz"])

_supabase: Client = create_client(settings.supabase_url, settings.supabase_secret_key)


# ── Request/Response models ────────────────────────────────────────────────────

class QuizQuestionInput(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str  # 'A' | 'B' | 'C' | 'D'
    image_url: Optional[str] = None


class CreateQuizRequest(BaseModel):
    title: str
    description: Optional[str] = None
    linked_type: Optional[str] = None   # 'document' | 'webinar'
    linked_id: Optional[str] = None
    linked_name: Optional[str] = None
    questions: list[QuizQuestionInput]


class SubmitQuizRequest(BaseModel):
    answers: dict[str, str]  # { question_id: 'A'|'B'|'C'|'D' }


# ── Admin Endpoints ────────────────────────────────────────────────────────────

@router.post("")
async def create_quiz(
    body: CreateQuizRequest,
    admin: UserInfo = Depends(get_current_admin),
):
    """Admin creates a quiz with its questions in one shot."""
    if not body.questions:
        raise HTTPException(status_code=400, detail="Quiz must have at least one question.")

    valid_options = {"A", "B", "C", "D"}
    for q in body.questions:
        if q.correct_option.upper() not in valid_options:
            raise HTTPException(status_code=400, detail=f"correct_option must be A, B, C, or D. Got: {q.correct_option}")

    quiz_id = str(uuid.uuid4())
    quiz_row = {
        "id": quiz_id,
        "title": body.title,
        "description": body.description or "",
        "linked_type": body.linked_type,
        "linked_id": body.linked_id,
        "linked_name": body.linked_name,
        "faculty": admin.faculty,
        "major": admin.major,
        "created_by": admin.email or admin.id,
        "is_published": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    try:
        quiz_resp = _supabase.table("quizzes").insert(quiz_row).execute()
        if not quiz_resp.data:
            raise HTTPException(status_code=500, detail="Failed to create quiz.")
    except Exception as e:
        print(f"Error inserting quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    question_rows = [
        {
            "id": str(uuid.uuid4()),
            "quiz_id": quiz_id,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_option": q.correct_option.upper(),
            "image_url": q.image_url,
            "order_index": idx,
        }
        for idx, q in enumerate(body.questions)
    ]

    q_resp = _supabase.table("quiz_questions").insert(question_rows).execute()
    if not q_resp.data:
        # rollback quiz
        _supabase.table("quizzes").delete().eq("id", quiz_id).execute()
        raise HTTPException(status_code=500, detail="Failed to create quiz questions.")

    return {"id": quiz_id, "title": body.title, "question_count": len(question_rows)}


@router.get("/admin")
async def list_quizzes_admin(admin: UserInfo = Depends(get_current_admin)):
    """Admin lists all quizzes they manage."""
    resp = (
        _supabase.table("quizzes")
        .select("id, title, description, linked_name, linked_type, is_published, created_at, faculty, major")
        .eq("created_by", admin.email)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []


@router.get("/admin/{quiz_id}")
async def get_quiz_admin(quiz_id: str, admin: UserInfo = Depends(get_current_admin)):
    """Admin views a quiz with correct answers (for editing / review)."""
    quiz_resp = (
        _supabase.table("quizzes")
        .select("*")
        .eq("id", quiz_id)
        .eq("created_by", admin.email)
        .single()
        .execute()
    )
    if not quiz_resp.data:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    q_resp = (
        _supabase.table("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz_id)
        .order("order_index")
        .execute()
    )

    return {**quiz_resp.data, "questions": q_resp.data or []}


@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: str, admin: UserInfo = Depends(get_current_admin)):
    """Admin deletes a quiz (cascades to questions and submissions)."""
    check = (
        _supabase.table("quizzes")
        .select("id")
        .eq("id", quiz_id)
        .eq("created_by", admin.email)
        .single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    _supabase.table("quizzes").delete().eq("id", quiz_id).execute()
    return {"success": True}


# ── Student Endpoints ──────────────────────────────────────────────────────────

@router.get("")
async def list_quizzes_student(
    user: UserInfo = Depends(verify_supabase_jwt),
    faculty: Optional[str] = Query(None),
):
    """Students list available published quizzes."""
    query = _supabase.table("quizzes").select(
        "id, title, description, linked_name, linked_type, linked_id, faculty, major, created_at"
    ).eq("is_published", True)

    if faculty:
        query = query.eq("faculty", faculty)

    resp = query.order("created_at", desc=True).execute()
    return resp.data or []


@router.get("/{quiz_id}")
async def get_quiz_student(
    quiz_id: str,
    user: UserInfo = Depends(verify_supabase_jwt),
):
    """Student gets a quiz to take — correct answers are NEVER returned here."""
    quiz_resp = (
        _supabase.table("quizzes")
        .select("id, title, description, linked_name, linked_type, linked_id, faculty, major")
        .eq("id", quiz_id)
        .eq("is_published", True)
        .single()
        .execute()
    )
    if not quiz_resp.data:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    # Check if already submitted
    student_id = user.email or user.id
    sub_resp = (
        _supabase.table("quiz_submissions")
        .select("id, score, answers, submitted_at")
        .eq("quiz_id", quiz_id)
        .eq("student_id", student_id)
        .execute()
    )

    q_resp = (
        _supabase.table("quiz_questions")
        .select("id, question_text, option_a, option_b, option_c, option_d, image_url, order_index")
        .eq("quiz_id", quiz_id)
        .order("order_index")
        .execute()
    )

    return {
        **quiz_resp.data,
        "questions": q_resp.data or [],
        "already_submitted": len(sub_resp.data or []) > 0,
        "prior_submission": sub_resp.data[0] if sub_resp.data else None,
    }


@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    body: SubmitQuizRequest,
    user: UserInfo = Depends(verify_supabase_jwt),
):
    """
    Student submits answers. Auto-grades and returns score + per-question results.
    Only one submission allowed per student per quiz.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    student_id = user.email or user.id

    # Prevent re-submission
    existing = (
        _supabase.table("quiz_submissions")
        .select("id, score")
        .eq("quiz_id", quiz_id)
        .eq("student_id", student_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="You have already submitted this quiz.")

    # Fetch correct answers
    q_resp = (
        _supabase.table("quiz_questions")
        .select("id, question_text, option_a, option_b, option_c, option_d, image_url, correct_option, order_index")
        .eq("quiz_id", quiz_id)
        .order("order_index")
        .execute()
    )
    questions = q_resp.data or []
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz not found or has no questions.")

    # Auto-grade
    total = len(questions)
    correct_count = 0
    results = []

    for q in questions:
        student_answer = body.answers.get(q["id"], "").upper()
        is_correct = student_answer == q["correct_option"]
        if is_correct:
            correct_count += 1
        results.append({
            "question_id": q["id"],
            "question_text": q["question_text"],
            "option_a": q["option_a"],
            "option_b": q["option_b"],
            "option_c": q["option_c"],
            "option_d": q["option_d"],
            "image_url": q.get("image_url"),
            "student_answer": student_answer,
            "correct_option": q["correct_option"],
            "is_correct": is_correct,
        })

    score = round((correct_count / total) * 100) if total > 0 else 0

    # Persist submission
    _supabase.table("quiz_submissions").insert({
        "id": str(uuid.uuid4()),
        "quiz_id": quiz_id,
        "student_id": student_id,
        "answers": body.answers,
        "score": score,
    }).execute()

    return {
        "score": score,
        "correct_count": correct_count,
        "total": total,
        "results": results,
    }
