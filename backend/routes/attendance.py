from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config.database import get_db
from backend.schemas.attendance import AttendanceDraftRequest, AttendanceSubmitRequest
from backend.services.attendance_service import AttendanceService
from backend.utils.helpers import success_response

router = APIRouter(tags=["Attendance Management"])

@router.get("/attendance/check-duplicate")
def check_duplicate_attendance(class_id: str, subject_id: str, session_date: str, period_number: int = 1, db: Session = Depends(get_db)):
    data = AttendanceService.check_duplicate(class_id, subject_id, session_date, period_number, db)
    return success_response(data)

@router.get("/attendance/draft")
def get_attendance_draft(class_id: str, subject_id: str, session_date: str, period_number: int = 1, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT * FROM attendance_sessions
        WHERE class_id = :cid AND subject_id = :sid AND session_date = :sdate AND period_number = :pnum AND status = 'draft'
        LIMIT 1
    """), {"cid": class_id, "sid": subject_id, "sdate": session_date, "pnum": period_number}).fetchone()
    return success_response(dict(row._mapping) if row else None)

@router.post("/attendance/draft")
def save_attendance_draft(payload: AttendanceDraftRequest, db: Session = Depends(get_db)):
    import uuid
    sess_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT OR REPLACE INTO attendance_sessions
        (id, teacher_id, class_id, subject_id, session_date, period_number, session_type, status, created_at, updated_at)
        VALUES (:id, (SELECT id FROM teachers LIMIT 1), :cid, :sid, :sdate, :pnum, :stype, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """), {
        "id": sess_id, "cid": payload.class_id, "sid": payload.subject_id,
        "sdate": payload.session_date, "pnum": payload.period_number, "stype": payload.session_type
    })
    db.commit()
    return success_response({"session_id": sess_id}, "Draft saved")

@router.post("/attendance/submit")
def submit_attendance(payload: AttendanceSubmitRequest, db: Session = Depends(get_db)):
    data = AttendanceService.submit_attendance(payload, db)
    return success_response(data, "Attendance submitted successfully")

@router.get("/attendance/records")
@router.get("/attendance/recent")
def get_attendance_records(
    class_id: Optional[str] = None,
    class_name: Optional[str] = None,
    teacher_id: Optional[str] = None,
    subject_code: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    target_class = class_name or class_id
    # 1. Query Supabase Cloud v_recent_attendance
    try:
        import urllib.request, urllib.parse, json
        from backend.config.settings import settings
        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            url = f"{settings.SUPABASE_URL}/rest/v1/v_recent_attendance?select=*&order=session_date.desc,created_at.desc&limit={limit}"
            if target_class:
                url += f"&class_name=eq.{urllib.parse.quote(target_class)}"
            if teacher_id:
                url += f"&teacher_id=eq.{urllib.parse.quote(teacher_id)}"
            if subject_code:
                url += f"&subject_code=eq.{urllib.parse.quote(subject_code)}"
            req = urllib.request.Request(
                url,
                headers={"apikey": settings.SUPABASE_ANON_KEY, "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}"}
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data:
                    return success_response(data)
    except Exception:
        pass

    # 2. Fallback to SQLite
    clause = "WHERE ass.class_id = :cid OR ass.class_name = :cid" if target_class else ""
    params = {"cid": target_class, "lim": limit} if target_class else {"lim": limit}
    rows = db.execute(text(f"""
        SELECT ass.*, ass.class_name, ass.subject_name
        FROM attendance_sessions ass
        {clause}
        ORDER BY ass.session_date DESC, ass.period_number ASC
        LIMIT :lim
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])
