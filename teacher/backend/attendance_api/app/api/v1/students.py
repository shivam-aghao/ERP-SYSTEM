import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.db_models import Class, Student, Subject, AttendanceHistorySummary, AttendanceRecord, AttendanceSession
from app.database import get_supabase_client
from app.utils.response import success_response, error_response

logger = logging.getLogger("erp_fastapi")

router = APIRouter(prefix="/students", tags=["Students & Roster"])

@router.get("/class/{class_id}")
def get_class_roster(
    class_id: str,
    subject: Optional[str] = Query(None),
    departmentCode: Optional[str] = Query("CSE"),
    db: Session = Depends(get_db)
):
    """
    Fetch live enrolled students for class directly from Cloud Supabase.
    Computes real attendance history and percentages purely from actual database records.
    All static mock patterns have been completely removed.
    """
    # 1. Try fetching directly from Cloud Supabase
    try:
        sb = get_supabase_client()
        if sb:
            query = sb.table("students").select("*")
            # Handle aliases (e.g., SY-CSE-A is 2R1)
            if class_id in ("2R1", "SY-CSE-A"):
                res = query.in_("class_code", ["SY-CSE-A", "2R1"]).order("roll_no").execute()
            else:
                res = query.eq("class_code", class_id).order("roll_no").execute()

            # If no students found for specific class code, check department
            if not res.data or len(res.data) == 0:
                res = sb.table("students").select("*").eq("department_code", departmentCode).order("roll_no").execute()

            if res.data and len(res.data) > 0:
                # Fetch actual session and record history for this class / subject
                session_ids = []
                try:
                    sess_res = sb.table("attendance_sessions").select("id").eq("class_code", class_id).execute()
                    session_ids = [s["id"] for s in (sess_res.data or [])]
                except Exception:
                    pass

                history_map = {}
                if session_ids:
                    try:
                        rec_res = sb.table("attendance_records").select("student_id, roll_no, status").in_("session_id", session_ids).execute()
                        for r in (rec_res.data or []):
                            sid = r.get("student_id") or r.get("roll_no")
                            if sid not in history_map:
                                history_map[sid] = []
                            history_map[sid].append("P" if (r.get("status") or "").lower() == "present" else "A")
                    except Exception:
                        pass

                data = []
                for s in res.data:
                    sid = s.get("id")
                    roll = s.get("roll_no") or 0
                    st_history = history_map.get(sid) or history_map.get(roll) or []
                    
                    if len(st_history) > 0:
                        pres_count = sum(1 for h in st_history if h == "P")
                        pct = round((pres_count / len(st_history)) * 100, 1)
                    else:
                        pct = None  # Pure live data: no fake 85% default

                    data.append({
                        "id": sid,
                        "rollNo": roll,
                        "studentCode": s.get("enrollment_no") or s.get("roll_formatted") or f"STU-{roll}",
                        "name": s.get("name"),
                        "isProvisional": False,
                        "avatarUrl": "",
                        "attendancePercentage": pct,
                        "recentHistory": st_history[-10:] if st_history else []
                    })
                return success_response(data=data)
    except Exception as e:
        logger.warning("[Students] Supabase roster fetch error: %s", e)

    # 2. Local Database Fallback
    cls = db.query(Class).filter((Class.name == class_id) | (Class.id == class_id)).first()
    if not cls:
        cls = db.query(Class).first()
    if not cls:
        return success_response(data=[])

    students = db.query(Student).filter(Student.class_id == cls.id).order_by(Student.roll_no).all()

    data = []
    for s in students:
        records = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceRecord.student_id == s.id,
            AttendanceSession.status == "SUBMITTED"
        ).order_by(AttendanceSession.attendance_date.desc()).limit(10).all()

        if records:
            history_list = [('P' if r.status == 'PRESENT' else 'A') for r in reversed(records)]
            present_cnt = sum(1 for h in history_list if h == 'P')
            percentage = round((present_cnt / len(history_list)) * 100, 1)
        else:
            history_list = []
            percentage = None

        data.append({
            "id": s.id,
            "rollNo": s.roll_no,
            "studentCode": s.student_code,
            "name": s.full_name,
            "isProvisional": s.is_provisional or False,
            "avatarUrl": s.avatar_url or "",
            "attendancePercentage": percentage,
            "recentHistory": history_list
        })

    return success_response(data=data)
