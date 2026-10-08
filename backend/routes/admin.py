from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config.database import get_db
from backend.services.admin_service import AdminService
from backend.utils.helpers import success_response

router = APIRouter(tags=["Admin & Master Data"])

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM departments ORDER BY dept_name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM classes ORDER BY class_name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT id, department_id, code, name, type, credits, code as subject_code, name as subject_name FROM subjects ORDER BY name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.get("/students")
def get_all_students(class_name: Optional[str] = None, class_id: Optional[str] = None, db: Session = Depends(get_db)):
    clause = ""
    params = {}
    if class_id:
        clause = "WHERE s.class_id = :cid"
        params["cid"] = class_id
    elif class_name:
        clause = "WHERE c.class_name = :cname"
        params["cname"] = class_name

    rows = db.execute(text(f"""
        SELECT s.*, c.class_name, c.division
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        {clause}
        ORDER BY s.roll_no ASC, s.full_name ASC
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.get("/students/class/{class_id}")
def get_students_by_class(class_id: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT s.*, c.class_name, c.division
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.class_id = :cid OR c.class_name = :cid
        ORDER BY s.roll_no ASC
    """), {"cid": class_id}).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    data = AdminService.get_system_stats(db)
    return success_response(data)
