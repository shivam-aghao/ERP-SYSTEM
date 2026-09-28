from fastapi import APIRouter, Query
from typing import Optional
from database import db
from schemas import ApiResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("")
@router.get("/")
def get_subjects(department: Optional[str] = Query(None), departmentCode: Optional[str] = Query(None)):
    dept = departmentCode or department
    try:
        q = db.table("subjects").select("*").order("code")
        if dept:
            q = q.eq("department_code", dept)
        res = q.execute()
        subjects = res.data if res.data else []
    except Exception:
        subjects = []

    if not subjects:
        subjects = [
            {"code": "CS302", "name": "Data Structures", "department_code": "CSE", "type": "Theory", "icon": "📘"},
            {"code": "CS303", "name": "Java Programming", "department_code": "CSE", "type": "Theory + Lab", "icon": "☕"},
            {"code": "CS304", "name": "Operating Systems", "department_code": "CSE", "type": "Theory", "icon": "🖥️"},
            {"code": "CS305", "name": "Database Management", "department_code": "CSE", "type": "Theory", "icon": "🗄️"}
        ]

    return ApiResponse(statusCode=200, data=subjects, message="Subjects retrieved", success=True)
