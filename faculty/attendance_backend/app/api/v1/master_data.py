from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.db_models import Department, Class, Subject
from app.utils.response import success_response

router = APIRouter(prefix="/master", tags=["Master Data"])

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).order_by(Department.code).all()
    data = [
        {
            "id": d.code,
            "code": d.code,
            "name": d.name,
            "icon": d.icon or "💻",
            "classesCount": d.classes_count or 4,
            "color": "#0B5CAD",
            "description": d.description
        }
        for d in depts
    ]
    return success_response(data=data)

@router.get("/classes")
def get_classes(department: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Class)
    if department:
        dept = db.query(Department).filter(
            (Department.code == department) | (Department.id == department)
        ).first()
        if dept:
            query = query.filter(Class.department_id == dept.id)
    
    classes = query.order_by(Class.name).all()
    data = [
        {
            "id": c.name,
            "name": c.name,
            "year": c.academic_year or "2nd Year - Sem 3",
            "division": c.division or "Div 1",
            "studentCount": c.total_students or 60,
            "room": c.room or "Hall A",
            "department": c.department.code if c.department else ""
        }
        for c in classes
    ]
    return success_response(data=data)

@router.get("/subjects")
def get_subjects(
    department: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Subject)
    if department:
        dept = db.query(Department).filter(
            (Department.code == department) | (Department.id == department)
        ).first()
        if dept:
            query = query.filter(Subject.department_id == dept.id)
    if semester:
        query = query.filter(Subject.semester == semester)
    
    subjects = query.order_by(Subject.code).all()
    data = [
        {
            "id": s.code,
            "code": s.code,
            "name": s.name,
            "semester": s.semester,
            "type": s.type,
            "department": s.department.code if s.department else ""
        }
        for s in subjects
    ]
    return success_response(data=data)
