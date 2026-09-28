from fastapi import APIRouter, Header, Depends
from typing import Optional
from config import settings
from database import db
from schemas import ApiResponse, LoginRequest

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(payload: LoginRequest):
    # Fetch teacher from Supabase
    query = db.table("teachers").select("*").eq("is_active", True)
    if payload.employeeCode:
        query = query.eq("employee_code", payload.employeeCode)
    elif payload.email:
        query = query.eq("email", payload.email)
    
    res = query.execute()
    teacher = res.data[0] if res.data else None
    
    if not teacher:
        # Fallback to default teacher Prof. Rajesh Sharma
        res_default = db.table("teachers").select("*").limit(1).execute()
        teacher = res_default.data[0] if res_default.data else {
            "id": settings.DEFAULT_TEACHER_ID,
            "employee_code": settings.DEFAULT_TEACHER_CODE,
            "name": "Prof. Rajesh Sharma",
            "email": "rajesh.sharma@ssgmce.ac.in",
            "designation": "Associate Professor",
            "department_code": "CSE",
            "avatar": "RS",
            "unread_notifications": 3
        }

    return ApiResponse(
        statusCode=200,
        data={
            "accessToken": "mock-python-jwt-token-active-session",
            "teacher": {
                "id": teacher.get("id"),
                "employeeCode": teacher.get("employee_code"),
                "name": teacher.get("name"),
                "email": teacher.get("email"),
                "designation": teacher.get("designation"),
                "department": teacher.get("department_code"),
                "departmentCode": teacher.get("department_code"),
                "avatar": teacher.get("avatar") or "RS",
                "unreadNotifications": teacher.get("unread_notifications", 3)
            }
        },
        message="Login successful",
        success=True
    )

@router.get("/me")
def get_me(x_teacher_id: Optional[str] = Header(None)):
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
        message="Profile retrieved",
        success=True
    )

@router.post("/logout")
def logout():
    return ApiResponse(statusCode=200, data=None, message="Logged out successfully", success=True)
