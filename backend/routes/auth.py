from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from backend.config.database import get_db
from backend.schemas.auth import LoginRequest
from backend.services.auth_service import AuthService
from backend.utils.helpers import success_response

router = APIRouter(tags=["Authentication"])

@router.post("/auth/login")
@router.post("/api/auth/login")
@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    result = AuthService.authenticate_user(payload, db)
    resp = success_response(result, "Authenticated successfully")
    # Add top-level convenience keys for any client formats
    resp["user"] = result.get("user")
    resp["token"] = result.get("token")
    resp["role"] = result.get("role")
    resp["redirect"] = result.get("redirect")
    return resp

@router.post("/auth/logout")
@router.post("/api/auth/logout")
@router.post("/logout")
def logout():
    return success_response({"logged_out": True}, "Session terminated successfully")

@router.get("/auth/me")
@router.get("/api/auth/me")
def get_current_user(role: str = Query("student"), db: Session = Depends(get_db)):
    from sqlalchemy import text
    if role in ("student", "learner"):
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
        return success_response(dict(st._mapping) if st else {})
    t = db.execute(text("SELECT * FROM teachers LIMIT 1")).fetchone()
    return success_response(dict(t._mapping) if t else {})
