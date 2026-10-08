"""
SSGMCE College ERP — FastAPI Authentication & Role Authorization Dependencies
Enforces cryptographic JWT token verification and server-side RBAC role gating.
NEVER trusts client-provided query parameters or browser storage.
"""

import logging
from typing import List, Optional, Callable
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.auth.jwt_handler import decode_token, TokenExpiredException, TokenInvalidException
from backend.auth.service import AuthenticationService, REVOKED_TOKENS
from backend.auth.models import AuthenticatedUser

logger = logging.getLogger("ssgmce_erp_backend.auth_deps")

# OAuth2 bearer scheme configured with canonical login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_token_from_request(
    request: Request,
    authorization: Optional[str] = Header(None),
    token_bearer: Optional[str] = Depends(oauth2_scheme)
) -> Optional[str]:
    """
    Extracts Bearer token from Authorization header or cookie.
    """
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    if token_bearer:
        return token_bearer.strip()
    # Check for session cookie fallback
    if request and "ssgmce_access_token" in request.cookies:
        return request.cookies.get("ssgmce_access_token")
    return None


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db)
) -> AuthenticatedUser:
    """
    Authenticates and validates the current user identity.
    Validates token cryptographically on the server.
    Authoritatively looks up user and role from PostgreSQL.
    Raises 401 if token is missing, expired, revoked, or invalid.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if token in REVOKED_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been terminated. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        payload = decode_token(token, verify_exp=True)
    except TokenExpiredException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please refresh or log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        ) from e
    except TokenInvalidException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        ) from e

    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing user identity."
        )

    user = AuthenticationService.get_user_by_id(str(user_id), db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identity could not be verified in the database."
        )

    return user


def get_optional_user(
    request: Request,
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db)
) -> Optional[AuthenticatedUser]:
    """Returns authenticated user if valid token present, otherwise None."""
    if not token:
        return None
    try:
        return get_current_user(request=request, token=token, db=db)
    except HTTPException:
        return None


def require_role(allowed_roles: List[str]) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """
    Dependency factory enforcing strict role-based access control.
    NEVER relies on client-supplied role values.
    """
    allowed_normalized = [r.lower() for r in allowed_roles]

    def role_verifier(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        user_role = current_user.role.lower()
        if user_role not in allowed_normalized:
            # Super admin always has access
            if user_role == "super_admin":
                return current_user
            logger.warning(
                "Access denied: User '%s' (role: %s) attempted access to role-protected resource (allowed: %s)",
                current_user.identifier, user_role, allowed_roles
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user_role}' is not authorized to access this resource."
            )
        return current_user

    return role_verifier


# Common convenience dependencies
require_student = require_role(["student"])
require_teacher = require_role(["teacher", "hod", "admin", "super_admin"])
require_hod = require_role(["hod", "admin", "super_admin"])
require_accountant = require_role(["accountant", "admin", "super_admin"])
require_admin = require_role(["admin", "super_admin"])

