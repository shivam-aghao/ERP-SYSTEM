"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL RESULTS & ACADEMIC RECORDS ROUTER
Namespace: /api/v1/results/...
Authoritative Academic Results, Semester Grade Sheets, Marks Publishing,
Locking Governance, Revaluation Lifecycle, and Institutional Reporting
================================================================================
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.auth import AuthenticatedUser, get_optional_user, get_current_user
from backend.rbac.service import RBACService
from backend.rbac.models import Permission
from backend.services.quiz_service import QuizService
from backend.services.academic_records_service import AcademicRecordsService
from backend.schemas.academic_records import (
    MarksEntryRequest, MarksLockRequest, MarksUnlockRequest, MarksVerifyRequest,
    ResultPublishRequest, ResultUnpublishRequest, RevaluationApplyRequest, RevaluationReviewRequest
)
from backend.utils.helpers import success_response, error_response

router = APIRouter(prefix="/results", tags=["Results & Academic Evaluation"])


# =============================================================================
# 1. QUIZ RESULTS EXPORT (PRESERVED)
# =============================================================================
@router.get("/quizzes/{quiz_id}")
def get_quiz_class_results(
    quiz_id: str,
    filter: str = Query("all"),
    db: Session = Depends(get_db)
):
    """GET /api/v1/results/quizzes/{quiz_id} - Class results roster for specified quiz."""
    return QuizService.export_quiz_results(quiz_id, filter, "json", db)


# =============================================================================
# 2. STUDENT RESULTS & SEMESTER GRADE SHEETS
# =============================================================================
@router.get("/student")
def get_student_results(
    student_code: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/results/student
    Retrieves student academic records:
    Semester -> Subjects -> Internal marks -> External marks -> Total -> Grade -> Credits -> SGPA -> CGPA -> Result status
    Zero-trust identity protection enforced.
    """
    from backend.routes.students import resolve_student_code
    sc = resolve_student_code(student_code, current_user)
    data = AcademicRecordsService.get_student_results(sc, semester, current_user, db)
    return success_response(data, "Results fetched successfully")


@router.get("/semester")
def get_semester_results(
    student_code: Optional[str] = Query(None),
    semester: Optional[int] = Query(5),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/results/semester
    Detailed course-by-course marks, credits, and grade points for semester.
    """
    from backend.routes.students import resolve_student_code
    sc = resolve_student_code(student_code, current_user)
    data = AcademicRecordsService.get_student_results(sc, semester, current_user, db)
    return success_response(data)


# =============================================================================
# 3. TEACHER FLOW: MARKS ENTRY, VALIDATION, AND LOCKING
# =============================================================================
@router.get("/marks/roster")
@router.get("/roster")
def get_marks_roster(
    class_id: Optional[str] = Query(None, description="Class name or UUID, e.g. '3R'"),
    class_name: Optional[str] = Query(None, description="Class name alias"),
    subject_id: Optional[str] = Query(None, description="Subject code or UUID, e.g. 'CS502'"),
    subject_code: Optional[str] = Query(None, description="Subject code alias"),
    semester: int = Query(5, ge=1, le=8),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/results/marks/roster (or /roster)
    Returns class roster grading grid with any existing marks and lock status.
    """
    target_class = class_id or class_name
    target_subject = subject_id or subject_code
    if not target_class or not target_subject:
        raise HTTPException(status_code=400, detail="class_id (or class_name) and subject_id (or subject_code) are required")
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if (current_user.role or "").lower() not in ("teacher", "faculty", "hod", "admin", "super_admin", "exam_controller"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Only faculty and administration can view the marks grading roster")
    data = AcademicRecordsService.get_marks_roster(target_class, target_subject, semester, current_user, db)
    return success_response(data)


@router.post("/marks/entry")
def enter_marks(
    payload: MarksEntryRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/marks/entry
    Validates mark ranges, computes authoritative grades/points, updates SGPA/CGPA,
    and saves marks draft/submission.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if (current_user.role or "").lower() not in ("teacher", "faculty", "hod", "admin", "super_admin", "exam_controller"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Students cannot enter or modify marks")
    data = AcademicRecordsService.enter_marks(payload, current_user, db)
    return success_response(data, data.get("message", "Marks entered successfully"))


@router.post("/marks/bulk")
def enter_bulk_marks(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/marks/bulk
    Backward-compatible bulk marks entry endpoint.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if (current_user.role or "").lower() not in ("teacher", "faculty", "hod", "admin", "super_admin", "exam_controller"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Students cannot enter or modify marks")
    try:
        req = MarksEntryRequest.model_validate(payload)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid marks payload: {str(e)}")
    data = AcademicRecordsService.enter_marks(req, current_user, db)
    return success_response(data, "Marks entered successfully")


@router.post("/marks/lock")
@router.post("/lock")
def lock_marks_submission(
    payload: MarksLockRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/marks/lock (or /lock)
    Locks marks submission against further faculty edits.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if (current_user.role or "").lower() not in ("teacher", "faculty", "hod", "admin", "super_admin", "exam_controller"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Only faculty or administrators can lock marks")
    data = AcademicRecordsService.lock_marks(payload, current_user, db)
    return success_response(data, data["message"])


@router.post("/marks/unlock")
@router.post("/unlock")
def unlock_marks_submission(
    payload: MarksUnlockRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/marks/unlock (or /unlock)
    Unlocks marks submission for administrative correction (Admin/HOD only).
    Enforces mandatory audit justification.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if (current_user.role or "").lower() not in ("admin", "super_admin", "hod", "exam_controller"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Only HOD or Exam Cell administrator can unlock marks")
    data = AcademicRecordsService.unlock_marks(payload, current_user, db)
    return success_response(data, data["message"])


@router.post("/marks/verify")
@router.post("/verify")
def verify_marks_submission(
    payload: MarksVerifyRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/marks/verify (or /verify)
    Marks submission verification by Examination Cell authority.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if (current_user.role or "").lower() not in ("admin", "super_admin", "hod", "exam_controller"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Only Exam Cell administrator can verify marks")
    data = AcademicRecordsService.verify_marks(payload, current_user, db)
    return success_response(data, data["message"])


# =============================================================================
# 4. ADMIN FLOW: PUBLISHING, REVALUATION & REPORTS
# =============================================================================
@router.post("/publish")
def publish_results(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/publish
    Authoritative publishing of academic semester/assessment marks.
    Enforces 'marks.publish' permission or Admin/HOD role.
    """
    if current_user and not RBACService.has_permission(current_user, Permission.MARKS_PUBLISH.value) and (current_user.role or "").lower() not in ("admin", "super_admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to publish academic results."
        )

    res = AcademicRecordsService.publish_results(
        class_name=payload.get("class_name"),
        semester=payload.get("semester"),
        student_code=payload.get("student_code"),
        reason=payload.get("reason", "Regular end-semester result publication"),
        current_user=current_user,
        db=db
    )
    return success_response(res, "Academic results published successfully")


@router.post("/unpublish")
def unpublish_results(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/unpublish
    Unpublishes / withholds academic results for revision or administrative hold.
    Enforces 'marks.publish' permission or Admin/HOD role.
    """
    if current_user and not RBACService.has_permission(current_user, Permission.MARKS_PUBLISH.value) and (current_user.role or "").lower() not in ("admin", "super_admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to unpublish academic results."
        )

    res = AcademicRecordsService.unpublish_results(
        class_name=payload.get("class_name"),
        semester=payload.get("semester"),
        student_code=payload.get("student_code"),
        reason=payload.get("reason", "Administrative hold / mark revision"),
        current_user=current_user,
        db=db
    )
    return success_response(res, "Academic results unpublished successfully")


@router.post("/revaluation/apply")
def apply_revaluation(
    payload: RevaluationApplyRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/revaluation/apply
    Student applies for formal course revaluation.
    """
    data = AcademicRecordsService.apply_revaluation(payload, current_user, db)
    return success_response(data, data["message"], code=201)


@router.get("/revaluation")
def get_revaluation_requests(
    semester: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/results/revaluation
    Lists revaluation applications.
    Students view their own; Admin/Faculty view all.
    """
    data = AcademicRecordsService.get_revaluation_requests(semester, status, student_code, current_user, db)
    return success_response(data)


@router.post("/revaluation/review")
def review_revaluation(
    payload: RevaluationReviewRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/results/revaluation/review
    Examination board reviews revaluation.
    If APPROVED: updates marks, recalculates SGPA/CGPA, and logs change history.
    """
    data = AcademicRecordsService.review_revaluation(payload, current_user, db)
    return success_response(data, data["message"])


# =============================================================================
# 5. INSTITUTIONAL REPORTS & EXPORTS
# =============================================================================
@router.get("/reports/class")
def get_class_performance_report(
    class_name: str = Query("3R"),
    semester: int = Query(5),
    db: Session = Depends(get_db)
):
    """GET /api/v1/results/reports/class - Class-wise performance analytics."""
    data = AcademicRecordsService.get_class_performance_report(class_name, semester, db)
    return success_response(data)


@router.get("/reports/subject")
def get_subject_performance_report(
    subject_code: str = Query("CS501"),
    semester: int = Query(5),
    db: Session = Depends(get_db)
):
    """GET /api/v1/results/reports/subject - Course pass rate and mark statistics."""
    data = AcademicRecordsService.get_subject_performance_report(subject_code, semester, db)
    return success_response(data)


@router.get("/reports/backlogs")
def get_backlog_report(
    class_name: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """GET /api/v1/results/reports/backlogs - Comprehensive institutional backlog report."""
    data = AcademicRecordsService.get_backlog_report(class_name, semester, db)
    return success_response(data)


@router.get("/export")
def export_results_gazette(
    class_name: str = Query("3R"),
    semester: int = Query(5),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/results/export
    Exports class results gazette in CSV format with UTF-8 BOM.
    """
    csv_content = AcademicRecordsService.export_results_csv(class_name, semester, db)
    filename = f"Result_Gazette_{class_name}_Sem{semester}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/csv; charset=utf-8"
        }
    )
