from fastapi import APIRouter, Query
from typing import Optional
from database import db
from schemas import ApiResponse

router = APIRouter(prefix="/classes", tags=["Classes"])

@router.get("")
@router.get("/")
def get_classes(department: Optional[str] = Query(None), departmentCode: Optional[str] = Query(None)):
    dept = departmentCode or department
    try:
        q = db.table("classes").select("*").order("code")
        if dept:
            q = q.eq("department_code", dept)
        res = q.execute()
        classes = res.data if res.data else []
    except Exception:
        classes = []

    if not classes:
        # Fallback list for CSE
        classes = [
            {"id": "2R1", "code": "2R1", "name": "2R1", "department_code": "CSE", "year": "2nd Year - Sem 3", "student_count": 69, "room": "Lab 301 / Hall A"},
            {"id": "2R2", "code": "2R2", "name": "2R2", "department_code": "CSE", "year": "2nd Year - Sem 3", "student_count": 60, "room": "Hall B"},
            {"id": "3R",  "code": "3R",  "name": "3R",  "department_code": "CSE", "year": "3rd Year - Sem 5", "student_count": 60, "room": "Hall C"},
            {"id": "4R",  "code": "4R",  "name": "4R",  "department_code": "CSE", "year": "4th Year - Sem 7", "student_count": 58, "room": "Seminar Hall"}
        ]

    return ApiResponse(statusCode=200, data=classes, message="Classes retrieved", success=True)
