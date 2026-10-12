"""
SSGMCE College ERP — FastAPI RBAC Route Dependencies
backend/rbac/dependencies.py

Enforces backend-level permission and role gating.
Frontend checks are UI-only; security is strictly enforced here on the server.
"""

import logging
from typing import List, Callable, Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user, get_optional_user
from backend.auth.models import AuthenticatedUser
from backend.rbac.models import Permission, RoleName, normalize_permission
from backend.rbac.service import RBACService
from backend.config.database import get_db

logger = logging.getLogger("ssgmce_erp_backend.rbac_deps")


def require_permission(required_permission: str) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """
    FastAPI route dependency requiring an explicit permission.
    Rejects unauthorized requests with 403 Forbidden.
    """
    norm_permission = normalize_permission(required_permission)

    def permission_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not RBACService.has_permission(current_user, norm_permission):
            logger.warning(
                "Access denied: User '%s' (role: %s) lacks required permission '%s'",
                current_user.identifier, current_user.role, norm_permission
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: You do not possess the required permission '{norm_permission}' to perform this action."
            )
        return current_user

    return permission_checker


def require_any_permission(permissions: List[str]) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """
    FastAPI route dependency requiring AT LEAST ONE of the specified permissions.
    """
    normalized = [normalize_permission(p) for p in permissions]

    def permission_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not RBACService.has_any_permission(current_user, normalized):
            logger.warning(
                "Access denied: User '%s' lacks any of required permissions: %s",
                current_user.identifier, normalized
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Missing required permissions. Required one of: {normalized}"
            )
        return current_user

    return permission_checker


def require_all_permissions(permissions: List[str]) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """
    FastAPI route dependency requiring ALL of the specified permissions.
    """
    normalized = [normalize_permission(p) for p in permissions]

    def permission_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not RBACService.has_all_permissions(current_user, normalized):
            logger.warning(
                "Access denied: User '%s' lacks all required permissions: %s",
                current_user.identifier, normalized
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Missing required permissions. Required all of: {normalized}"
            )
        return current_user

    return permission_checker


def require_role(allowed_roles: List[str]) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """
    FastAPI route dependency enforcing role membership.
    """
    norm_roles = [r.strip().lower() for r in allowed_roles]

    def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        user_role = (current_user.role or "").strip().lower()
        if user_role == RoleName.SUPER_ADMIN.value:
            return current_user

        if user_role not in norm_roles:
            logger.warning(
                "Role violation: User '%s' (role: %s) attempted access to role-protected endpoint (allowed: %s)",
                current_user.identifier, user_role, norm_roles
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Role '{user_role}' is not authorized to access this resource."
            )
        return current_user

    return role_checker

