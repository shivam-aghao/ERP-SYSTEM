import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config.database import get_db
from backend.schemas.faculty import TeacherProfileUpdate, ClassCardCreate
from backend.services.faculty_service import FacultyService
from backend.utils.helpers import success_response, error_response

router = APIRouter(tags=["Faculty Portal"])

def extract_teacher_identifier(request: Request, teacher_id: Optional[str] = None, emp_code: Optional[str] = None) -> Optional[str]:
    if teacher_id:
        return teacher_id.strip()
    if emp_code:
        return emp_code.strip()
    if request:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.startswith("Bearer "):
            token = auth_hdr.split(" ", 1)[1].strip()
            if token.startswith("teach_token_"):
                return token.replace("teach_token_", "").strip()
        if request.headers.get("x-teacher-id"):
            return request.headers.get("x-teacher-id").strip()
        if request.headers.get("x-emp-code"):
            return request.headers.get("x-emp-code").strip()
    return None

@router.get("/teachers")
def get_all_teachers(db: Session = Depends(get_db)):
    """List all 15 faculty members with designation, department, and teaching load."""
    data = FacultyService.get_all_teachers(db)
    return success_response(data)

@router.get("/teacher/profile")
<<<<<<< HEAD
def get_teacher_profile(request: Request, teacher_id: Optional[str] = Query(None), emp_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    tid = extract_teacher_identifier(request, teacher_id, emp_code)
    data = FacultyService.get_profile(db, tid)
=======
@router.get("/profile")
def get_teacher_profile(
    empCode: Optional[str] = Query(None, alias="empCode"),
    emp_code: Optional[str] = Query(None),
    teacher_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    code = empCode or emp_code or teacher_id
    data = FacultyService.get_profile(db, emp_code=code)
>>>>>>> fd7760bf814784b37a85b715e43aae31ce38985e
    if not data:
        return error_response("Teacher profile not found", 404)
    return success_response(data)

@router.put("/teacher/profile")
def update_teacher_profile(payload: TeacherProfileUpdate, request: Request, teacher_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    tid = extract_teacher_identifier(request, teacher_id)
    data = FacultyService.update_profile(payload.model_dump(exclude_unset=True), db, tid)
    return success_response(data or {}, "Profile updated successfully")

@router.get("/dashboard/summary")
def get_faculty_summary(request: Request, teacher_id: Optional[str] = Query(None), emp_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    tid = extract_teacher_identifier(request, teacher_id, emp_code)
    data = FacultyService.get_summary(db, tid)
    return success_response(data)

@router.get("/timetable/my")
@router.get("/teacher/timetable")
def get_teacher_timetable(request: Request, teacher_id: Optional[str] = Query(None), emp_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Fetch strict personal weekly timetable from PDF schedule for the authenticated teacher."""
    tid = extract_teacher_identifier(request, teacher_id, emp_code)
    data = FacultyService.get_personal_timetable(tid, db)
    return success_response(data)

@router.get("/timetable/teacher/{teacher_id}")
def get_specific_teacher_timetable(teacher_id: str, db: Session = Depends(get_db)):
    """Fetch strict personal weekly timetable for any specific teacher ID or emp_code."""
    data = FacultyService.get_personal_timetable(teacher_id, db)
    return success_response(data)

@router.get("/class-cards")
def get_class_cards(db: Session = Depends(get_db)):
    data = FacultyService.get_class_cards(db)
    return success_response(data)

@router.post("/class-cards")
def create_class_card(payload: ClassCardCreate, db: Session = Depends(get_db)):
    cid = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO class_cards (id, teacher_id, class_id, subject_id, academic_year, semester, created_at)
        VALUES (:id, (SELECT id FROM teachers LIMIT 1), :cid, :sid, :ay, :sem, CURRENT_TIMESTAMP)
    """), {"id": cid, "cid": payload.class_id, "sid": payload.subject_id, "ay": payload.academic_year, "sem": payload.semester})
    db.commit()
    return success_response({"id": cid}, "Class card created", code=201)

@router.delete("/class-cards/{card_id}")
def delete_class_card(card_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM class_cards WHERE id = :id"), {"id": card_id})
    db.commit()
    return success_response({"id": card_id}, "Class card deleted")

@router.get("/reports/classes/{class_id}/stats")
def get_class_stats(class_id: str, db: Session = Depends(get_db)):
    total = db.execute(text("SELECT count(*) FROM students WHERE class_id = :cid"), {"cid": class_id}).scalar() or 0
    tot_records = db.execute(text("""
        SELECT count(*) as total, sum(case when status='present' then 1 else 0 end) as present 
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        WHERE s.class_id = :cid
    """), {"cid": class_id}).fetchone()
    tot_rec = tot_records[0] or 0 if tot_records else 0
    pres_rec = tot_records[1] or 0 if tot_records else 0
    avg_att = round((pres_rec / tot_rec * 100), 1) if tot_rec > 0 else 0.0
    return success_response({
        "class_id": class_id,
        "total_enrolled": total,
        "average_attendance": avg_att,
        "defaulters_count": 0
    })
