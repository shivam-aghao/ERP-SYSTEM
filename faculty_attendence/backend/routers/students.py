from fastapi import APIRouter, Query
from typing import Optional
from database import db
from schemas import ApiResponse

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/class/{class_id}")
def get_class_roster(class_id: str, departmentCode: Optional[str] = Query(None), department: Optional[str] = Query(None)):
    dept = departmentCode or department or "CSE"
    try:
        res = db.table("students").select("*").eq("department_code", dept).eq("class_code", class_id).order("roll_number").execute()
        students = res.data if res.data else []
    except Exception:
        students = []

    # Map students format
    mapped = []
    for s in students:
        roll_num = s.get("roll_number", 1)
        roll_fmt = s.get("roll_formatted") or f"ROLL {str(roll_num).zfill(2)}"
        mapped.append({
            "id": s.get("id"),
            "studentId": s.get("id"),
            "rollNo": roll_fmt,
            "rollNumber": roll_num,
            "studentCode": s.get("prn"),
            "prn": s.get("prn"),
            "name": s.get("name"),
            "fullName": s.get("name"),
            "isProvisional": s.get("is_provisional", False),
            "history": ["P", "P", "P", "P", "A", "P", "P", "P", "P", "P"]
        })

    return ApiResponse(statusCode=200, data=mapped, message="Class roster retrieved", success=True)
