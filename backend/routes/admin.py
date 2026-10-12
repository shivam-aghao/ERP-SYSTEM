"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL ADMIN ROUTER
Namespace: /api/v1/admin/...
Authoritative Administrative Dashboard, Institutional Analytics & Oversight
================================================================================
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.config.database import get_db
from backend.auth import AuthenticatedUser, get_optional_user, require_admin, require_hod
from backend.services.admin_service import AdminService
from backend.services.management_service import ManagementService
from backend.rbac.service import RBACService
from backend.rbac.models import Permission
from backend.utils.helpers import success_response, error_response

router = APIRouter(prefix="/admin", tags=["Admin Management"])


@router.get("/dashboard")
def get_admin_dashboard(
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    GET /api/v1/admin/dashboard
    Comprehensive administrative dashboard overview with institutional KPIs.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    role = (current_user.role or "").lower()
    if role not in ("admin", "super_admin") and not RBACService.has_any_permission(current_user, [
        Permission.SYSTEM_MANAGE.value,
        Permission.RBAC_MANAGE.value
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative privileges required."
        )
    data = ManagementService.get_admin_dashboard()
    return success_response(data)


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    GET /api/v1/admin/stats
    System-wide summary metrics for institutional monitoring.
    """
    data = AdminService.get_system_stats(db)
    return success_response(data)


@router.get("/audit/logs")
def get_admin_audit_logs(
    limit: int = Query(50, ge=1, le=500),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    GET /api/v1/admin/audit/logs
    System-wide security and operations audit trail logs.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    role = (current_user.role or "").lower()
    if role not in ("admin", "super_admin") and not RBACService.has_permission(current_user, Permission.SYSTEM_MANAGE.value):
        raise HTTPException(status_code=403, detail="Forbidden: Audit logs access denied.")
    logs = ManagementService.get_audit_logs(limit)
    return success_response(logs)


@router.get("/leave/requests")
def get_all_leave_requests(
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    GET /api/v1/admin/leave/requests
    Institutional leave applications roster across all departments.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    if (current_user.role or "").lower() not in ("admin", "super_admin", "hod"):
        raise HTTPException(status_code=403, detail="Forbidden: Leave management requires HOD or Admin role.")
    requests = ManagementService.get_leave_requests()
    return success_response(requests)


@router.post("/leave/review")
def review_leave_application(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    POST /api/v1/admin/leave/review
    Administrative approval or rejection of faculty leave application.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    if not RBACService.has_permission(current_user, Permission.LEAVE_APPROVE.value) and (current_user.role or "").lower() not in ("admin", "super_admin", "hod"):
        raise HTTPException(status_code=403, detail="Forbidden: Leave review requires appropriate administrative permission.")
    
    leave_id = payload.get("leave_id", "")
    action = payload.get("action", "")
    comments = payload.get("comments") or payload.get("reviewer_remarks", "")
    rev_ident = (current_user.identifier or current_user.user_id) if current_user else "HOD-CSE"

    res = ManagementService.review_leave(
        leave_id=leave_id,
        action=action,
        reviewer_identifier=rev_ident,
        comments=comments
    )
    return success_response(res, "Leave application reviewed successfully")


@router.get("/rbac/matrix")
def get_rbac_matrix(
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    GET /api/v1/admin/rbac/matrix
    Retrieves authoritative Role-Based Access Control matrix.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    role = (current_user.role or "").lower()
    if role not in ("admin", "super_admin") and not RBACService.has_permission(current_user, Permission.RBAC_MANAGE.value):
        raise HTTPException(status_code=403, detail="Forbidden: RBAC configuration requires administrative role.")
    matrix = ManagementService.get_rbac_matrix()
    return success_response(matrix)


@router.post("/rbac/assign")
def assign_rbac_role(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    POST /api/v1/admin/rbac/assign
    Assigns role to user with audit logging.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    role = (current_user.role or "").lower()
    if role not in ("admin", "super_admin") and not RBACService.has_permission(current_user, Permission.RBAC_MANAGE.value):
        raise HTTPException(status_code=403, detail="Forbidden: Role assignment requires administrative permission.")

    res = ManagementService.assign_rbac_role(
        user_id=payload.get("user_id", ""),
        role=payload.get("role") or payload.get("role_name", ""),
        department_id=payload.get("department_id"),
        assigned_by=current_user.user_id if current_user else None
    )
    return success_response(res, "Role assigned successfully")


@router.get("/reports/classes")
def get_classes_report(
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """GET /api/v1/admin/reports/classes - Class-level academic and attendance reports."""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    role = (current_user.role or "").lower()
    if role not in ("admin", "super_admin", "hod", "teacher", "faculty"):
        raise HTTPException(status_code=403, detail="Forbidden: Reports require staff or administrative role.")
    report = ManagementService.get_classes_report()
    return success_response(report)


@router.get("/reports/faculty")
def get_faculty_report(
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """GET /api/v1/admin/reports/faculty - Faculty workload and attendance logging performance."""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    role = (current_user.role or "").lower()
    if role not in ("admin", "super_admin", "hod"):
        raise HTTPException(status_code=403, detail="Forbidden: Faculty reports require administrative or HOD role.")
    report = ManagementService.get_faculty_report()
    return success_response(report)
