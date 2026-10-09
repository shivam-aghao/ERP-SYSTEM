"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL TIMETABLE ROUTER
Namespace: /api/v1/timetable/...
Authoritative Timetable Grid, Faculty Schedules & Scheduled Assessments
================================================================================
"""

import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.config.database import get_db
from backend.auth import AuthenticatedUser, get_optional_user
from backend.services.faculty_service import FacultyService
from backend.services.syllabus_service import SyllabusService
from backend.utils.helpers import success_response, error_response

router = APIRouter(prefix="/timetable", tags=["Timetable & Assessments"])


@router.get("")
@router.get("/")
def get_timetable_grid(day: Optional[str] = None, db: Session = Depends(get_db)):
    """GET /api/v1/timetable - Retrieves general timetable grid."""
    data = SyllabusService.get_timetable(day, db)
    return success_response(data)


@router.get("/my")
def get_my_timetable(
    request: Request,
    teacher_id: Optional[str] = Query(None),
    emp_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/timetable/my
    Retrieves weekly instructional timetable for teacher.
    """
    code = emp_code or teacher_id
    if current_user and (current_user.role or "").lower() in ("teacher", "hod"):
        code = current_user.identifier or current_user.user_id
    data = FacultyService.get_timetable(db, code)
    return success_response(data)


@router.get("/student")
def get_student_timetable(
    student_code: Optional[str] = Query(None),
    day: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/timetable/student
    Retrieves student instructional timetable based on enrolled class.
    Zero-trust security: students can only access their own timetable.
    """
    from backend.routes.students import resolve_student_code
    sc = resolve_student_code(student_code, current_user)

    s_row = db.execute(text("SELECT class_name FROM students WHERE student_code = :sc OR id::text = :sc LIMIT 1"), {"sc": sc}).fetchone()
    class_code = s_row[0] if s_row and s_row[0] else "3R"

    clause = "WHERE (class_code = :cc OR class_code = :cname)"
    params: Dict[str, Any] = {"cc": class_code, "cname": class_code}
    if day:
        clause += " AND LOWER(day) = LOWER(:d)"
        params["d"] = day.strip()

    entries = db.execute(text(f"""
        SELECT * FROM timetable_entries 
        {clause}
        ORDER BY CASE LOWER(day) 
            WHEN 'monday' THEN 1 
            WHEN 'tuesday' THEN 2 
            WHEN 'wednesday' THEN 3 
            WHEN 'thursday' THEN 4 
            WHEN 'friday' THEN 5 
            WHEN 'saturday' THEN 6 
            ELSE 7 END,
            slot_index ASC
    """), params).fetchall()

    entries_list = [dict(r._mapping) for r in entries]
    if not entries_list:
        entries_list = SyllabusService.get_timetable(day, db)

    import datetime
    today_name = datetime.datetime.now().strftime("%A").lower()
    today_entries = [e for e in entries_list if str(e.get("day", "")).lower() == today_name]

    weekly: Dict[str, List[Any]] = {}
    for e in entries_list:
        d = str(e.get("day", "monday")).lower()
        weekly.setdefault(d, []).append(e)

    return success_response({
        "student_code": sc,
        "class_name": class_code,
        "today_day": today_name,
        "today": today_entries,
        "weekly": weekly,
        "entries": entries_list,
        "total_slots": len(entries_list)
    })


@router.get("/teacher/{teacher_id}")
def get_teacher_timetable_by_id(
    teacher_id: str,
    db: Session = Depends(get_db)
):
    """GET /api/v1/timetable/teacher/{teacher_id} - Timetable for specific faculty."""
    data = FacultyService.get_timetable(db, teacher_id)
    return success_response(data)



# ==============================================================================
# SCHEDULED ASSESSMENTS & TESTS CRUD
# ==============================================================================

@router.get("/tests")
def get_scheduled_tests(
    class_code: Optional[str] = Query("2R1"),
    teacher_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/timetable/tests
    List scheduled upcoming assessments and unit tests.
    """
    try:
        from backend.config.settings import settings
        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            import urllib.request, json
            url = f"{settings.SUPABASE_URL}/rest/v1/timetable_assessments?select=*&order=date.asc,start_time.asc"
            req = urllib.request.Request(
                url,
                headers={"apikey": settings.SUPABASE_ANON_KEY, "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}"}
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data is not None:
                    return success_response(data)
    except Exception:
        pass

    rows = db.execute(text("SELECT * FROM timetable_assessments ORDER BY date ASC, start_time ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])


@router.post("/tests")
def schedule_test(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/timetable/tests
    Creates a new scheduled test or assessment.
    """
    test_id = str(payload.get("id") or uuid.uuid4())
    teacher_id = payload.get("teacher_id")
    if current_user and (current_user.role or "").lower() in ("teacher", "hod"):
        teacher_id = current_user.identifier

    record = {
        "id": test_id,
        "teacher_id": teacher_id,
        "type": payload.get("type", "Quiz"),
        "subject": payload.get("subject", ""),
        "title": payload.get("title", ""),
        "date": payload.get("date", ""),
        "start_time": payload.get("start_time") or payload.get("startTime", ""),
        "end_time": payload.get("end_time") or payload.get("endTime", ""),
        "link": payload.get("link", "/student-quiz.html"),
        "class_code": payload.get("class_code", "2R1")
    }

    db.execute(text("""
        INSERT INTO timetable_assessments (id, teacher_id, type, subject, title, date, start_time, end_time, link, class_code, updated_at)
        VALUES (:id, :teacher_id, :type, :subject, :title, :date, :start_time, :end_time, :link, :class_code, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            subject = EXCLUDED.subject,
            title = EXCLUDED.title,
            date = EXCLUDED.date,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            link = EXCLUDED.link,
            class_code = EXCLUDED.class_code,
            updated_at = CURRENT_TIMESTAMP
    """), record)
    db.commit()

    return success_response(record, "Assessment scheduled successfully", code=201)


@router.put("/tests/{test_id}")
def update_scheduled_test(
    test_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    PUT /api/v1/timetable/tests/{test_id}
    Updates an existing scheduled assessment.
    """
    record = {
        "id": test_id,
        "type": payload.get("type", "Quiz"),
        "subject": payload.get("subject", ""),
        "title": payload.get("title", ""),
        "date": payload.get("date", ""),
        "start_time": payload.get("start_time") or payload.get("startTime", ""),
        "end_time": payload.get("end_time") or payload.get("endTime", ""),
        "link": payload.get("link", "/student-quiz.html"),
        "class_code": payload.get("class_code", "2R1")
    }
    db.execute(text("""
        UPDATE timetable_assessments
        SET type = :type, subject = :subject, title = :title, date = :date,
            start_time = :start_time, end_time = :end_time, link = :link,
            class_code = :class_code, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    """), record)
    db.commit()
    return success_response(record, "Assessment updated successfully")


@router.delete("/tests/{test_id}")
def delete_scheduled_test(test_id: str, db: Session = Depends(get_db)):
    """
    DELETE /api/v1/timetable/tests/{test_id}
    Deletes a scheduled assessment.
    """
    db.execute(text("DELETE FROM timetable_assessments WHERE id = :id"), {"id": test_id})
    db.commit()
    return success_response({"id": test_id, "deleted": True}, "Assessment deleted successfully")

