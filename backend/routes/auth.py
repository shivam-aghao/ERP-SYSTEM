from typing import Optional
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.auth import (
    AuthenticationService,
    AuthenticatedUser,
    LoginPayload,
    RefreshTokenRequest,
    get_current_user,
    get_optional_user,
    require_student,
    require_teacher,
    require_admin,
    require_hod,
    require_accountant
)
from backend.auth.dependencies import get_token_from_request
from backend.utils.helpers import success_response

router = APIRouter(tags=["Authentication"])


@router.post("/auth/login")
@router.post("/api/auth/login")
@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    """
    Authoritative login endpoint for Students, Teachers, and Administrators.
    Validates credentials and issues signed JWT access and refresh tokens.
    """
    result = AuthenticationService.authenticate(payload, db)
    resp = success_response(result.model_dump(), "Authenticated successfully")
    # Top-level keys for backwards-compatibility with various client scripts
    resp["token"] = result.access_token
    resp["access_token"] = result.access_token
    resp["refresh_token"] = result.refresh_token
    resp["user"] = result.user
    resp["role"] = result.role
    resp["redirect"] = result.redirect
    return resp


@router.post("/auth/refresh")
@router.post("/api/auth/refresh")
def refresh_session(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refreshes an expired access token using a valid signed refresh token.
    """
    result = AuthenticationService.refresh_access_token(payload.refresh_token, db)
    return success_response(result, "Session refreshed successfully")


@router.post("/auth/logout")
@router.post("/api/auth/logout")
@router.post("/logout")
def logout(
    request: Request,
    token: Optional[str] = Depends(get_token_from_request)
):
    """
    Terminates the user session and revokes the active authentication token.
    """
    if token:
        AuthenticationService.revoke_token(token)
    return success_response({"logged_out": True}, "Session terminated successfully")


@router.get("/auth/me")
@router.get("/api/auth/me")
def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Validates active JWT token and returns server-verified user identity and role.
    NEVER relies on client query parameters or storage.
    """
    return success_response(current_user.model_dump(), "User identity verified")


@router.get("/auth/verify/student")
def verify_student_access(current_user: AuthenticatedUser = Depends(require_student)):
    """Verifies that the caller is an authenticated student."""
    return success_response(current_user.model_dump(), "Student authorization verified")


@router.get("/auth/verify/teacher")
def verify_teacher_access(current_user: AuthenticatedUser = Depends(require_teacher)):
    """Verifies that the caller is an authenticated teacher or administrative faculty."""
    return success_response(current_user.model_dump(), "Teacher authorization verified")


@router.get("/auth/verify/hod")
def verify_hod_access(current_user: AuthenticatedUser = Depends(require_hod)):
    """Verifies that the caller is an authenticated Head of Department."""
    return success_response(current_user.model_dump(), "HOD authorization verified")


@router.get("/auth/verify/accountant")
def verify_accountant_access(current_user: AuthenticatedUser = Depends(require_accountant)):
    """Verifies that the caller is an authenticated accountant or financial admin."""
    return success_response(current_user.model_dump(), "Accountant authorization verified")


@router.get("/auth/verify/admin")
def verify_admin_access(current_user: AuthenticatedUser = Depends(require_admin)):
    """Verifies that the caller is an authenticated administrator."""
    return success_response(current_user.model_dump(), "Admin authorization verified")
