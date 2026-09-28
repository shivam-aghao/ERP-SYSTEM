from fastapi import APIRouter, Header
from typing import Optional
from config import settings
from database import db
from schemas import ApiResponse

router = APIRouter(prefix="/teacher", tags=["Teacher"])

@router.get("/profile")
def get_profile(x_teacher_id: Optional[str] = Header(None)):
    teacher_id = x_teacher_id or settings.DEFAULT_TEACHER_ID
    res = db.table("teachers").select("*").eq("id", teacher_id).execute()
    teacher = res.data[0] if res.data else None
    if not teacher:
        res = db.table("teachers").select("*").limit(1).execute()
        teacher = res.data[0] if res.data else {}

    return ApiResponse(
        statusCode=200,
        data={
            "id": teacher.get("id"),
            "employeeCode": teacher.get("employee_code"),
            "name": teacher.get("name"),
            "email": teacher.get("email"),
            "designation": teacher.get("designation"),
            "department": teacher.get("department_code"),
            "departmentCode": teacher.get("department_code"),
            "avatar": teacher.get("avatar") or "RS",
            "unreadNotifications": teacher.get("unread_notifications", 3)
        },
        message="Teacher profile retrieved",
        success=True
    )
