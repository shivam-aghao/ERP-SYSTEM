import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config.database import get_db
from backend.schemas.faculty import TeacherProfileUpdate, ClassCardCreate
from backend.services.faculty_service import FacultyService
from backend.utils.helpers import success_response, error_response

router = APIRouter(tags=["Faculty Portal"])

@router.get("/teacher/profile")
def get_teacher_profile(db: Session = Depends(get_db)):
    data = FacultyService.get_profile(db)
    if not data:
        return error_response("Teacher profile not found", 404)
    return success_response(data)

@router.put("/teacher/profile")
def update_teacher_profile(payload: TeacherProfileUpdate, db: Session = Depends(get_db)):
    data = FacultyService.update_profile(payload.model_dump(exclude_unset=True), db)
    return success_response(data or {}, "Profile updated successfully")

@router.get("/dashboard/summary")
def get_faculty_summary(db: Session = Depends(get_db)):
    data = FacultyService.get_summary(db)
    return success_response(data)

@router.get("/timetable/my")
def get_teacher_timetable(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM timetable_entries LIMIT 10")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

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
