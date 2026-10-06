import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.schemas.attendance import AttendanceDraftRequest, AttendanceSubmitRequest

class AttendanceService:
    @staticmethod
    def check_duplicate(class_id: str, subject_id: str, session_date: str, period_number: int, db: Session) -> Dict[str, Any]:
        row = db.execute(text("""
            SELECT id FROM attendance_sessions
            WHERE class_id = :cid AND subject_id = :sid AND session_date = :sdate AND period_number = :pnum
            LIMIT 1
        """), {"cid": class_id, "sid": subject_id, "sdate": session_date, "pnum": period_number}).fetchone()
        return {"duplicate_exists": bool(row), "session_id": row[0] if row else None}

    @staticmethod
    def submit_attendance(payload: AttendanceSubmitRequest, db: Session) -> Dict[str, Any]:
        sess_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO attendance_sessions
            (id, teacher_id, class_id, subject_id, session_date, period_number, session_type, status, created_at, updated_at)
            VALUES (:id, (SELECT id FROM teachers LIMIT 1), :cid, :sid, :sdate, :pnum, :stype, 'submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """), {
            "id": sess_id, "cid": payload.class_id, "sid": payload.subject_id,
            "sdate": payload.session_date, "pnum": payload.period_number, "stype": payload.session_type
        })
        for sid in payload.present_student_ids:
            db.execute(text("""
                INSERT INTO attendance_records (id, session_id, student_id, is_present, created_at)
                VALUES (:id, :sess_id, :sid, 1, CURRENT_TIMESTAMP)
            """), {"id": str(uuid.uuid4()), "sess_id": sess_id, "sid": sid})
        for sid in payload.absent_student_ids:
            db.execute(text("""
                INSERT INTO attendance_records (id, session_id, student_id, is_present, created_at)
                VALUES (:id, :sess_id, :sid, 0, CURRENT_TIMESTAMP)
            """), {"id": str(uuid.uuid4()), "sess_id": sess_id, "sid": sid})
        db.commit()
        return {
            "session_id": sess_id,
            "present_count": len(payload.present_student_ids),
            "absent_count": len(payload.absent_student_ids)
        }
