"""
================================================================================
SSGMCE COLLEGE ERP — STEP 8: TEACHER & ADMIN MANAGEMENT API ROUTES
FastAPI Endpoints for Teacher Tools, Admin Dashboard, RBAC & Workflows
================================================================================
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, Body, HTTPException, Request
from backend.services.management_service import ManagementService
from backend.utils.helpers import success_response, error_response

router = APIRouter(prefix="/management", tags=["Teacher & Admin Management"])


def extract_actor_id(request: Request, user_id: Optional[str] = None, emp_code: Optional[str] = None) -> str:
    """Extracts actor identifier from query, header, or bearer token."""
    if user_id:
        return user_id.strip()
    if emp_code:
        return emp_code.strip()
    if request:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.startswith("Bearer "):
            token = auth_hdr.split(" ", 1)[1].strip()
            if token.startswith("teach_token_"):
                return token.replace("teach_token_", "").strip()
        if request.headers.get("x-teacher-id"):
            return request.headers.get("x-teacher-id").strip()
        if request.headers.get("x-emp-code"):
            return request.headers.get("x-emp-code").strip()
    return "EMP-CSE-1001"


# -----------------------------------------------------------------------------
# 1. TEACHER MANAGEMENT TOOLS
# -----------------------------------------------------------------------------

@router.get("/teacher/dashboard")
def get_teacher_dashboard(
    request: Request,
    teacher_id: Optional[str] = Query(None),
    emp_code: Optional[str] = Query(None)
):
    """Retrieves consolidated dashboard for the teacher."""
    identifier = extract_actor_id(request, teacher_id, emp_code)
    data = ManagementService.get_teacher_dashboard(identifier)
    return success_response(data, "Teacher dashboard loaded successfully")


@router.get("/teacher/classes")
def get_teacher_classes(
    request: Request,
    teacher_id: Optional[str] = Query(None),
    emp_code: Optional[str] = Query(None)
):
    """Retrieves classes assigned to the authenticated teacher."""
    identifier = extract_actor_id(request, teacher_id, emp_code)
    classes = ManagementService.get_teacher_classes(identifier)
    return success_response(classes, "Assigned classes retrieved successfully")


@router.get("/teacher/subjects")
def get_teacher_subjects(
    request: Request,
    teacher_id: Optional[str] = Query(None),
    emp_code: Optional[str] = Query(None)
):
    """Retrieves subjects assigned to the authenticated teacher."""
    identifier = extract_actor_id(request, teacher_id, emp_code)
    subjects = ManagementService.get_teacher_subjects(identifier)
    return success_response(subjects, "Assigned subjects retrieved successfully")


@router.get("/teacher/students")
def get_teacher_students(
    request: Request,
    class_id: Optional[str] = Query(None),
    teacher_id: Optional[str] = Query(None),
    emp_code: Optional[str] = Query(None)
):
    """
    Retrieves student roster strictly for teacher's assigned classes.
    Unauthorized classes return an error.
    """
    identifier = extract_actor_id(request, teacher_id, emp_code)
    students = ManagementService.get_teacher_students(identifier, class_id)
    if students and isinstance(students[0], dict) and "error" in students[0]:
        return error_response(students[0]["error"], 403)
    return success_response(students, "Assigned students roster retrieved successfully")


@router.get("/teacher/workload")
def get_teacher_workload(
    request: Request,
    teacher_id: Optional[str] = Query(None),
    emp_code: Optional[str] = Query(None)
):
    """Retrieves teaching workload hours per week."""
    identifier = extract_actor_id(request, teacher_id, emp_code)
    workload = ManagementService.get_teacher_workload(identifier)
    return success_response(workload, "Teacher workload retrieved successfully")


@router.post("/teacher/attendance/submit")
def submit_attendance_for_approval(
    request: Request,
    payload: Dict[str, Any] = Body(...)
):
    """Submits attendance session for approval (draft -> submitted)."""
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    identifier = extract_actor_id(request, payload.get("teacher_id"), payload.get("emp_code"))
    res = ManagementService.submit_attendance_for_approval(session_id, identifier)
    return success_response(res, "Attendance session submitted for approval")


@router.post("/teacher/marks/bulk")
def bulk_enter_marks(
    request: Request,
    payload: Dict[str, Any] = Body(...)
):
    """
    Enters student marks in bulk with verification of teacher subject assignment,
    student enrollment, and valid marks boundaries.
    """
    class_id = payload.get("class_id")
    subject_id = payload.get("subject_id")
    semester = int(payload.get("semester", 5))
    marks_list = payload.get("marks", [])
    identifier = extract_actor_id(request, payload.get("teacher_id"), payload.get("emp_code"))

    if not class_id or not subject_id or not marks_list:
        raise HTTPException(status_code=400, detail="class_id, subject_id, and marks are required")

    res = ManagementService.bulk_enter_marks(identifier, class_id, subject_id, semester, marks_list)
    if not res.get("success"):
        return error_response(res.get("message", "Marks entry failed"), 403)
    return success_response(res, "Bulk marks entered successfully")


@router.post("/teacher/leave/apply")
def apply_faculty_leave(
    request: Request,
    payload: Dict[str, Any] = Body(...)
):
    """Applies for faculty leave."""
    identifier = extract_actor_id(request, payload.get("teacher_id"), payload.get("emp_code"))
    res = ManagementService.apply_faculty_leave(
        teacher_identifier=identifier,
        leave_type=payload.get("leave_type", "casual"),
        start_date=payload.get("start_date"),
        end_date=payload.get("end_date"),
        total_days=float(payload.get("total_days", 1.0)),
        reason=payload.get("reason", "Personal")
    )
    return success_response(res, "Leave application submitted successfully")


@router.get("/teacher/leaves")
def get_teacher_leaves(
    request: Request,
    teacher_id: Optional[str] = Query(None),
    emp_code: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Lists leaves for the teacher."""
    identifier = extract_actor_id(request, teacher_id, emp_code)
    leaves = ManagementService.get_faculty_leaves(identifier, status)
    return success_response(leaves, "Faculty leaves retrieved")


@router.get("/teacher/documents")
def get_teacher_documents(
    request: Request,
    teacher_id: Optional[str] = Query(None),
    emp_code: Optional[str] = Query(None)
):
    """Retrieves verified faculty documents."""
    identifier = extract_actor_id(request, teacher_id, emp_code)
    docs = ManagementService.get_faculty_documents(identifier)
    return success_response(docs, "Faculty documents retrieved")


# -----------------------------------------------------------------------------
# 2. ADMIN & HOD MANAGEMENT TOOLS
# -----------------------------------------------------------------------------

@router.get("/admin/dashboard")
def get_admin_dashboard():
    """Aggregates system-wide live KPIs and queues."""
    dash = ManagementService.get_admin_dashboard()
    return success_response(dash, "Admin dashboard loaded successfully")


@router.post("/attendance/approve")
def approve_attendance(payload: Dict[str, Any] = Body(...)):
    """Approves and locks attendance session (HOD/Admin only)."""
    session_id = payload.get("session_id")
    approved_by = payload.get("approved_by")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    res = ManagementService.approve_attendance(session_id, approved_by)
    return success_response(res, "Attendance session approved and locked")


@router.post("/attendance/unlock")
def unlock_attendance(payload: Dict[str, Any] = Body(...)):
    """Unlocks attendance session with reason (HOD/Admin only)."""
    session_id = payload.get("session_id")
    unlocked_by = payload.get("unlocked_by")
    reason = payload.get("reason", "Administrative correction requested")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    res = ManagementService.unlock_attendance_session(session_id, unlocked_by, reason)
    return success_response(res, "Attendance session unlocked for editing")


@router.get("/leave/requests")
def get_all_leave_requests(status: Optional[str] = Query(None)):
    """Lists all faculty leave applications (Admin/HOD)."""
    leaves = ManagementService.get_faculty_leaves(teacher_identifier=None, status=status)
    return success_response(leaves, "Faculty leave requests retrieved")


@router.post("/leave/review")
def review_faculty_leave(payload: Dict[str, Any] = Body(...)):
    """Approves or rejects faculty leave application (HOD/Admin)."""
    leave_id = payload.get("leave_id")
    reviewer = payload.get("reviewed_by")
    status = payload.get("status", "approved")
    remarks = payload.get("remarks")
    if not leave_id:
        raise HTTPException(status_code=400, detail="leave_id is required")
    res = ManagementService.review_faculty_leave(leave_id, reviewer, status, remarks)
    return success_response(res, f"Leave request {status} successfully")


@router.get("/reports/faculty")
def get_faculty_report():
    """Generates faculty workload and assignments report."""
    rep = ManagementService.generate_faculty_report()
    return success_response(rep, "Faculty report generated")


@router.get("/reports/classes")
def get_class_report(class_id: Optional[str] = Query(None)):
    """Generates class performance and attendance summary report."""
    rep = ManagementService.generate_class_report(class_id)
    return success_response(rep, "Class report generated")


@router.get("/rbac/matrix")
def get_rbac_matrix():
    """Retrieves RBAC roles, permissions, and mappings."""
    matrix = ManagementService.get_rbac_matrix()
    return success_response(matrix, "RBAC matrix retrieved")


@router.post("/rbac/assign")
def assign_user_role(payload: Dict[str, Any] = Body(...)):
    """Assigns an authorized role to a user."""
    user_id = payload.get("user_id")
    role_name = payload.get("role_name")
    assigned_by = payload.get("assigned_by")
    if not user_id or not role_name:
        raise HTTPException(status_code=400, detail="user_id and role_name are required")
    res = ManagementService.assign_user_role(user_id, role_name, assigned_by)
    return success_response(res, "Role assigned successfully")


@router.get("/audit/logs")
def get_audit_logs(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    """Retrieves immutable system audit logs."""
    logs = ManagementService.get_audit_logs(limit, offset)
    return success_response(logs, "Audit logs retrieved successfully")

