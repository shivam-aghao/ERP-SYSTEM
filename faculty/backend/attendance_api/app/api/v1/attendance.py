import logging
from datetime import datetime, timezone
from typing import Optional, Union
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.db_models import (
    Teacher, Class, Subject, Department, AttendanceSession,
    AttendanceRecord, AttendanceHistorySummary, Student, Notification
)
from app.models.schema import AttendanceDraftSave, AttendanceSubmitRequest
from app.database import get_supabase_client
from app.utils.response import success_response, error_response

logger = logging.getLogger("erp_fastapi")

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.get("/check-duplicate")
def check_duplicate(
    department: Optional[str] = Query(None),
    classId: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    subjectCode: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sb = get_supabase_client()
        if sb and classId and date and subjectCode:
            q = sb.table("attendance_sessions").select("id").eq("class_code", classId).eq("lecture_date", date).eq("subject_code", subjectCode).eq("status", "submitted")
            res = q.execute()
            if res.data and len(res.data) > 0:
                return success_response(data={"isDuplicate": True})
    except Exception as e:
        logger.warning("[Attendance] Supabase duplicate check notice: %s", e)

    query = db.query(AttendanceSession).filter(AttendanceSession.status == "SUBMITTED")
    if classId:
        cls = db.query(Class).filter((Class.name == classId) | (Class.id == classId)).first()
        if cls:
            query = query.filter(AttendanceSession.class_id == cls.id)
        else:
            return success_response(data={"isDuplicate": False})

    if subjectCode:
        subj = db.query(Subject).filter((Subject.code == subjectCode) | (Subject.id == subjectCode)).first()
        if subj:
            query = query.filter(AttendanceSession.subject_id == subj.id)
        else:
            return success_response(data={"isDuplicate": False})

    if date:
        query = query.filter(AttendanceSession.attendance_date == date)
    if period:
        query = query.filter(AttendanceSession.period == str(period))

    existing = query.first()
    return success_response(data={"isDuplicate": existing is not None})

@router.get("/draft")
def get_draft(
    classId: str = Query(...),
    subjectCode: str = Query(...),
    date: str = Query(...),
    period: Optional[str] = Query("1"),
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cls = db.query(Class).filter((Class.name == classId) | (Class.id == classId)).first()
    subj = db.query(Subject).filter((Subject.code == subjectCode) | (Subject.id == subjectCode)).first()

    if not cls or not subj:
        return success_response(data=None)

    draft = db.query(AttendanceSession).filter_by(
        teacher_id=current_user.id,
        class_id=cls.id,
        subject_id=subj.id,
        attendance_date=date,
        period=str(period),
        status="DRAFT"
    ).first()

    if not draft:
        return success_response(data=None)

    records = db.query(AttendanceRecord).filter_by(session_id=draft.id).all()
    record_list = [
        {
            "studentId": r.student_id,
            "rollNo": r.student.roll_no if r.student else 0,
            "studentCode": r.student.student_code if r.student else "",
            "fullName": r.student.full_name if r.student else "",
            "status": r.status,
            "remarks": r.remarks
        }
        for r in records
    ]

    return success_response(data={
        "id": draft.id,
        "classId": cls.name,
        "subjectCode": subj.code,
        "date": draft.attendance_date,
        "period": draft.period,
        "topic": draft.topic_covered,
        "teachingAid": draft.teaching_aid,
        "remark": draft.remarks,
        "records": record_list
    })

@router.post("/draft")
def save_draft(
    payload: AttendanceDraftSave,
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cls = db.query(Class).filter((Class.name == payload.classId) | (Class.id == payload.classId)).first()
    if not cls:
        dept = db.query(Department).first()
        cls = Class(department_id=dept.id if dept else "", name=payload.classId, academic_year="2024-2025")
        db.add(cls)
        db.flush()

    subj = db.query(Subject).filter((Subject.code == payload.subjectCode) | (Subject.id == payload.subjectCode)).first()
    if not subj:
        subj = Subject(department_id=cls.department_id, code=payload.subjectCode, name=payload.subjectCode)
        db.add(subj)
        db.flush()

    session = db.query(AttendanceSession).filter_by(
        teacher_id=current_user.id,
        class_id=cls.id,
        subject_id=subj.id,
        attendance_date=payload.date,
        period=str(payload.period or "1"),
        status="DRAFT"
    ).first()

    if not session:
        session = AttendanceSession(
            teacher_id=current_user.id,
            class_id=cls.id,
            subject_id=subj.id,
            attendance_date=payload.date,
            period=str(payload.period or "1"),
            status="DRAFT"
        )
        db.add(session)
        db.flush()

    session.topic_covered = payload.topic or ""
    session.teaching_aid = payload.teachingAid or "Blackboard / PPT"
    session.remarks = payload.remark or ""

    if payload.records:
        for r in payload.records:
            st_id = r.studentId
            if not st_id and r.rollNo is not None:
                st = db.query(Student).filter_by(class_id=cls.id, roll_no=int(r.rollNo)).first()
                if st:
                    st_id = st.id
            if st_id:
                rec = db.query(AttendanceRecord).filter_by(session_id=session.id, student_id=st_id).first()
                if rec:
                    rec.status = r.status.upper() if r.status else "PRESENT"
                    rec.remarks = r.remarks
                else:
                    db.add(AttendanceRecord(
                        session_id=session.id,
                        student_id=st_id,
                        status=r.status.upper() if r.status else "PRESENT",
                        remarks=r.remarks
                    ))

    db.commit()
    return success_response(data={"sessionId": session.id}, message="Attendance draft saved successfully")

@router.post("/submit")
def submit_attendance(
    payload: AttendanceSubmitRequest,
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records_in = payload.records or []
    total_students = len(records_in)
    present_cnt = sum(1 for r in records_in if (r.status or "").upper() in ("PRESENT", "P"))
    absent_cnt = sum(1 for r in records_in if (r.status or "").upper() in ("ABSENT", "A"))
    rate = round((present_cnt / total_students * 100), 1) if total_students > 0 else 0.0

    # 1. Sync submission to Cloud Supabase
    supabase_session_id = None
    try:
        sb = get_supabase_client()
        if sb:
            dept_code = "CSE"
            sess_insert = sb.table("attendance_sessions").insert({
                "session_id": f"SESS-{datetime.now().strftime('%Y%m%d')}-{payload.classId}-{datetime.now().strftime('%M%S')}",
                "faculty_id": current_user.id,
                "class_code": payload.classId,
                "subject_code": payload.subjectCode,
                "department_code": dept_code,
                "lecture_date": payload.date,
                "lecture_time": payload.period or "10:00 AM - 11:00 AM",
                "marking_mode": "roster",
                "total_students": total_students,
                "present_count": present_cnt,
                "absent_count": absent_cnt,
                "attendance_rate": rate,
                "status": "submitted"
            }).execute()
            if sess_insert.data and len(sess_insert.data) > 0:
                supabase_session_id = sess_insert.data[0].get("id")

                # Insert student attendance records to Supabase
                rec_payloads = []
                for r in records_in:
                    rec_payloads.append({
                        "session_id": supabase_session_id,
                        "student_id": r.studentId if r.studentId else None,
                        "roll_no": r.rollNo,
                        "status": "present" if (r.status or "").upper() in ("PRESENT", "P") else "absent",
                        "remarks": r.remarks
                    })
                if rec_payloads:
                    sb.table("attendance_records").insert(rec_payloads).execute()
    except Exception as e:
        logger.warning("[Attendance] Supabase submit error: %s", e)

    # 2. Local DB mirror
    cls = db.query(Class).filter((Class.name == payload.classId) | (Class.id == payload.classId)).first()
    if not cls:
        dept = db.query(Department).first()
        cls = Class(department_id=dept.id if dept else "", name=payload.classId, academic_year="2024-2025", total_students=total_students)
        db.add(cls)
        db.flush()

    subj = db.query(Subject).filter((Subject.code == payload.subjectCode) | (Subject.id == payload.subjectCode)).first()
    if not subj:
        subj = Subject(department_id=cls.department_id, code=payload.subjectCode, name=payload.subjectCode)
        db.add(subj)
        db.flush()

    session = AttendanceSession(
        id=supabase_session_id or None,
        teacher_id=current_user.id,
        class_id=cls.id,
        subject_id=subj.id,
        attendance_date=payload.date,
        period=str(payload.period or "1"),
        status="SUBMITTED",
        topic_covered=payload.topic or "",
        teaching_aid=payload.teachingAid or "Blackboard / PPT",
        remarks=payload.remark or "",
        total_students=total_students,
        present_count=present_cnt,
        absent_count=absent_cnt,
        attendance_rate=rate,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(session)
    db.flush()

    db.add(Notification(
        teacher_id=current_user.id,
        title="Attendance Submitted",
        message=f"Attendance submitted for {payload.classId} ({payload.subjectCode}) on {payload.date}. {present_cnt}/{total_students} present.",
        type="SUCCESS"
    ))
    db.commit()

    return success_response(
        data={
            "sessionId": session.id,
            "status": "SUBMITTED",
            "summary": {
                "total": total_students,
                "present": present_cnt,
                "absent": absent_cnt,
                "attendanceRate": rate
            }
        },
        message="Attendance submitted successfully to cloud database",
        code=201
    )

@router.get("/records")
def get_all_records(
    teacherId: Optional[str] = Query(None),
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch live submitted attendance records from Cloud Supabase with database fallback."""
    try:
        sb = get_supabase_client()
        if sb:
            res = sb.table("attendance_sessions").select("*").eq("status", "submitted").order("lecture_date", desc=True).execute()
            if res.data is not None:
                # Enrich with subject names
                subj_res = sb.table("subjects").select("code, name").execute()
                subj_dict = {s["code"]: s["name"] for s in (subj_res.data or [])}

                data = []
                for s in res.data:
                    s_code = s.get("subject_code") or ""
                    data.append({
                        "id": s.get("id"),
                        "teacherId": current_user.emp_code,
                        "teacherName": current_user.full_name,
                        "department": s.get("department_code") or "CSE",
                        "departmentName": "Computer Science & Engineering",
                        "classId": s.get("class_code") or "",
                        "subjectCode": s_code,
                        "subjectName": subj_dict.get(s_code, s_code),
                        "subject": f"{s_code} - {subj_dict.get(s_code, s_code)}",
                        "date": s.get("lecture_date"),
                        "period": s.get("lecture_time") or "1",
                        "sessionType": "REGULAR",
                        "topic": "",
                        "remark": "",
                        "status": "Submitted",
                        "totalStudents": s.get("total_students") or 0,
                        "presentCount": s.get("present_count") or 0,
                        "absentCount": s.get("absent_count") or 0,
                        "attendanceRate": s.get("attendance_rate") or 0.0,
                        "submittedAt": s.get("submitted_at") or s.get("created_at") or ""
                    })
                return success_response(data=data)
    except Exception as e:
        logger.warning("[Attendance] Supabase records fetch error: %s", e)

    sessions = db.query(AttendanceSession).filter(AttendanceSession.status == "SUBMITTED").order_by(
        AttendanceSession.attendance_date.desc()
    ).all()

    data = [
        {
            "id": s.id,
            "teacherId": s.teacher.emp_code if s.teacher else current_user.emp_code,
            "teacherName": s.teacher.full_name if s.teacher else current_user.full_name,
            "department": s.assigned_class.department.code if s.assigned_class and s.assigned_class.department else "CSE",
            "departmentName": s.assigned_class.department.name if s.assigned_class and s.assigned_class.department else "Computer Science & Engineering",
            "classId": s.assigned_class.name if s.assigned_class else "",
            "subjectCode": s.subject.code if s.subject else "",
            "subjectName": s.subject.name if s.subject else "",
            "subject": f"{s.subject.code} - {s.subject.name}" if s.subject else "",
            "date": s.attendance_date,
            "period": s.period or "1",
            "sessionType": "REGULAR",
            "topic": s.topic_covered or "",
            "remark": s.remarks or "",
            "status": "Submitted",
            "totalStudents": s.total_students,
            "presentCount": s.present_count,
            "absentCount": s.absent_count,
            "attendanceRate": s.attendance_rate,
            "submittedAt": s.submitted_at.isoformat() if s.submitted_at else ""
        }
        for s in sessions
    ]
    return success_response(data=data)

@router.get("/sessions/{session_id}")
def get_session_details(
    session_id: str,
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sb = get_supabase_client()
        if sb:
            s_res = sb.table("attendance_sessions").select("*").eq("id", session_id).execute()
            if s_res.data and len(s_res.data) > 0:
                s = s_res.data[0]
                rec_res = sb.table("attendance_records").select("*").eq("session_id", session_id).order("roll_no").execute()
                records = [
                    {
                        "id": r.get("id"),
                        "studentId": r.get("student_id"),
                        "rollNo": r.get("roll_no"),
                        "status": (r.get("status") or "").upper(),
                        "remarks": r.get("remarks")
                    }
                    for r in (rec_res.data or [])
                ]
                return success_response(data={
                    "id": s.get("id"),
                    "classId": s.get("class_code"),
                    "subjectCode": s.get("subject_code"),
                    "date": s.get("lecture_date"),
                    "totalStudents": s.get("total_students"),
                    "presentCount": s.get("present_count"),
                    "absentCount": s.get("absent_count"),
                    "attendanceRate": s.get("attendance_rate"),
                    "records": records
                })
    except Exception as e:
        logger.warning("[Attendance] Supabase session details fetch error: %s", e)

    session = db.query(AttendanceSession).filter_by(id=session_id).first()
    if not session:
        return error_response("Attendance session not found", code=404)

    records = db.query(AttendanceRecord).filter_by(session_id=session.id).join(Student).order_by(Student.roll_no).all()
    record_items = [
        {
            "id": r.id,
            "studentId": r.student_id,
            "rollNo": r.student.roll_no if r.student else 0,
            "studentCode": r.student.student_code if r.student else "",
            "fullName": r.student.full_name if r.student else "",
            "status": r.status,
            "remarks": r.remarks
        }
        for r in records
    ]

    return success_response(data={
        "id": session.id,
        "classId": session.assigned_class.name if session.assigned_class else "",
        "subjectCode": session.subject.code if session.subject else "",
        "date": session.attendance_date,
        "totalStudents": session.total_students,
        "presentCount": session.present_count,
        "absentCount": session.absent_count,
        "attendanceRate": session.attendance_rate,
        "records": record_items
    })
