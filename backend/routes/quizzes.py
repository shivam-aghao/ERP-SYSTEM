"""
================================================================================
SSGMCE COLLEGE ERP - CANONICAL QUIZZES ROUTER
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
from backend.services.ai_question_service import AIQuestionService
from backend.utils.helpers import success_response, error_response

router = APIRouter(prefix="/quizzes", tags=["Quizzes & Examination Assessment"])


def _resolve_teacher_uuid(teacher_ident: str, db: Session) -> Optional[str]:
    if not teacher_ident:
        return None
    tch = db.execute(text("""
        SELECT id FROM teachers
        WHERE id::text = :tid OR LOWER(emp_code) = LOWER(:tid) OR LOWER(email) = LOWER(:tid)
        LIMIT 1
    """), {"tid": str(teacher_ident)}).fetchone()
    return str(tch._mapping["id"]) if tch else None


@router.get("")
@router.get("/")
def get_all_quizzes(
    class_id: Optional[str] = Query(None),
    student_code: Optional[str] = Query(None),
    teacher_id: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/quizzes
    Multi-tenant & Role-Scoped Quiz Listing:
    - Student: strictly returns ONLY quizzes assigned to the student's enrolled class. No other classes.
    - Teacher: strictly returns ONLY quizzes uploaded/created by this teacher. No other teachers' quizzes.
    - Admin: can view all quizzes or filter by teacher_id / class_id.
    """
    role = (current_user.role or "").lower() if current_user else None
    is_admin = role in ("admin", "super_admin")
    is_teacher = role in ("teacher", "faculty", "hod") and not student_code
    is_student = (role == "student") or bool(student_code) or (not is_teacher and not is_admin and not teacher_id)

    # =========================================================================
    # 1. STUDENT PERSPECTIVE: Strictly Enforce Enrolled Class Membership
    # =========================================================================
    if is_student and not is_teacher and not is_admin:
        # Prefer explicit student_code query param if provided (e.g. when switching students), else JWT student identity
        sc = (student_code.strip() if student_code and student_code.strip() not in ("--", "null", "undefined") else None) or (
            current_user.identifier if current_user and role == "student" else None
        )

        st = None
        if sc:
            st = db.execute(text("""
                SELECT s.*, c.class_name
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.id
                WHERE LOWER(s.student_code) = LOWER(:c)
                   OR s.id::text = :c
                   OR LOWER(s.roll_no) = LOWER(:c)
                   OR LOWER(COALESCE(s.email, '')) = LOWER(:c)
                LIMIT 1
            """), {"c": sc}).fetchone()

        stud_class_id = None
        stud_class_name = None
        sid = ""

        if st:
            sm = st._mapping
            stud_class_id = str(sm["class_id"]) if sm.get("class_id") else None
            stud_class_name = str(sm["class_name"]) if sm.get("class_name") else None
            sid = str(sm["id"]) if sm.get("id") else ""

        # If class_id query param was explicitly supplied (e.g. '2R1'), resolve it from classes table if student wasn't found
        # or if class_id was explicitly requested
        if class_id and class_id.strip() not in ("", "ALL", "null", "undefined"):
            req_cls = db.execute(text("""
                SELECT id, class_name FROM classes
                WHERE id::text = :c OR UPPER(class_name) = UPPER(:c)
                LIMIT 1
            """), {"c": class_id.strip()}).fetchone()
            if req_cls and not st:
                stud_class_id = str(req_cls[0])
                stud_class_name = str(req_cls[1])

        if not stud_class_id and not stud_class_name:
            return success_response([])

        # Student CAN ONLY SEE active/published quizzes for their exact class
        quizzes = db.execute(text("""
            SELECT q.*, c.class_name, COALESCE(s.name, 'General Subject') as subject_name,
                   COALESCE(q.result_published, TRUE) as is_result_released,
                   COALESCE(q.result_published, TRUE) as show_result_immediately,
                   (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
                   (SELECT qa.status FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id::text = :sid ORDER BY qa.created_at DESC LIMIT 1) as attempt_status,
                   CASE 
                       WHEN COALESCE(q.result_published, TRUE) = TRUE THEN (SELECT qa.final_marks FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id::text = :sid ORDER BY qa.created_at DESC LIMIT 1)
                       ELSE NULL
                   END as attempt_score,
                   CASE 
                       WHEN COALESCE(q.result_published, TRUE) = TRUE THEN (SELECT qa.percentage FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id::text = :sid ORDER BY qa.created_at DESC LIMIT 1)
                       ELSE NULL
                   END as attempt_percentage,
                   (SELECT qa.id FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id::text = :sid ORDER BY qa.created_at DESC LIMIT 1) as attempt_id
            FROM quizzes q
            JOIN classes c ON q.class_id = c.id
            LEFT JOIN subjects s ON q.subject_id = s.id
            WHERE (q.class_id::text = :cid OR UPPER(c.class_name) = UPPER(:cname))
              AND (q.result_published = TRUE OR UPPER(q.status) IN ('ACTIVE', 'PUBLISHED', 'SCHEDULED'))
            ORDER BY q.created_at DESC
        """), {"cid": str(stud_class_id or ""), "cname": str(stud_class_name or ""), "sid": str(sid or "")}).fetchall()
        return success_response([dict(r._mapping) for r in quizzes])

    # =========================================================================
    # 2. TEACHER / ADMIN PERSPECTIVE: Strictly Enforce Quiz Ownership
    # =========================================================================
    clause = "WHERE 1=1"
    params = {}

    if not is_admin:
        # Teacher must ONLY see quizzes uploaded by themselves
        t_ident = None
        if current_user and is_teacher:
            t_ident = current_user.user_id or current_user.identifier or current_user.id
        elif teacher_id:
            t_ident = teacher_id

        actual_teacher_uuid = _resolve_teacher_uuid(str(t_ident), db) if t_ident else None
        if not actual_teacher_uuid:
            # Teacher identity could not be verified or not found in database -> return empty list
            return success_response([])

        clause += " AND (q.teacher_id::text = :tid)"
        params["tid"] = actual_teacher_uuid
    else:
        # Admin can optionally filter by teacher_id if provided
        if teacher_id:
            actual_tid = _resolve_teacher_uuid(str(teacher_id), db)
            if actual_tid:
                clause += " AND (q.teacher_id::text = :tid)"
                params["tid"] = actual_tid

    # Optional class filter
    if class_id:
        clause += " AND (CAST(q.class_id AS TEXT) = :cid OR c.class_name = :cid)"
        params["cid"] = class_id

    rows = db.execute(text(f"""
        SELECT q.*, c.class_name, COALESCE(s.name, 'General') as subject_name,
               COALESCE(q.result_published, TRUE) as is_result_released,
               COALESCE(q.result_published, TRUE) as show_result_immediately,
               CASE WHEN COALESCE(q.result_published, TRUE) = TRUE THEN 'IMMEDIATE' ELSE 'MANUAL' END as result_release_mode,
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
    is_admin = role in ("admin", "super_admin")
    is_teacher = role in ("teacher", "faculty", "hod")
    is_student = (role == "student") or (not is_teacher and not is_admin)

    # 1. Enforce Student Class Scoping: Student cannot view quizzes from other classes
    if is_student and not is_admin:
        sc = current_user.identifier if (current_user and role == "student") else "308637"
        st = db.execute(text("""
            SELECT s.class_id, c.class_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.student_code = :c OR s.id::text = :c LIMIT 1
        """), {"c": str(sc)}).fetchone()
        if st:
            sm = st._mapping
            stud_cid = str(sm.get("class_id") or "")
            stud_cname = str(sm.get("class_name") or "")
            quiz_cid = str(data.get("class_id") or "")
            quiz_cname = str(data.get("class_name") or "")
            if quiz_cid != stud_cid and quiz_cname != stud_cname:
                raise HTTPException(
                    status_code=403,
                    detail="Forbidden: This quiz is assigned to another class and cannot be accessed."
                )

    # 2. Enforce Teacher Ownership Scoping: Teacher can only view quizzes they uploaded
    if is_teacher and not is_admin:
        t_ident = (current_user.user_id or current_user.identifier or current_user.id) if current_user else None
        actual_tid = _resolve_teacher_uuid(str(t_ident), db) if t_ident else None
        if not actual_tid or str(data.get("teacher_id") or "") != actual_tid:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You can only view quizzes uploaded by you."
            )

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

    # Attach randomization & exam security configuration
    rand_cfg = QuizService._get_randomization_config(quiz_id, db)
    data.update(rand_cfg)

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

    # Ownership check: Teachers can only edit quizzes they uploaded
    if current_user and (current_user.role or "").lower() not in ("admin", "super_admin"):
        t_ident = current_user.user_id or current_user.identifier or current_user.id
        actual_tid = _resolve_teacher_uuid(str(t_ident), db) if t_ident else None
        if not actual_tid or str(row._mapping.get("teacher_id") or "") != actual_tid:
            raise HTTPException(status_code=403, detail="Forbidden: You can only edit quizzes uploaded by you.")

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
    if payload.class_id is not None:
        c_val = str(payload.class_id).strip()
        actual_cid = QuizService.resolve_uuid(c_val)
        if not actual_cid:
            c_row = db.execute(text("SELECT id FROM classes WHERE class_name = :c OR CAST(id AS TEXT) = :c LIMIT 1"), {"c": c_val}).fetchone()
            if c_row:
                actual_cid = str(c_row[0])
        if actual_cid:
            updates.append("class_id = :cls_id")
            params["cls_id"] = actual_cid
    if payload.subject_id is not None:
        s_val = str(payload.subject_id).strip()
        actual_sid = QuizService.resolve_uuid(s_val)
        if not actual_sid:
            s_row = db.execute(text("SELECT id FROM subjects WHERE name = :n OR code = :n OR CAST(id AS TEXT) = :n LIMIT 1"), {"n": s_val}).fetchone()
            if s_row:
                actual_sid = str(s_row[0])
        if actual_sid:
            updates.append("subject_id = :subj_id")
            params["subj_id"] = actual_sid
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

    # Persist randomization & security policy settings
    QuizService._save_randomization_config(quiz_id, payload, db)
    rand_cfg = QuizService._get_randomization_config(quiz_id, db)

    return success_response({"id": quiz_id, "updated": True, **rand_cfg}, "Quiz updated successfully")


@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if current_user:
        user_role = (current_user.role or "").lower()
        is_allowed = (
            user_role in ("teacher", "faculty", "hod", "admin", "super_admin")
            or RBACService.has_permission(current_user, Permission.QUIZ_DELETE.value)
        )
        if not is_allowed:
            raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.delete' required.")

    row = db.execute(text("SELECT id, teacher_id FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not row:
        return error_response("Quiz not found", 404)

    # Ownership check: Teachers can only delete quizzes they uploaded
    if current_user and (current_user.role or "").lower() not in ("admin", "super_admin"):
        t_ident = current_user.user_id or current_user.identifier or current_user.id
        actual_tid = _resolve_teacher_uuid(str(t_ident), db) if t_ident else None
        if not actual_tid or str(row._mapping.get("teacher_id") or "") != actual_tid:
            raise HTTPException(status_code=403, detail="Forbidden: You can only delete quizzes uploaded by you.")

    # Clean up associated records
    db.execute(text("DELETE FROM question_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = :id)"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_questions WHERE quiz_id = :id"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_attempt_answers WHERE attempt_id IN (SELECT CAST(id AS TEXT) FROM quiz_attempts WHERE quiz_id = :id)"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_security_events WHERE attempt_id IN (SELECT CAST(id AS TEXT) FROM quiz_attempts WHERE quiz_id = :id)"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_attempts WHERE quiz_id = :id"), {"id": quiz_id})
    db.execute(text("DELETE FROM quizzes WHERE id = :id"), {"id": quiz_id})
    db.commit()
    return success_response({"id": quiz_id, "deleted": True}, "Quiz deleted")


@router.get("/{quiz_id}/validate-publish")
def validate_quiz_publishing(quiz_id: str, db: Session = Depends(get_db)):
    """
    GET /api/v1/quizzes/{quiz_id}/validate-publish
    Pre-publish check for question pool size, difficulty distribution, and paper constraints.
    """
    try:
        res = QuizService.validate_quiz_for_publishing(quiz_id, db)
        return success_response(res)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.put("/{quiz_id}/publish")
@router.post("/{quiz_id}/publish")
def publish_quiz(
    quiz_id: str,
    action: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """PUT/POST /api/v1/quizzes/{quiz_id}/publish - Publishes or unpublishes quiz."""
    if current_user:
        user_role = (current_user.role or "").lower()
        is_allowed = (
            user_role in ("teacher", "faculty", "hod", "admin", "super_admin")
            or RBACService.has_permission(current_user, Permission.QUIZ_PUBLISH.value)
        )
        if not is_allowed:
            raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.publish' required.")

    q = db.execute(text("SELECT id, title, class_id, duration_minutes, status, result_published, teacher_id FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        return error_response("Quiz not found", 404)

    # Ownership check: Teachers can only publish quizzes they uploaded
    if current_user and (current_user.role or "").lower() not in ("admin", "super_admin"):
        t_ident = current_user.user_id or current_user.identifier or current_user.id
        actual_tid = _resolve_teacher_uuid(str(t_ident), db) if t_ident else None
        if not actual_tid or str(q._mapping.get("teacher_id") or "") != actual_tid:
            raise HTTPException(status_code=403, detail="Forbidden: You can only publish quizzes uploaded by you.")

    curr_stat = (q._mapping.get("status") or "").lower()
    is_currently_published = curr_stat in ("active", "published")

    if action == "publish":
        new_stat = "active"
    elif action == "unpublish":
        new_stat = "draft"
    else:
        new_stat = "draft" if is_currently_published else "active"

    # Validate that quiz has questions and satisfies pool constraints before making it active
    if new_stat == "active":
        val_res = QuizService.validate_quiz_for_publishing(quiz_id, db)
        if not val_res["valid"]:
            raise HTTPException(
                status_code=400,
                detail="; ".join(val_res["errors"])
            )

    db.execute(text("UPDATE quizzes SET status = :s, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"s": new_stat, "id": quiz_id})
    db.commit()

    # If publishing, push real-time assessment notification to the class
    if new_stat == "active":
        try:
            cid = q._mapping.get("class_id")
            c_info = db.execute(text("SELECT class_name FROM classes WHERE id = :cid"), {"cid": cid}).fetchone() if cid else None
            c_name = c_info[0] if c_info else "Target Class"
            nid = str(uuid.uuid4())
            import json as _json
            meta_json = _json.dumps({"class_id": str(cid) if cid else None, "class_name": c_name})
            db.execute(text("""
                INSERT INTO notifications (id, notification_type, title, message, entity_type, entity_id, metadata, created_at)
                VALUES (:id, 'quiz', :title, :msg, 'quiz', :eid, :meta::jsonb, CURRENT_TIMESTAMP)
            """), {
                "id": nid,
                "title": f"Quiz Published: {q._mapping.get('title')}",
                "msg": f"A new quiz '{q._mapping.get('title')}' is now active for {c_name}. Duration: {q._mapping.get('duration_minutes', 30)} mins.",
                "eid": quiz_id,
                "meta": meta_json
            })
            db.commit()
        except Exception:
            db.rollback()
    q_cnt = db.execute(text("SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = :id"), {"id": quiz_id}).scalar() or 0
    return success_response({
        "id": quiz_id,
        "is_published": (new_stat == "active"),
        "status": new_stat,
        "result_published": bool(q._mapping.get("result_published")),
        "question_count": q_cnt
    }, f"Quiz status updated to '{new_stat}'")


@router.post("/{quiz_id}/close")
def close_quiz(
    quiz_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """POST /api/v1/quizzes/{quiz_id}/close - Closes active quiz."""
    if current_user:
        user_role = (current_user.role or "").lower()
        if user_role not in ("teacher", "faculty", "hod", "admin", "super_admin") and not RBACService.has_permission(current_user, Permission.QUIZ_EDIT.value):
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
    if current_user and (current_user.role or "").lower() == "student":
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
        opts_formatted = []
        for idx, o in enumerate(opts):
            od = dict(o._mapping)
            od["key"] = chr(65 + idx)
            od["text"] = od.get("option_text") or ""
            opts_formatted.append(od)
        m["options"] = opts_formatted
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
    if current_user:
        user_role = (current_user.role or "").lower()
        if user_role not in ("teacher", "faculty", "hod", "admin", "super_admin") and not RBACService.has_permission(current_user, Permission.QUIZ_EDIT.value):
            raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.edit' required.")
    try:
        res = QuizService.add_question_to_quiz(quiz_id, payload, db)
        return success_response(res, "Question added to quiz successfully", code=201)
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f"Failed to add question: {str(e)}", 400)


@router.put("/{quiz_id}/questions/{question_id}")
def update_question_in_quiz(
    quiz_id: str,
    question_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """PUT /api/v1/quizzes/{quiz_id}/questions/{question_id} - Updates an existing question in the quiz."""
    if current_user:
        user_role = (current_user.role or "").lower()
        if user_role not in ("teacher", "faculty", "hod", "admin", "super_admin") and not RBACService.has_permission(current_user, Permission.QUIZ_EDIT.value):
            raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.edit' required.")
    try:
        res = QuizService.update_question_in_quiz(quiz_id, question_id, payload, db)
        return success_response(res, "Question updated successfully")
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f"Failed to update question: {str(e)}", 400)


@router.delete("/{quiz_id}/questions/{question_id}")
def remove_question_from_quiz(
    quiz_id: str,
    question_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """DELETE /api/v1/quizzes/{quiz_id}/questions/{question_id} - Removes question from quiz."""
    if current_user:
        user_role = (current_user.role or "").lower()
        if user_role not in ("teacher", "faculty", "hod", "admin", "super_admin") and not RBACService.has_permission(current_user, Permission.QUIZ_EDIT.value):
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


@router.get("/{quiz_id}/results")
def get_quiz_results_summary(
    quiz_id: str,
    filter: str = Query("all"),
    db: Session = Depends(get_db)
):
    """GET /api/v1/quizzes/{quiz_id}/results - Summary metrics & roster for teacher results tab."""
    try:
        roster = QuizService.export_quiz_results(quiz_id, filter, "json", db)
        all_roster = QuizService.export_quiz_results(quiz_id, "all", "json", db)
        total_students = len(all_roster)
        attempted_rows = [r for r in all_roster if r.get("Attempt Status") == "Attempted"]
        attempted_count = len(attempted_rows)
        not_attempted_count = max(0, total_students - attempted_count)
        avg_score = round(sum(float(r.get("Score") or 0) for r in attempted_rows) / attempted_count, 1) if attempted_count > 0 else 0.0
        passed_count = sum(1 for r in attempted_rows if r.get("Result") == "Passed")
        pass_pct = round((passed_count / attempted_count) * 100, 1) if attempted_count > 0 else 0.0
        return success_response({
            "quiz_id": quiz_id,
            "total_students": total_students,
            "attempted_count": attempted_count,
            "not_attempted_count": not_attempted_count,
            "average_score": avg_score,
            "pass_percentage": pass_pct,
            "roster": roster
        })
    except Exception as e:
        return error_response(f"Failed to load quiz results: {str(e)}", 500)


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
    if current_user:
        user_role = (current_user.role or "").lower()
        if user_role not in ("teacher", "faculty", "hod", "admin", "super_admin") and not RBACService.has_permission(current_user, Permission.QUIZ_PUBLISH.value):
            raise HTTPException(status_code=403, detail="Forbidden: Permission 'quiz.publish' required.")

    q = db.execute(text("SELECT result_published FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        return error_response("Quiz not found", 404)

    curr_val = True if q[0] is None else bool(q[0])
    target_state = bool(payload.get("release")) if (payload and "release" in payload and payload.get("release") is not None) else (not curr_val)
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

    msg = "Results are now SHOWN to students!" if target_state else "Results are now HIDDEN from students."
    return success_response({
        "quiz_id": quiz_id,
        "result_published": target_state,
        "is_result_released": target_state,
        "show_result_immediately": target_state,
        "message": msg
    }, msg)


@router.get("/{quiz_id}/export")
def export_quiz_results(
    quiz_id: str,
    filter: str = Query("all"),
    format: str = Query("csv"),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """GET /api/v1/quizzes/{quiz_id}/export - Export quiz results as CSV, Excel, or JSON."""
    try:
        res = QuizService.export_quiz_results(quiz_id, filter, format, db)
        if isinstance(res, list):
            return success_response(res)
        return res
    except ValueError as e:
        return error_response("NOT_FOUND", str(e), code=404)


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
        JOIN quiz_attempts qa ON qse.attempt_id = CAST(qa.id AS TEXT)
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


# ==============================================================================
# AI QUESTION GENERATOR & CSV QUESTION BANK ENDPOINTS (TEACHER MODULE)
# ==============================================================================

@router.post("/generate-questions")
def generate_ai_questions(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    POST /api/v1/quizzes/generate-questions
    Generates syllabus-aligned CSE questions via Gemini API / Curriculum Engine.
    Exclusively available to Teachers & Admins.
    """
    if current_user and current_user.role and current_user.role.lower() not in ("teacher", "faculty", "hod", "admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Forbidden: Only faculty and admins can generate quiz questions.")

    subject = (payload.get("subject") or "").strip()
    topic = (payload.get("main_topic") or payload.get("topic") or "").strip()
    if not subject:
        return error_response("Subject name is required for question generation.", 400)
    if not topic:
        return error_response("Main topic is required for question generation.", 400)

    subtopics = payload.get("subtopics") or payload.get("subtopic") or ""
    unit = (payload.get("unit_number") or payload.get("unit") or "").strip()
    additional_instructions = (payload.get("additional_instructions") or payload.get("instructions") or "").strip()
    target_class = (payload.get("target_class") or payload.get("class") or payload.get("class_name") or "").strip()
    question_type = (payload.get("question_type") or payload.get("type") or "single_choice").strip()
    reference_content = (payload.get("reference_content") or payload.get("syllabus_content") or "").strip()

    branch = payload.get("branch", "CSE")
    try:
        count = max(1, min(int(payload.get("count", 10)), 300))
    except (ValueError, TypeError):
        count = 10

    difficulty = payload.get("difficulty", "Mixed")
    difficulty_dist = payload.get("difficulty_dist", None)

    questions = AIQuestionService.generate_questions(
        subject=subject,
        topic=topic,
        main_topic=topic,
        subtopics=subtopics,
        subtopic=subtopics if isinstance(subtopics, str) else ", ".join(subtopics),
        unit=unit,
        unit_number=unit,
        additional_instructions=additional_instructions,
        target_class=target_class,
        question_type=question_type,
        reference_content=reference_content,
        branch=branch,
        count=count,
        difficulty=difficulty,
        difficulty_dist=difficulty_dist
    )

    return success_response({
        "subject": subject,
        "main_topic": topic,
        "topic": topic,
        "subtopics": subtopics,
        "unit": unit,
        "question_type": question_type,
        "target_class": target_class,
        "count": len(questions),
        "questions": questions
    }, message=f"Successfully generated {len(questions)} syllabus-aligned questions.")


@router.post("/validate-csv")
def validate_csv_questions(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    POST /api/v1/quizzes/validate-csv
    Validates uploaded CSV question bank content row-by-row.
    """
    if current_user and current_user.role and current_user.role.lower() not in ("teacher", "faculty", "hod", "admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Forbidden: Only faculty and admins can validate CSV question banks.")

    csv_content = payload.get("csv_content", "")
    if not csv_content:
        raise HTTPException(status_code=400, detail="csv_content string is required.")

    result = AIQuestionService.parse_and_validate_csv(csv_content)
    return success_response(result, message="CSV parsed and validated successfully.")


@router.post("/{quiz_id}/questions/bulk")
def add_bulk_questions(
    quiz_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/quizzes/{quiz_id}/questions/bulk
    Atomically adds questions from AI Generator or CSV Import to the quiz.
    Recalculates total_questions, total_marks, and passing_marks.
    """
    if current_user and current_user.role and current_user.role.lower() not in ("teacher", "faculty", "hod", "admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Forbidden: Only faculty and admins can add questions to quizzes.")

    questions = payload.get("questions", [])
    if not questions or not isinstance(questions, list):
        raise HTTPException(status_code=400, detail="A non-empty 'questions' array is required.")

    try:
        result = AIQuestionService.add_bulk_questions_to_quiz(quiz_id=quiz_id, questions=questions, db=db)
        return success_response(result, message=f"Successfully added {result['inserted_count']} questions to quiz.")
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add bulk questions: {str(e)}")

