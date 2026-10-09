"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL AUTHENTICATION ROUTER
Namespace: /api/v1/auth/...
Authoritative Supabase JWT Authentication & Server-Side Identity Verification
================================================================================
"""

from typing import Optional
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.auth import (
    AuthenticationService,
    AuthenticatedUser,
    LoginPayload,
    RefreshTokenRequest,
    get_current_user,
    require_student,
    require_teacher,
    require_admin,
    require_hod,
    require_accountant
)
from backend.auth.dependencies import get_token_from_request
from backend.utils.helpers import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    """
    Canonical Login Endpoint:
    POST /api/v1/auth/login
    Validates credentials against Supabase Auth / PostgreSQL and issues signed JWT access & refresh tokens.
    """
    result = AuthenticationService.authenticate(payload, db)
    resp = success_response(result.model_dump(), "Authenticated successfully")
    # Top-level keys preserved for backward-compatibility with UI scripts
    resp["token"] = result.access_token
    resp["access_token"] = result.access_token
    resp["refresh_token"] = result.refresh_token
    resp["user"] = result.user
    resp["role"] = result.role
    resp["redirect"] = result.redirect
    return resp


@router.post("/refresh")
def refresh_session(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Canonical Token Refresh Endpoint:
    POST /api/v1/auth/refresh
    Refreshes an expired access token using a valid signed refresh token.
    """
    result = AuthenticationService.refresh_access_token(payload.refresh_token, db)
    return success_response(result, "Session refreshed successfully")


@router.post("/logout")
def logout(
    request: Request,
    token: Optional[str] = Depends(get_token_from_request)
):
    """
    Canonical Logout Endpoint:
    POST /api/v1/auth/logout
    Revokes the active JWT access token on the server and terminates the session.
    """
    if token:
        AuthenticationService.revoke_token(token)
    return success_response({"logged_out": True}, "Session terminated successfully")


@router.get("/me")
def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Canonical Identity Verification Endpoint:
    GET /api/v1/auth/me
    Validates active Bearer JWT and returns server-verified user identity, role, and permissions.
    """
    return success_response(current_user.model_dump(), "User identity verified")


@router.get("/verify/student")
def verify_student_access(current_user: AuthenticatedUser = Depends(require_student)):
    """GET /api/v1/auth/verify/student - Verifies that the caller is an authenticated student."""
    return success_response(current_user.model_dump(), "Student authorization verified")


@router.get("/verify/teacher")
def verify_teacher_access(current_user: AuthenticatedUser = Depends(require_teacher)):
    """GET /api/v1/auth/verify/teacher - Verifies that the caller is an authenticated teacher/faculty."""
    return success_response(current_user.model_dump(), "Teacher authorization verified")


@router.get("/verify/hod")
def verify_hod_access(current_user: AuthenticatedUser = Depends(require_hod)):
    """GET /api/v1/auth/verify/hod - Verifies that the caller is an authenticated Head of Department."""
    return success_response(current_user.model_dump(), "HOD authorization verified")


@router.get("/verify/accountant")
def verify_accountant_access(current_user: AuthenticatedUser = Depends(require_accountant)):
    """GET /api/v1/auth/verify/accountant - Verifies that the caller is an authenticated accountant."""
    return success_response(current_user.model_dump(), "Accountant authorization verified")


@router.get("/verify/admin")
def verify_admin_access(current_user: AuthenticatedUser = Depends(require_admin)):
    """GET /api/v1/auth/verify/admin - Verifies that the caller is an authenticated administrator."""
    return success_response(current_user.model_dump(), "Admin authorization verified")
