import uuid
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config.database import get_db
from backend.schemas.student import StudentProfileUpdate
from backend.services.student_service import StudentService
from backend.utils.helpers import success_response, error_response

router = APIRouter(tags=["Student Portal"])

@router.get("/student/profile")
@router.get("/profile")
def get_student_profile(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    data = StudentService.get_profile(student_code, db)
    if not data:
        return error_response("Student profile not found", 404)
    return success_response(data)

@router.put("/student/profile")
@router.put("/profile")
@router.post("/student/profile/update")
@router.post("/profile/update")
def update_student_profile(payload: StudentProfileUpdate, student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    data = StudentService.update_profile(student_code, payload.model_dump(exclude_unset=True), db)
    return success_response(data or {}, "Profile updated successfully")

@router.get("/student/overview")
@router.get("/overview")
def get_student_overview(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    data = StudentService.get_overview(student_code, db)
    return success_response(data)

@router.get("/student/academic-metrics")
@router.get("/academic-metrics")
@router.get("/metrics")
def get_academic_metrics(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    data = StudentService.get_academic_metrics(student_code, db)
    return success_response(data)

@router.get("/student/attendance")
@router.get("/attendance")
def get_student_attendance(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    code_val = student_code or "308637"
    subjects = db.execute(text("SELECT * FROM student_attendance_subjects LIMIT 20")).fetchall()
    sub_dicts = [dict(s._mapping) for s in subjects]
    tot_pres = sum(s.get("present_periods", 0) for s in sub_dicts)
    tot_lecs = sum(s.get("total_periods", 0) for s in sub_dicts)
    overall_pct = round((tot_pres / tot_lecs * 100), 1) if tot_lecs > 0 else 0.0
    subject_wise = []
    for s in sub_dicts:
        p = s.get("present_periods", 0)
        t = s.get("total_periods", 0)
        pct = round((p / t * 100), 1) if t > 0 else 0.0
        subject_wise.append({
            "id": s.get("id"),
            "code": s.get("subject_code"),
            "subjectCode": s.get("subject_code"),
            "name": s.get("subject_name"),
            "subjectName": s.get("subject_name"),
            "type": s.get("subject_type"),
            "typeName": s.get("type_name"),
            "present": p,
            "attended": p,
            "total": t,
            "percentage": pct,
            "faculty": s.get("faculty_name"),
            "classroom": s.get("classroom")
        })
    return success_response({
        "student_code": code_val,
        "overall_percentage": overall_pct,
        "overallPercentage": overall_pct,
        "total_conducted": tot_lecs,
        "totalLectures": tot_lecs,
        "total_attended": tot_pres,
        "attendedLectures": tot_pres,
        "absentLectures": max(0, tot_lecs - tot_pres),
        "subjects": sub_dicts,
        "subjectWise": subject_wise
    })

@router.get("/student/documents")
@router.get("/documents")
@router.get("/dwallet")
def get_student_documents(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM student_documents LIMIT 10")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.post("/student/documents/upload")
@router.post("/documents/upload")
def upload_student_document(payload: Dict[str, Any] = Body(...)):
    return success_response({"document_id": str(uuid.uuid4())}, "Document uploaded successfully", code=201)

@router.get("/student/fees")
@router.get("/fees")
def get_student_fees(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    records = db.execute(text("SELECT * FROM fee_records LIMIT 5")).fetchall()
    receipts = db.execute(text("SELECT * FROM fee_receipts LIMIT 5")).fetchall()
    return success_response({
        "records": [dict(r._mapping) for r in records],
        "receipts": [dict(r._mapping) for r in receipts]
    })

@router.post("/student/fees/pay")
@router.post("/fees/pay")
def pay_student_fees(payload: Dict[str, Any] = Body(...)):
    return success_response({"transaction_id": f"TXN_{uuid.uuid4().hex[:10].upper()}", "status": "SUCCESS"}, "Payment processed")

@router.get("/student/elearning")
@router.get("/elearning")
def get_student_elearning(db: Session = Depends(get_db)):
    assignments = db.execute(text("SELECT * FROM elearning_assignments LIMIT 5")).fetchall()
    content = db.execute(text("SELECT * FROM elearning_content LIMIT 5")).fetchall()
    return success_response({
        "assignments": [dict(a._mapping) for a in assignments],
        "content": [dict(c._mapping) for c in content]
    })

@router.get("/student/change-info")
@router.get("/change-info")
def get_change_info_requests(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM change_info_requests LIMIT 5")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.post("/student/change-info")
@router.post("/change-info")
def submit_change_info_request(payload: Dict[str, Any] = Body(...)):
    return success_response({"request_id": str(uuid.uuid4())}, "Change info request submitted", code=201)

@router.get("/student/examination")
@router.get("/examination")
def get_student_examination(db: Session = Depends(get_db)):
    marks = db.execute(text("SELECT * FROM exam_marks LIMIT 10")).fetchall()
    return success_response({"marks": [dict(m._mapping) for m in marks]})
