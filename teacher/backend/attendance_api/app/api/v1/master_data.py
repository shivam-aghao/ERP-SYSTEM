import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.db_models import Department, Class, Subject
from app.database import get_supabase_client
from app.utils.response import success_response

logger = logging.getLogger("erp_fastapi")

router = APIRouter(prefix="/master", tags=["Master Data"])

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    """Fetch live departments directly from Supabase, with local cache fallback."""
    try:
        sb = get_supabase_client()
        if sb:
            res = sb.table("departments").select("*").order("code").execute()
            if res.data and len(res.data) > 0:
                data = [
                    {
                        "id": d.get("code"),
                        "code": d.get("code"),
                        "name": d.get("name"),
                        "icon": d.get("icon") or "💻",
                        "classesCount": d.get("classes_count") or 4,
                        "color": "#0B5CAD",
                        "description": d.get("description") or f"Department of {d.get('code')}"
                    }
                    for d in res.data
                ]
                return success_response(data=data)
    except Exception as e:
        logger.warning("[MasterData] Supabase departments error: %s", e)

    depts = db.query(Department).order_by(Department.code).all()
    data = [
        {
            "id": d.code,
            "code": d.code,
            "name": d.name,
            "icon": d.icon or "💻",
            "classesCount": d.classes_count or 4,
            "color": "#0B5CAD",
            "description": d.description or f"Department of {d.code}"
        }
        for d in depts
    ]
    return success_response(data=data)

@router.get("/classes")
def get_classes(department: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Fetch live classes directly from Supabase, with local cache fallback."""
    try:
        sb = get_supabase_client()
        if sb:
            query = sb.table("classes").select("*")
            if department:
                query = query.eq("department_code", department)
            res = query.order("code").execute()
            if res.data and len(res.data) > 0:
                data = [
                    {
                        "id": c.get("code"),
                        "name": c.get("code"),
                        "year": c.get("academic_year") or "2024-2025",
                        "division": c.get("name") or "Div A",
                        "studentCount": c.get("students_count") or 60,
                        "room": c.get("room") or "Room 201",
                        "department": c.get("department_code") or "CSE"
                    }
                    for c in res.data
                ]
                return success_response(data=data)
    except Exception as e:
        logger.warning("[MasterData] Supabase classes error: %s", e)

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
            "year": c.academic_year or "2024-2025",
            "division": c.division or "Div A",
            "studentCount": c.total_students or 60,
            "room": c.room or "Room 201",
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
    """Fetch live subjects directly from Supabase, with local cache fallback."""
    try:
        sb = get_supabase_client()
        if sb:
            query = sb.table("subjects").select("*")
            res = query.order("code").execute()
            if res.data and len(res.data) > 0:
                data = [
                    {
                        "id": s.get("code"),
                        "code": s.get("code"),
                        "name": s.get("name"),
                        "semester": s.get("semester") or "Semester 5",
                        "type": "THEORY",
                        "department": department or "CSE"
                    }
                    for s in res.data
                ]
                return success_response(data=data)
    except Exception as e:
        logger.warning("[MasterData] Supabase subjects error: %s", e)

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
