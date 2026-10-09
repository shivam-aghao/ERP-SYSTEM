"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL QUIZZES ROUTER
Namespace: /api/v1/quizzes/...
Authoritative Online Examination, Question Bank & Quiz Administration
================================================================================
"""

import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.config.database import get_db
from backend.auth import AuthenticatedUser, get_optional_user
from backend.rbac.service import RBACService
from backend.rbac.models import Permission
from backend.schemas.quiz import QuestionBankCreate, QuizCreateSchema, QuizUpdateSchema
from backend.services.quiz_service import QuizService
from backend.utils.helpers import success_response, error_response

router = APIRouter(prefix="/quizzes", tags=["Quizzes & Examination Assessment"])


@router.get("")
@router.get("/")
def get_all_quizzes(
    class_id: Optional[str] = Query(None),
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/quizzes
    List quizzes:
    - If student: returns active/published quizzes for their class with attempt status.
    - If teacher/admin: returns all quizzes filtered by class.
    """
    role = (current_user.role or "").lower() if current_user else None

    # Student perspective
    if role == "student" or (not role and student_code):
        sc = (current_user.identifier if current_user and role == "student" else student_code) or "308637"
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id::text = :c LIMIT 1"), {"c": sc}).fetchone()
        if not st:
            st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
        if not st:
            return success_response([])

        sm = st._mapping
        cid = str(class_id).strip() if class_id else (str(sm["class_id"]) if sm.get("class_id") else "")
        sid = str(sm["id"]) if sm.get("id") else ""

        quizzes = db.execute(text("""
            SELECT q.*, c.class_name, COALESCE(s.name, 'General Subject') as subject_name,
                   (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
                   (SELECT qa.status FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1) as attempt_status,
                   CASE 
                       WHEN q.result_published = TRUE THEN (SELECT qa.final_marks FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1)
                       ELSE NULL
                   END as attempt_score,
                   (SELECT qa.id FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1) as attempt_id
            FROM quizzes q
            JOIN classes c ON q.class_id = c.id
            LEFT JOIN subjects s ON q.subject_id = s.id
            WHERE (q.class_id::text = :cid OR c.class_name = :cid) AND (q.result_published = TRUE OR UPPER(q.status) IN ('ACTIVE', 'PUBLISHED', 'SCHEDULED'))
            ORDER BY q.created_at DESC
        """), {"cid": str(cid), "sid": str(sid)}).fetchall()
        return success_response([dict(r._mapping) for r in quizzes])

    # Teacher / Admin perspective
    clause = "WHERE 1=1"
    params = {}
    if class_id:
        clause += " AND (q.class_id::text = :cid OR c.class_name = :cid)"
        params["cid"] = class_id

    rows = db.execute(text(f"""
        SELECT q.*, c.class_name, COALESCE(s.name, 'General') as subject_name,
               (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
               (SELECT count(*) FROM quiz_attempts WHERE quiz_id = q.id AND status IN ('submitted', 'auto_submitted', 'SUBMITTED', 'evaluated')) as attempt_count
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        {clause}
        ORDER BY q.created_at DESC
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_quiz(
    payload: QuizCreateSchema,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/quizzes
    Creates a new quiz definition. Enforces 'quiz.create' permission.
    """
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_CREATE.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not possess permission 'quiz.create' to create quizzes."
        )

    teacher_id = (current_user.user_id or current_user.identifier) if current_user else "EMP-CSE-1001"
    try:
        created = QuizService.create_quiz(payload=payload, teacher_id=teacher_id, db=db)
        return success_response(created, "Quiz created successfully", code=201)
    except Exception as e:
        return error_response(f"Quiz creation failed: {str(e)}", 400)


@router.get("/{quiz_id}")
def get_quiz_details(
    quiz_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/quizzes/{quiz_id}
    Retrieves quiz definition. For students, correct answers and explanations are stripped.
    """
    try:
        import uuid as _u
        _u.UUID(str(quiz_id).strip())
    except (ValueError, AttributeError):
        return error_response("Quiz not found", 404)

    row = db.execute(text("SELECT q.*, c.class_name FROM quizzes q LEFT JOIN classes c ON q.class_id = c.id WHERE q.id = :id"), {"id": quiz_id}).fetchone()
    if not row:
        return error_response("Quiz not found", 404)
    data = dict(row._mapping)

    role = (current_user.role or "").lower() if current_user else "anonymous"
    is_teacher = role in ("teacher", "faculty", "hod", "admin", "super_admin")
    is_student = not is_teacher

    # Fetch questions directly from quiz_questions table
    q_rows = db.execute(text("""
        SELECT qq.id, qq.question_text, qq.question_type, qq.marks, qq.negative_marks, qq.explanation, qq.hint, qq.question_order
        FROM quiz_questions qq
        WHERE qq.quiz_id = :qid
        ORDER BY qq.question_order ASC
    """), {"qid": quiz_id}).fetchall()

    questions = []
    for qr in q_rows:
        qm = dict(qr._mapping)
        q_id = str(qm["id"])

        opts = db.execute(text("SELECT id, option_text, option_order, is_correct FROM question_options WHERE question_id = :qid ORDER BY option_order ASC"), {"qid": q_id}).fetchall()
        opts_list = []
        for o in opts:
            om = dict(o._mapping)
            if is_student:
                om.pop("is_correct", None)
            opts_list.append(om)
        qm["options"] = opts_list
        if is_student:
            qm.pop("explanation", None)
            qm.pop("hint", None)
        questions.append(qm)
    data["questions"] = questions
    return success_response(data)


@router.put("/{quiz_id}")
def update_quiz_config(
    quiz_id: str,
    payload: QuizUpdateSchema,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """PUT /api/v1/quizzes/{quiz_id} - Updates quiz settings."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_EDIT.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.edit' required.")

    row = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not row:
        return error_response("Quiz not found", 404)

    updates = []
    params = {"id": quiz_id}

    if payload.title is not None:
        updates.append("title = :title")
        params["title"] = payload.title
    if payload.description is not None:
        updates.append("description = :desc")
        params["desc"] = payload.description
    if payload.instructions is not None:
        updates.append("instructions = :inst")
        params["inst"] = payload.instructions
    if payload.duration_minutes is not None:
        updates.append("duration_minutes = :dur")
        params["dur"] = payload.duration_minutes
    if payload.total_marks is not None:
        updates.append("total_marks = :tot_m")
        params["tot_m"] = payload.total_marks
    if payload.passing_marks is not None:
        updates.append("passing_marks = :pass_m")
        params["pass_m"] = payload.passing_marks
    if payload.max_attempts is not None:
        updates.append("max_attempts = :max_a")
        params["max_a"] = payload.max_attempts
    if payload.start_time is not None or payload.start_at is not None:
        updates.append("start_time = :st_time")
        params["st_time"] = payload.start_time or payload.start_at
    if payload.end_time is not None or payload.end_at is not None:
        updates.append("end_time = :end_time")
        params["end_time"] = payload.end_time or payload.end_at
    if payload.randomize_questions is not None or payload.shuffle_questions is not None:
        val = payload.randomize_questions if payload.randomize_questions is not None else payload.shuffle_questions
        updates.append("randomize_questions = :rq")
        params["rq"] = val
    if payload.randomize_options is not None or payload.shuffle_options is not None:
        val = payload.randomize_options if payload.randomize_options is not None else payload.shuffle_options
        updates.append("randomize_options = :ro")
        params["ro"] = val
    if payload.negative_marking is not None:
        updates.append("negative_marking = :neg_m")
        params["neg_m"] = payload.negative_marking
    if payload.negative_marks_per_question is not None or payload.negative_marks is not None:
        val = payload.negative_marks_per_question if payload.negative_marks_per_question is not None else payload.negative_marks
        updates.append("negative_marks_per_question = :neg_val")
        params["neg_val"] = val
    if payload.status is not None:
        updates.append("status = :status")
        params["status"] = payload.status.lower()

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        sql = f"UPDATE quizzes SET {', '.join(updates)} WHERE id = :id"
        db.execute(text(sql), params)
        db.commit()

    return success_response({"id": quiz_id, "updated": True}, "Quiz updated successfully")


@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """DELETE /api/v1/quizzes/{quiz_id} - Deletes a quiz and its questions."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_DELETE.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.delete' required.")

    # Clean up associated records
    db.execute(text("DELETE FROM question_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = :id)"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_questions WHERE quiz_id = :id"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_attempt_answers WHERE attempt_id IN (SELECT id::text FROM quiz_attempts WHERE quiz_id = :id)"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_security_events WHERE attempt_id IN (SELECT id::text FROM quiz_attempts WHERE quiz_id = :id)"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_attempts WHERE quiz_id = :id"), {"id": quiz_id})
    db.execute(text("DELETE FROM quizzes WHERE id = :id"), {"id": quiz_id})
    db.commit()
    return success_response({"id": quiz_id, "deleted": True}, "Quiz deleted")


@router.put("/{quiz_id}/publish")
def publish_quiz(
    quiz_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """PUT /api/v1/quizzes/{quiz_id}/publish - Publishes or unpublishes quiz."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_PUBLISH.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.publish' required.")
    q = db.execute(text("SELECT status, result_published FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        return error_response("Quiz not found", 404)

    curr_stat = (q[0] or "").lower()
    is_pub = curr_stat in ("active", "published")
    new_stat = "draft" if is_pub else "active"

    db.execute(text("UPDATE quizzes SET status = :s, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"s": new_stat, "id": quiz_id})
    db.commit()
    return success_response({"id": quiz_id, "is_published": (new_stat == "active"), "status": new_stat}, f"Quiz status updated to '{new_stat}'")


@router.post("/{quiz_id}/close")
def close_quiz(
    quiz_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """POST /api/v1/quizzes/{quiz_id}/close - Closes active quiz."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_EDIT.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.edit' required.")
    db.execute(text("UPDATE quizzes SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"id": quiz_id})
    db.commit()
    return success_response({"id": quiz_id, "status": "closed"}, "Quiz closed successfully")


@router.post("/{quiz_id}/start", status_code=status.HTTP_201_CREATED)
def start_quiz_attempt(
    quiz_id: str,
    payload: Optional[Dict[str, Any]] = Body(default={}),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/quizzes/{quiz_id}/start
    Starts student quiz attempt. Returns randomized questions with correct answers stripped.
    Enforces server timers, attempt limits, class access, and anti-cheating state.
    """
    student_id = None
    if current_user and (current_user.role or "").lower() == "student":
        student_id = current_user.user_id or current_user.identifier
    elif payload:
        student_id = payload.get("student_id") or payload.get("student_code")

    try:
        attempt_data = QuizService.start_student_attempt(quiz_id=quiz_id, student_identifier=student_id, db=db)
        return success_response(attempt_data, "Quiz attempt started successfully", code=201)
    except ValueError as e:
        return error_response(str(e), 400)
    except PermissionError as e:
        return error_response(str(e), 403)
    except Exception as e:
        return error_response(f"Could not start examination: {str(e)}", 500)


@router.get("/{quiz_id}/questions")
def get_quiz_questions(
    quiz_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """GET /api/v1/quizzes/{quiz_id}/questions - List questions assigned to quiz (Faculty/Admin only)."""
    if not current_user or (current_user.role or "").lower() == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Students and unauthorized users cannot access raw quiz questions or answer keys."
        )

    rows = db.execute(text("""
        SELECT qq.id, qq.question_text, qq.question_type, qq.marks, qq.negative_marks, qq.explanation, qq.hint, qq.question_order
        FROM quiz_questions qq
        WHERE qq.quiz_id = :qid
        ORDER BY qq.question_order ASC
    """), {"qid": quiz_id}).fetchall()
    result = []
    for r in rows:
        m = dict(r._mapping)
        opts = db.execute(text("SELECT id, option_text, option_order, is_correct FROM question_options WHERE question_id = :qid ORDER BY option_order ASC"), {"qid": str(m["id"])}).fetchall()
        m["options"] = [dict(o._mapping) for o in opts]
        result.append(m)
    return success_response(result)


@router.post("/{quiz_id}/questions", status_code=status.HTTP_201_CREATED)
def add_question_to_quiz(
    quiz_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """POST /api/v1/quizzes/{quiz_id}/questions - Adds a question to the quiz."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_EDIT.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.edit' required.")
    try:
        res = QuizService.add_question_to_quiz(quiz_id, payload, db)
        return success_response(res, "Question added to quiz successfully", code=201)
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f"Failed to add question: {str(e)}", 400)


@router.delete("/{quiz_id}/questions/{question_id}")
def remove_question_from_quiz(
    quiz_id: str,
    question_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """DELETE /api/v1/quizzes/{quiz_id}/questions/{question_id} - Removes question from quiz."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_EDIT.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.edit' required.")
    try:
        QuizService.remove_question_from_quiz(quiz_id, question_id, db)
        return success_response({"quiz_id": quiz_id, "question_id": question_id}, "Question removed")
    except Exception as e:
        return error_response(f"Failed to remove question: {str(e)}", 400)


@router.get("/{quiz_id}/analytics")
def get_quiz_analytics(quiz_id: str, db: Session = Depends(get_db)):
    """
    GET /api/v1/quizzes/{quiz_id}/analytics
    Comprehensive teacher analytics: average, highest, lowest, pass %, question accuracy, rankings, distribution, time spent.
    """
    try:
        data = QuizService.get_quiz_analytics(quiz_id, db)
        return success_response(data)
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f"Analytics computation error: {str(e)}", 500)


@router.get("/{quiz_id}/leaderboard")
def get_quiz_leaderboard(quiz_id: str, db: Session = Depends(get_db)):
    """GET /api/v1/quizzes/{quiz_id}/leaderboard - Class ranks and performance for quiz."""
    try:
        data = QuizService.get_quiz_leaderboard(quiz_id, db)
        return success_response(data)
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f"Leaderboard error: {str(e)}", 500)


@router.get("/{quiz_id}/export")
def export_quiz_results(
    quiz_id: str,
    filter: str = Query("all"),
    format: str = Query("csv"),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/quizzes/{quiz_id}/export
    Export quiz results as CSV, Excel-compatible format, or JSON.
    """
    try:
        return QuizService.export_quiz_results(quiz_id, filter, format, db)
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f"Export error: {str(e)}", 500)


@router.post("/{quiz_id}/toggle-release-results")
def toggle_release_results(
    quiz_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """POST /api/v1/quizzes/{quiz_id}/toggle-release-results - Toggle release of results to students."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_PUBLISH.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.publish' required.")

    q = db.execute(text("SELECT result_published FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        return error_response("Quiz not found", 404)

    target_state = payload.get("release") if (payload and "release" in payload) else (not bool(q[0]))
    teacher_id = QuizService.resolve_uuid(current_user.user_id if current_user else None)

    db.execute(text("""
        UPDATE quizzes
        SET result_published = :rel,
            result_published_at = CASE WHEN :rel = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END,
            result_published_by = :tid,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    """), {"rel": target_state, "tid": teacher_id, "id": quiz_id})
    db.commit()

    return success_response({"quiz_id": quiz_id, "result_published": target_state}, f"Results {'released to students' if target_state else 'hidden from students'}")


@router.get("/{quiz_id}/security-events")
def get_quiz_security_events(
    quiz_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """GET /api/v1/quizzes/{quiz_id}/security-events - View proctoring logs for quiz."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_VIEW.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.view' required.")

    rows = db.execute(text("""
        SELECT qse.id, qse.attempt_id, qse.event_type, qse.metadata, qse.event_time,
               s.student_code, s.roll_no, s.full_name
        FROM quiz_security_events qse
        JOIN quiz_attempts qa ON qse.attempt_id = qa.id::text
        JOIN students s ON qa.student_id = s.id
        WHERE qa.quiz_id = :qid
        ORDER BY qse.event_time DESC
    """), {"qid": quiz_id}).fetchall()

    return success_response([dict(r._mapping) for r in rows])


# ==============================================================================
# QUESTION BANK
# ==============================================================================

@router.get("/questions/bank")
def get_question_bank(
    subject_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """GET /api/v1/quizzes/questions/bank - Question bank repository."""
    clause = "WHERE 1=1"
    params = {}
    if subject_id:
        clause += " AND subject_id = :sid"
        params["sid"] = subject_id
    if difficulty:
        clause += " AND difficulty = :dif"
        params["dif"] = difficulty

    rows = db.execute(text(f"SELECT * FROM question_bank {clause} ORDER BY created_at DESC")).fetchall()
    result = []
    for r in rows:
        m = dict(r._mapping)
        m["options"] = []
        result.append(m)
    return success_response(result)


@router.post("/questions/bank")
def create_question_bank_item(
    payload: QuestionBankCreate,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """POST /api/v1/quizzes/questions/bank - Create item in centralized question bank."""
    if current_user and not RBACService.has_permission(current_user, Permission.QUIZ_CREATE.value):
        raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.create' required.")

    qid = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO question_bank (id, question_text, question_type, subject_id, difficulty, marks, negative_marks, explanation, created_by, created_at)
        VALUES (:id, :qtext, :qtype, :sid, :dif, :marks, :nmarks, :exp_ans, :created_by, CURRENT_TIMESTAMP)
    """), {
        "id": qid, "qtext": payload.question_text, "qtype": payload.question_type,
        "sid": payload.subject_id,
        "dif": payload.difficulty, "marks": payload.marks, "nmarks": payload.negative_marks,
        "exp_ans": payload.explanation or payload.expected_answer or "",
        "created_by": (current_user.identifier if current_user else "EMP-CSE-1001")
    })

    db.commit()
    return success_response({"id": qid}, "Question created in question bank", code=201)
