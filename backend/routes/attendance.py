"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL ATTENDANCE ROUTER
Namespace: /api/v1/attendance/...
Authoritative Attendance Roster, Session Tracking, Marking, Audit & Governance
================================================================================
"""

import io
import csv
import re
import uuid
import json
import logging
from typing import Optional, Dict, Any, List, Union
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.config.database import get_db
from backend.schemas.attendance import (
    AttendanceDraftRequest,
    AttendanceSubmitRequest,
    AttendanceLockRequest,
    AttendanceUnlockRequest,
    AttendanceApproveRequest
)
from backend.services.attendance_service import AttendanceService
from backend.auth.dependencies import get_optional_user
from backend.auth.models import AuthenticatedUser
from backend.rbac.service import RBACService
from backend.rbac.models import Permission, RoleName
from backend.utils.helpers import success_response, error_response

logger = logging.getLogger("attendance_router")

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])


# ==============================================================================
# 1. DUPLICATE CHECK & DRAFT PREVIEW (TEACHER WORKFLOW)
# ==============================================================================

@router.get("/check-duplicate")
def check_duplicate_attendance(
    class_id: str,
    subject_id: str,
    session_date: str,
    period_number: Union[int, str] = 1,
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/attendance/check-duplicate
    Checks for existing attendance session for the class, subject, date, and period.
    """
    data = AttendanceService.check_duplicate(class_id, subject_id, session_date, period_number, db)
    return success_response(data)


@router.get("/draft")
def get_attendance_draft(
    class_id: str,
    subject_id: str,
    session_date: str,
    period_number: Union[int, str] = 1,
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/attendance/draft
    Retrieves active draft session for preview before submission.
    """
    pnum_str = str(period_number).strip()
    sdate_str = str(session_date or "").strip()
    try:
        from datetime import datetime as dt
        dt.strptime(sdate_str[:10], "%Y-%m-%d")
        clean_date = sdate_str[:10]
    except Exception:
        clean_date = str(session_date)

    row = db.execute(text("""
        SELECT * FROM attendance_sessions
        WHERE (class_id::text = :cid OR class_name = :cid)
          AND (subject_id::text = :sid OR subject_name = :sid OR subject_code = :sid)
          AND session_date = :sdate
          AND (period_number::text = :pnum OR period = :pnum)
          AND status = 'draft'
        LIMIT 1
    """), {"cid": str(class_id), "sid": str(subject_id), "sdate": clean_date, "pnum": pnum_str}).fetchone()
    return success_response(dict(row._mapping) if row else None)


@router.post("/draft", status_code=status.HTTP_201_CREATED)
def save_attendance_draft(
    payload: AttendanceDraftRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/attendance/draft
    Saves or updates attendance session draft for preview.
    Enforces teacher-class assignment server-side.
    """
    data = AttendanceService.save_draft(payload, current_user, db)
    return success_response(data, "Attendance draft saved successfully", code=201)


# ==============================================================================
# 2. SUBMISSION & RECORDING (PERSISTENCE & STATS SYNC)
# ==============================================================================

@router.post("/submit")
def submit_attendance(
    payload: AttendanceSubmitRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/attendance/submit
    Canonical attendance session submission. Persists student attendance records in Supabase PostgreSQL.
    Enforces teacher-class assignment and prevents duplicate marking.
    """
    data = AttendanceService.submit_attendance(payload, db, current_user=current_user)
    return success_response(data, "Attendance submitted successfully")


# ==============================================================================
# 3. LOCK, UNLOCK & APPROVE GOVERNANCE
# ==============================================================================

@router.post("/lock")
def lock_attendance(
    payload: AttendanceLockRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/attendance/lock
    Locks attendance session against further modifications.
    """
    data = AttendanceService.lock_session(payload.session_id, current_user, payload.reason, db)
    return success_response(data, "Attendance session locked successfully")


@router.post("/unlock")
def unlock_attendance(
    payload: AttendanceUnlockRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/attendance/unlock
    Admin/HOD unlocks an attendance session for administrative correction.
    Requires mandatory audit justification.
    """
    data = AttendanceService.unlock_session(payload.session_id, current_user, payload.reason, db)
    return success_response(data, "Attendance session unlocked successfully")


@router.post("/approve")
def approve_attendance(
    payload: AttendanceApproveRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/attendance/approve
    HOD/Admin institutional approval of submitted attendance session.
    """
    data = AttendanceService.approve_session(payload.session_id, current_user, payload.remark, db)
    return success_response(data, "Attendance session approved successfully")


# ==============================================================================
# 4. STUDENT ATTENDANCE (ZERO-TRUST IDENTITY)
# ==============================================================================

@router.get("/student")
def get_student_attendance(
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/attendance/student
    Authoritative student attendance records:
    - Overall attendance percentage
    - Subject-wise percentage & eligibility
    - Monthly attendance progression
    - Day-by-day present/absent lecture history
    - Shortage warning (<75%) & consecutive classes required to reach 75%
    Zero-trust security: Students can only access their own records.
    """
    data = AttendanceService.get_student_attendance(student_code, current_user, db)
    return success_response(data)


@router.get("/my")
def get_my_attendance(
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/my - Convenience alias for student's own attendance."""
    data = AttendanceService.get_student_attendance(None, current_user, db)
    return success_response(data)


# ==============================================================================
# 5. ADMIN / HOD INSTITUTIONAL REPORTS
# ==============================================================================

@router.get("/reports/class")
def get_class_attendance_report(
    class_id: str = Query("3R"),
    classId: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/reports/class - Institutional class-wise attendance report."""
    cid = classId or class_id
    data = AttendanceService.get_class_report(cid, db)
    return success_response(data)


@router.get("/reports/subject")
def get_subject_attendance_report(
    class_id: str = Query("3R"),
    subject_id: str = Query("5CS220PC"),
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/reports/subject - Institutional subject-wise attendance report."""
    data = AttendanceService.get_subject_report(class_id, subject_id, db)
    return success_response(data)


@router.get("/reports/student")
def get_student_attendance_report(
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/reports/student - Institutional student-wise attendance report."""
    data = AttendanceService.get_student_attendance(student_code, current_user, db)
    return success_response(data)


@router.get("/reports/teacher")
def get_teacher_attendance_report(
    teacher_id: str = Query(...),
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/reports/teacher - Institutional faculty instructional compliance report."""
    data = AttendanceService.get_teacher_report(teacher_id, db)
    return success_response(data)


@router.get("/reports/shortage")
def get_attendance_shortage_report(
    class_id: Optional[str] = Query(None),
    threshold: float = Query(75.0, ge=0.0, le=100.0),
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/reports/shortage - Institutional defaulters list (<75% attendance)."""
    data = AttendanceService.get_shortage_list(class_id, threshold, db)
    return success_response(data)


@router.get("/reports/shortage/export")
def export_shortage_report(
    class_name: Optional[str] = Query(None),
    threshold: float = Query(75.0),
    format: str = Query("csv"),
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/reports/shortage/export - Exports defaulters list to CSV/Excel with UTF-8 BOM."""
    csv_content = AttendanceService.export_shortage_list_csv(class_name, threshold, format, db)
    filename = f"SSGMCE_Shortage_Defaulters_{class_name or 'All'}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==============================================================================
# 6. EXPORT (CSV & EXCEL COMPATIBLE WITH UTF-8 BOM)
# ==============================================================================

@router.get("/export")
def export_attendance_csv(
    class_name: str = Query("3R"),
    format: str = Query("csv"),
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/export - Official institutional attendance CSV/Excel export with UTF-8 BOM."""
    csv_content = AttendanceService.export_class_attendance_csv(class_name, format, db)
    filename = f"SSGMCE_Attendance_Report_{class_name}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==============================================================================
# 7. ROSTER, SESSIONS, RECORDS & SUMMARY
# ==============================================================================

@router.get("/roster")
def get_attendance_class_roster(
    classId: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    class_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/attendance/roster
    Authoritative student roster for marking attendance in target class.
    """
    cid = class_id or class_name or classId or "3R"

    def extract_numeric(val):
        s = str(val or "").strip()
        m = re.search(r'(\d+)$', s)
        if m:
            return int(m.group(1))
        nums = re.findall(r'\d+', s)
        return int(nums[-1]) if nums else 9999

    rows = db.execute(text("""
        SELECT s.id as student_id, s.roll_no, s.full_name, s.student_code, s.email,
               COALESCE(c.class_name, s.class_name) as class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.class_id::text = :cid OR c.class_name = :cid OR s.class_name = :cid
        ORDER BY s.roll_no ASC
    """), {"cid": cid}).fetchall()

    data = []
    for r in rows:
        m = dict(r._mapping)
        sid_str = str(m["student_id"])
        data.append({
            "id": sid_str,
            "student_id": sid_str,
            "studentId": sid_str,
            "roll_no": m["roll_no"],
            "rollNo": m["roll_no"],
            "full_name": m["full_name"],
            "fullName": m["full_name"],
            "student_code": m["student_code"],
            "studentCode": m["student_code"],
            "email": m.get("email") or "",
            "class_name": m.get("class_name") or cid,
            "recent_attendance": []
        })

    data.sort(key=lambda s: extract_numeric(s.get("roll_no")))
    return success_response({
        "class_id": cid,
        "classId": cid,
        "total_students": len(data),
        "totalStudents": len(data),
        "students": data
    })


@router.get("/sessions")
def get_attendance_sessions(
    teacher_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/sessions - List marked sessions with stats."""
    clause = "WHERE teacher_id::text = :tid" if teacher_id else ""
    params = {"tid": teacher_id} if teacher_id else {}
    rows = db.execute(text(f"""
        SELECT ass.id, ass.session_code, ass.session_date as attendance_date, ass.session_date,
               ass.total_students, ass.present_count, ass.absent_count,
               ass.status, ass.class_name, ass.subject_name, ass.subject_code, ass.attendance_rate
        FROM attendance_sessions ass
        {clause}
        ORDER BY ass.session_date DESC, ass.created_at DESC
        LIMIT 100
    """), params).fetchall()

    sessions = []
    for r in rows:
        m = dict(r._mapping)
        sessions.append({
            "sessionId": str(m["id"]),
            "id": str(m["id"]),
            "sessionCode": m.get("session_code"),
            "date": str(m.get("attendance_date")),
            "lectureDate": str(m.get("attendance_date")),
            "classCode": m.get("class_name") or "3R",
            "subject": m.get("subject_name") or m.get("subject_code") or "Lecture",
            "subjectCode": m.get("subject_code") or m.get("subject_name"),
            "presentCount": m.get("present_count"),
            "absentCount": m.get("absent_count"),
            "totalStudents": m.get("total_students"),
            "attendanceRate": float(m.get("attendance_rate") or 0.0),
            "status": m.get("status")
        })
    return success_response({"sessions": sessions})


@router.get("/records")
def get_attendance_records(
    class_id: Optional[str] = None,
    class_name: Optional[str] = None,
    teacher_id: Optional[str] = None,
    subject_code: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/records - List detailed attendance session records."""
    target_class = class_name or class_id
    clauses = []
    params = {"lim": limit}
    if target_class:
        clauses.append("(ass.class_id::text = :cid OR ass.class_name = :cid)")
        params["cid"] = target_class
    if teacher_id:
        clauses.append("ass.teacher_id::text = :tid")
        params["tid"] = teacher_id
    if subject_code:
        clauses.append("ass.subject_code = :scode")
        params["scode"] = subject_code

    where_str = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = db.execute(text(f"""
        SELECT ass.*
        FROM attendance_sessions ass
        {where_str}
        ORDER BY ass.session_date DESC, ass.period_number ASC
        LIMIT :lim
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])


@router.get("/recent")
def get_recent_attendance(
    class_id: Optional[str] = None,
    class_name: Optional[str] = None,
    teacher_id: Optional[str] = None,
    subject_code: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """GET /api/v1/attendance/recent - Recent sessions list."""
    return get_attendance_records(class_id, class_name, teacher_id, subject_code, limit, db)


@router.get("/summary")
def get_attendance_summary(db: Session = Depends(get_db)):
    """GET /api/v1/attendance/summary - Attendance governance summary for Admin Dashboard."""
    rows = db.execute(text("""
        SELECT id, session_code, class_name, subject_name, subject_code, session_date,
               attendance_rate, total_students, present_count, absent_count, status
        FROM attendance_sessions
        ORDER BY session_date DESC, created_at DESC
        LIMIT 50
    """)).fetchall()
    recent = [dict(r._mapping) for r in rows]
    total_sess = db.execute(text("SELECT count(*) FROM attendance_sessions")).scalar() or 0
    locked_sess = db.execute(text("SELECT count(*) FROM attendance_sessions WHERE status IN ('LOCKED', 'locked')")).scalar() or 0
    approved_sess = db.execute(text("SELECT count(*) FROM attendance_sessions WHERE status IN ('APPROVED', 'approved')")).scalar() or 0
    return success_response({
        "total_sessions": total_sess,
        "locked_sessions": locked_sess,
        "approved_sessions": approved_sess,
        "recent_sessions": recent
    })


# Compatibility Alias
get_student_attendance_summary = get_student_attendance

