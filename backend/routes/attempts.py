"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL ATTEMPTS ROUTER
Namespace: /api/v1/attempts/...
Authoritative Quiz Attempts, Answer Persistence, Auto-Grading & Proctoring
================================================================================
"""

import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.config.database import get_db
from backend.auth import AuthenticatedUser, get_optional_user
from backend.schemas.quiz import QuizSubmitRequest, SecurityEventRequest
from backend.services.quiz_service import QuizService
from backend.utils.helpers import success_response, error_response, ensure_utc

router = APIRouter(prefix="/attempts", tags=["Quiz Attempts & Grading"])


@router.get("/{attempt_id}")
def get_attempt_status(
    attempt_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/attempts/{attempt_id}
    Retrieves current attempt metadata, answers and server-calculated timer.
    """
    att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
    if not att:
        return error_response("Attempt not found", 404)
    data = dict(att._mapping)

    qid = str(data["quiz_id"])
    quiz = db.execute(text("SELECT duration_minutes, title FROM quizzes WHERE id = :id"), {"id": qid}).fetchone()
    dur_mins = int(quiz[0]) if quiz else 30

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    started_at = ensure_utc(data.get("started_at"))
    elapsed = int((now - started_at).total_seconds()) if started_at else 0
    remaining = max(0, (dur_mins * 60) - elapsed)

    data["duration_minutes"] = dur_mins
    data["elapsed_seconds"] = elapsed
    data["remaining_seconds"] = remaining
    data["server_time"] = now.isoformat()

    ans_rows = db.execute(text("SELECT * FROM quiz_attempt_answers WHERE attempt_id = :id"), {"id": attempt_id}).fetchall()
    data["saved_answers"] = [dict(a._mapping) for a in ans_rows]
    return success_response(data)


@router.put("/{attempt_id}/answers")
def save_attempt_answers(
    attempt_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    PUT /api/v1/attempts/{attempt_id}/answers
    Autosaves student answers in real-time. Enforces ownership and in_progress status.
    """
    student_id = current_user.user_id if current_user else None
    answers = payload.get("answers", payload)
    try:
        res = QuizService.save_attempt_answers(
            attempt_id=attempt_id,
            answers_data=answers,
            student_identifier=student_id,
            db=db
        )
        return success_response(res, "Answers saved successfully")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Autosave failed: {str(e)}", 500)


@router.post("/{attempt_id}/submit")
def submit_quiz_attempt(
    attempt_id: str,
    payload: QuizSubmitRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/attempts/{attempt_id}/submit
    Submits quiz attempt for authoritative server-side auto-evaluation and grading.
    Calculates final score 100% on server and prevents duplicate submissions.
    """
    student_id = current_user.user_id if current_user else None
    try:
        result = QuizService.evaluate_submission(
            attempt_id=attempt_id,
            answers=payload.answers or [],
            is_auto_submit=bool(payload.is_auto_submit),
            db=db,
            student_identifier=student_id
        )
        return success_response(result, "Quiz submitted and evaluated successfully")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Submission evaluation error: {str(e)}", 500)


@router.get("/{attempt_id}/result")
def get_attempt_result(
    attempt_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/attempts/{attempt_id}/result
    Retrieves student scorecard and breakdown if results are released.
    """
    role = (current_user.role or "").lower() if current_user else "student"
    is_teacher_or_admin = role in ("teacher", "faculty", "hod", "admin", "superadmin")

    try:
        data = QuizService.get_attempt_result(
            attempt_id=attempt_id,
            is_teacher_or_admin=is_teacher_or_admin,
            db=db
        )
        return success_response(data)
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f"Could not load results: {str(e)}", 500)


@router.post("/{attempt_id}/security-event")
def record_security_event(
    attempt_id: str,
    payload: SecurityEventRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/attempts/{attempt_id}/security-event
    Logs anti-cheating & proctoring anomalies (tab switches, fullscreen exits, window blur).
    """
    try:
        res = QuizService.record_security_event(
            attempt_id=attempt_id,
            event_type=payload.event_type,
            metadata=payload.metadata,
            db=db
        )
        return success_response(res, "Security event logged successfully")
    except Exception as e:
        return error_response(f"Failed to record event: {str(e)}", 400)
