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
        total_count = len(payload.present_student_ids) + len(payload.absent_student_ids)
        present_count = len(payload.present_student_ids)
        absent_count = len(payload.absent_student_ids)
        rate = round((present_count / total_count * 100), 2) if total_count > 0 else 0.0

        # Look up class_name and subject info
        c_row = db.execute(text("SELECT class_name FROM classes WHERE id::text = :cid OR class_name = :cid LIMIT 1"), {"cid": payload.class_id}).fetchone()
        class_name = c_row[0] if c_row else payload.class_id

        s_row = db.execute(text("SELECT code, name FROM subjects WHERE id::text = :sid OR code = :sid LIMIT 1"), {"sid": payload.subject_id}).fetchone()
        subject_code = s_row[0] if s_row else payload.subject_id
        subject_name = s_row[1] if s_row else "Course"

        db.execute(text("""
            INSERT INTO attendance_sessions
            (id, session_code, teacher_id, class_id, class_name, subject_id, subject_code, subject_name, 
             session_date, period_number, session_type, status, total_students, present_count, absent_count, attendance_rate, created_at, updated_at)
            VALUES (:id, :scode, (SELECT id FROM teachers LIMIT 1), :cid, :cname, :sid, :scode_val, :sname,
                    :sdate, :pnum, :stype, 'SUBMITTED', :tot, :pres, :abs, :rate, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """), {
            "id": sess_id, "scode": f"REC-{sess_id[:8].upper()}", "cid": payload.class_id, "cname": class_name,
            "sid": payload.subject_id, "scode_val": subject_code, "sname": subject_name,
            "sdate": payload.session_date, "pnum": str(payload.period_number), "stype": payload.session_type,
            "tot": total_count, "pres": present_count, "abs": absent_count, "rate": rate
        })

        for sid in payload.present_student_ids:
            rec_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO attendance_records (id, session_id, student_id, is_present, status, created_at)
                VALUES (:id, :sess_id, :sid, 1, 'PRESENT', CURRENT_TIMESTAMP)
            """), {"id": rec_id, "sess_id": sess_id, "sid": sid})

            # Increment present & total periods for this student
            db.execute(text("""
                UPDATE student_attendance_subjects 
                SET present_periods = present_periods + 1, total_periods = total_periods + 1
                WHERE (student_id = :sid OR student_code = :sid) AND (subject_code = :scode OR subject_name = :sname)
            """), {"sid": sid, "scode": subject_code, "sname": subject_name})

        for sid in payload.absent_student_ids:
            rec_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO attendance_records (id, session_id, student_id, is_present, status, created_at)
                VALUES (:id, :sess_id, :sid, 0, 'ABSENT', CURRENT_TIMESTAMP)
            """), {"id": rec_id, "sess_id": sess_id, "sid": sid})

            # Increment only total periods for absent student
            db.execute(text("""
                UPDATE student_attendance_subjects 
                SET total_periods = total_periods + 1
                WHERE (student_id = :sid OR student_code = :sid) AND (subject_code = :scode OR subject_name = :sname)
            """), {"sid": sid, "scode": subject_code, "sname": subject_name})

        db.commit()

        # Synchronize session and student records to Supabase Cloud asynchronously/safely
        try:
            import urllib.request, json
            from backend.config.settings import settings
            if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
                headers = {
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }
                # 1. Insert session to Supabase
                session_payload = {
                    "id": sess_id,
                    "session_code": f"REC-{sess_id[:8].upper()}",
                    "class_name": class_name,
                    "subject_code": subject_code,
                    "subject_name": subject_name,
                    "session_date": payload.session_date,
                    "period_number": str(payload.period_number),
                    "period": str(payload.period_number),
                    "session_type": payload.session_type,
                    "status": "SUBMITTED",
                    "total_students": total_count,
                    "present_count": present_count,
                    "absent_count": absent_count,
                    "attendance_rate": float(rate)
                }
                req = urllib.request.Request(
                    f"{settings.SUPABASE_URL}/rest/v1/attendance_sessions",
                    data=json.dumps(session_payload).encode('utf-8'),
                    headers=headers
                )
                try:
                    urllib.request.urlopen(req, timeout=4)
                except Exception as sub_err:
                    pass

                # 2. Insert records to Supabase
                rec_payloads = []
                for sid in payload.present_student_ids:
                    rec_payloads.append({
                        "id": str(uuid.uuid4()),
                        "session_id": sess_id,
                        "student_id": sid if len(sid) > 20 else None,
                        "student_code": sid if len(sid) <= 20 else None,
                        "is_present": True,
                        "status": "PRESENT"
                    })
                for sid in payload.absent_student_ids:
                    rec_payloads.append({
                        "id": str(uuid.uuid4()),
                        "session_id": sess_id,
                        "student_id": sid if len(sid) > 20 else None,
                        "student_code": sid if len(sid) <= 20 else None,
                        "is_present": False,
                        "status": "ABSENT"
                    })
                if rec_payloads:
                    rec_req = urllib.request.Request(
                        f"{settings.SUPABASE_URL}/rest/v1/attendance_records",
                        data=json.dumps(rec_payloads).encode('utf-8'),
                        headers=headers
                    )
                    try:
                        urllib.request.urlopen(rec_req, timeout=5)
                    except Exception as rec_err:
                        pass
        except Exception:
            pass

        # Step 7: Trigger low attendance notification for students whose attendance falls below 75%
        try:
            from backend.services.notification_service import NotificationService
            for sid in payload.absent_student_ids:
                row = db.execute(text("""
                    SELECT present_periods, total_periods 
                    FROM student_attendance_subjects 
                    WHERE (student_id = :sid OR student_code = :sid) AND (subject_code = :scode OR subject_name = :sname)
                    LIMIT 1
                """), {"sid": sid, "scode": subject_code, "sname": subject_name}).fetchone()
                if row and row[1] > 0:
                    pct = round((row[0] / row[1] * 100), 1)
                    if pct < 75:
                        NotificationService.send_attendance_shortage_notification(sid, subject_name, pct)
        except Exception:
            pass

        return {
            "session_id": sess_id,
            "present_count": present_count,
            "absent_count": absent_count,
            "attendance_rate": rate
        }

