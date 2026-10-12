"""
SSGMCE College ERP — Centralized Authentication Module
"""

from backend.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
    TokenSecurityException,
    TokenExpiredException,
    TokenInvalidException
)
from backend.auth.models import (
    AuthenticatedUser,
    TokenResponse,
    RefreshTokenRequest,
    LoginPayload
)
from backend.auth.service import AuthenticationService
from backend.auth.dependencies import (
    get_current_user,
    get_optional_user,
    require_role,
    require_student,
    require_teacher,
    require_hod,
    require_accountant,
    require_admin
)

__all__ = [
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "TokenSecurityException",
    "TokenExpiredException",
    "TokenInvalidException",
    "AuthenticatedUser",
    "TokenResponse",
    "RefreshTokenRequest",
    "LoginPayload",
    "AuthenticationService",
    "get_current_user",
    "get_optional_user",
    "require_role",
    "require_student",
    "require_teacher",
    "require_hod",
    "require_accountant",
    "require_admin"
]

