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
def get_attendance_records(class_id: Optional[str] = None, db: Session = Depends(get_db)):
    clause = "WHERE ass.class_id = :cid" if class_id else ""
    params = {"cid": class_id} if class_id else {}
    rows = db.execute(text(f"""
        SELECT ass.*, c.class_name, s.name as subject_name
        FROM attendance_sessions ass
        LEFT JOIN classes c ON ass.class_id = c.id
        LEFT JOIN subjects s ON ass.subject_id = s.id
        {clause}
        ORDER BY ass.session_date DESC, ass.period_number ASC
        LIMIT 50
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])
