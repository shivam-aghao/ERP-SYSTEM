from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.db_models import Teacher
from app.models.schema import LoginRequest, RefreshTokenRequest, TokenResponse, UserOut
from app.utils.response import success_response, error_response
from app.utils.security import (
    verify_password, create_access_token, create_refresh_token, decode_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    query = db.query(Teacher)
    if payload.email:
        query = query.filter(Teacher.email == payload.email)
    elif payload.employeeCode:
        query = query.filter(Teacher.emp_code == payload.employeeCode)
    else:
        return error_response("Please provide either employeeCode or email", code=400)
    
    teacher = query.first()
    if not teacher or not verify_password(payload.password, teacher.password_hash):
        return error_response("Invalid credentials. Please check your employee code/email and password.", code=401)
    
    dept_code = teacher.department.code if teacher.department else "CSE"
    access_token = create_access_token(
        subject=teacher.id,
        extra_claims={"empCode": teacher.emp_code, "role": "faculty", "dept": dept_code}
    )
    refresh_token = create_refresh_token(subject=teacher.id)

    user_data = {
        "id": teacher.id,
        "name": teacher.full_name,
        "empCode": teacher.emp_code,
        "designation": teacher.designation,
        "department": dept_code,
        "email": teacher.email,
        "avatar": teacher.avatar or "RS"
    }

    return success_response(
        data={
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "tokenType": "bearer",
            "user": user_data
        },
        message="Login successful"
    )

@router.post("/refresh-token")
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        decoded = decode_token(payload.refreshToken, is_refresh=True)
        teacher_id = decoded.get("sub")
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            return error_response("Invalid refresh token", code=401)
        
        dept_code = teacher.department.code if teacher.department else "CSE"
        new_access_token = create_access_token(
            subject=teacher.id,
            extra_claims={"empCode": teacher.emp_code, "role": "faculty", "dept": dept_code}
        )
        return success_response(data={"accessToken": new_access_token}, message="Token refreshed successfully")
    except Exception as e:
        return error_response(f"Refresh failed: {str(e)}", code=401)

@router.post("/logout")
def logout():
    return success_response(message="Logged out successfully")

@router.get("/me")
def get_me(current_user: Teacher = Depends(get_current_user)):
    dept_code = current_user.department.code if current_user.department else "CSE"
    return success_response(data={
        "id": current_user.id,
        "name": current_user.full_name,
        "empCode": current_user.emp_code,
        "designation": current_user.designation,
        "department": dept_code,
        "email": current_user.email,
        "avatar": current_user.avatar or "RS"
    })
