"""
SSGMCE College ERP — Legacy AuthService Adapter
Delegates directly to the centralized backend.auth.AuthenticationService.
"""

from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.auth import AuthenticationService, LoginPayload


class AuthService:
    """Backwards-compatible adapter for legacy callers."""

    @staticmethod
    def authenticate_user(payload: Any, db: Session) -> Dict[str, Any]:
        login_payload = LoginPayload(
            user_id=getattr(payload, "user_id", None) or getattr(payload, "username", None),
            username=getattr(payload, "username", None) or getattr(payload, "user_id", None),
            roll_number=getattr(payload, "roll_number", None),
            email=getattr(payload, "email", None),
            password=getattr(payload, "password", ""),
            role=getattr(payload, "role", None)
        )
        token_resp = AuthenticationService.authenticate(login_payload, db)
        return {
            "token": token_resp.access_token,
            "access_token": token_resp.access_token,
            "refresh_token": token_resp.refresh_token,
            "user": token_resp.user,
            "role": token_resp.role,
            "redirect": token_resp.redirect
        }
