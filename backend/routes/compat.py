"""
================================================================================
SSGMCE COLLEGE ERP — DOCUMENTED BACKWARD COMPATIBILITY LAYER
================================================================================
Documented Compatibility Requirement:
Translates deprecated route paths (e.g. /api/v1/student/..., /api/v1/teacher/...,
/api/v1/management/..., /api/v1/academic/...) directly into canonical route
handler invocations.

NO duplicate business logic: Every route function delegates immediately to the
canonical module handler.
================================================================================
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Request, Response
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.auth import AuthenticatedUser, get_optional_user
from backend.schemas.student import StudentProfileUpdate
from backend.schemas.attendance import AttendanceDraftRequest, AttendanceSubmitRequest
from backend.schemas.quiz import QuizSubmitRequest, QuizCreateSchema, QuestionBankCreate, SecurityEventRequest
from backend.routes.master import get_classes

# Import canonical handlers
from backend.routes.students import (
    get_all_students, get_student_profile, update_student_profile, get_student_overview,
    get_student_academic_dashboard, get_student_academic_history,
    get_student_records, get_student_elearning, get_student_examination,
    get_change_info_requests, submit_change_info_request
)
from backend.routes.teachers import (
    get_teacher_profile, update_teacher_profile, get_teacher_dashboard,
    get_teacher_classes, get_teacher_subjects, get_teacher_students,
    get_teacher_workload, get_teacher_leaves, apply_teacher_leave, get_teacher_documents
)
from backend.routes.admin import (
    get_admin_dashboard, get_admin_stats, get_admin_audit_logs,
    get_all_leave_requests, review_leave_application, get_rbac_matrix,
    assign_rbac_role, get_classes_report, get_faculty_report
)
from backend.routes.attendance import (
    submit_attendance, get_attendance_records, get_recent_attendance,
    get_attendance_sessions, get_attendance_class_roster, check_duplicate_attendance,
    get_attendance_draft, save_attendance_draft, export_attendance_csv,
    approve_attendance, unlock_attendance, get_student_attendance_summary
)
from backend.routes.timetable import (
    get_timetable_grid, get_my_timetable, get_teacher_timetable_by_id,
    get_scheduled_tests, schedule_test, update_scheduled_test, delete_scheduled_test
)
from backend.routes.quizzes import (
    get_all_quizzes, create_quiz, get_quiz_details, delete_quiz,
    publish_quiz, close_quiz, start_quiz_attempt, get_quiz_questions,
    add_question_to_quiz, remove_question_from_quiz, get_quiz_analytics,
    get_quiz_leaderboard, export_quiz_results, toggle_release_results
)
from backend.routes.attempts import (
    get_attempt_status, save_attempt_answers, submit_quiz_attempt, get_attempt_result, record_security_event
)
from backend.routes.results import (
    get_quiz_class_results, get_student_results, get_semester_results,
    publish_results, unpublish_results, enter_bulk_marks
)
from backend.routes.fees import (
    get_fee_summary, pay_student_fee, get_fee_transactions, export_fee_ledger, update_fee_invoice
)
from backend.routes.documents import (
    get_documents, upload_document, get_student_certificates, verify_certificate
)

router = APIRouter(tags=["Documented Compatibility Layer"])


# -----------------------------------------------------------------------------
# 1. DEPRECATED /student/... -> CANONICAL /students/...
# -----------------------------------------------------------------------------
@router.get("/student/profile")
def compat_student_profile(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/students/profile"""
    return get_student_profile(student_code, current_user, db)

@router.put("/student/profile")
def compat_put_student_profile(payload: StudentProfileUpdate, student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: PUT /api/v1/students/profile"""
    return update_student_profile(payload, student_code, current_user, db)

@router.get("/student/overview")
def compat_student_overview(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/students/overview"""
    return get_student_overview(student_code, current_user, db)

@router.get("/student/academic-dashboard")
def compat_student_academic_dashboard(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/students/academic-dashboard"""
    return get_student_academic_dashboard(student_code, current_user)

@router.get("/student/academic-history")
def compat_student_academic_history(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/students/academic-history"""
    return get_student_academic_history(student_code, current_user)

@router.get("/student/records")
def compat_student_records(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/students/records"""
    return get_student_records(student_code, current_user, db)

@router.get("/student/attendance")
def compat_student_attendance(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/attendance/student"""
    return get_student_attendance_summary(student_code, current_user, db)

@router.get("/student/timetable")
def compat_student_timetable(day: Optional[str] = None, db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/timetable"""
    return get_timetable_grid(day, db)

@router.get("/student/timetable/tests")
def compat_student_timetable_tests(class_code: Optional[str] = Query("2R1"), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/timetable/tests"""
    return get_scheduled_tests(class_code, None, db)

@router.get("/student/quizzes")
def compat_student_quizzes(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes"""
    return get_all_quizzes(None, student_code, current_user, db)

@router.get("/student/quizzes/{quiz_id}")
def compat_student_quiz_detail(quiz_id: str, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes/{quiz_id}"""
    return get_quiz_details(quiz_id, current_user, db)

@router.post("/student/quizzes/{quiz_id}/start")
def compat_student_quiz_start(quiz_id: str, payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/quizzes/{quiz_id}/start"""
    return start_quiz_attempt(quiz_id, payload, current_user, db)

@router.put("/student/attempts/{attempt_id}/answers")
def compat_student_attempt_answers(attempt_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Deprecated. Canonical: PUT /api/v1/attempts/{attempt_id}/answers"""
    return save_attempt_answers(attempt_id, payload, db)

@router.post("/student/attempts/{attempt_id}/submit")
def compat_student_attempt_submit(attempt_id: str, payload: QuizSubmitRequest, db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/attempts/{attempt_id}/submit"""
    return submit_quiz_attempt(attempt_id, payload, db)

@router.get("/student/attempts/{attempt_id}/result")
def compat_student_attempt_result(attempt_id: str, db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/attempts/{attempt_id}/result"""
    return get_attempt_result(attempt_id, db)

@router.get("/student/fees")
def compat_student_fees(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/fees"""
    return get_fee_summary(student_code, current_user, db)

@router.post("/student/fees/pay")
def compat_student_fees_pay(payload: Dict[str, Any] = Body(...), student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/fees/pay"""
    from backend.schemas.fees import FeePaymentRequest
    req = FeePaymentRequest(**payload)
    return pay_student_fee(req, student_code, current_user, db)

@router.get("/student/fees/export")
def compat_student_fees_export(class_name: Optional[str] = None, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/fees/export"""
    return export_fee_ledger(class_name, current_user)

@router.put("/student/fees/invoice/{invoice_id}")
def compat_student_fee_invoice(invoice_id: str, payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: PUT /api/v1/fees/invoice/{invoice_id}"""
    return update_fee_invoice(invoice_id, payload, current_user)

@router.get("/student/fee-transactions")
def compat_student_fee_transactions(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/fees/transactions"""
    return get_fee_transactions(student_code, current_user, db)

@router.get("/student/documents")
def compat_student_documents(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/documents"""
    return get_documents(student_code, current_user, db)

@router.post("/student/documents/upload")
async def compat_student_doc_upload(payload: Dict[str, Any] = Body(...), student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/documents/upload"""
    return await upload_document(payload=payload, student_code=student_code, current_user=current_user, db=db)

@router.post("/student/dwallet/upload")
async def compat_student_dwallet_upload(payload: Dict[str, Any] = Body(...), student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/documents/upload"""
    return await upload_document(payload=payload, student_code=student_code, current_user=current_user, db=db)

@router.get("/student/certificates")
def compat_student_certificates(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/documents/certificates"""
    return get_student_certificates(student_code, current_user)

@router.get("/certificates/verify/{verification_code}")
def compat_verify_certificate(verification_code: str):
    """Deprecated. Canonical: GET /api/v1/documents/certificates/verify/{verification_code}"""
    return verify_certificate(verification_code)

@router.get("/student/semester-results")
def compat_student_semester_results(student_code: Optional[str] = Query(None), semester: Optional[int] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/results/semester"""
    return get_semester_results(student_code, semester, current_user, db)

@router.get("/student/results")
def compat_student_results(student_code: Optional[str] = Query(None), semester: Optional[int] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/results/student"""
    return get_student_results(student_code, semester, current_user, db)

@router.get("/student/elearning")
def compat_student_elearning(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/students/elearning"""
    return get_student_elearning(student_code, current_user)

@router.get("/student/examination")
def compat_student_examination(student_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/students/examination"""
    return get_student_examination(student_code, current_user)


# -----------------------------------------------------------------------------
# 2. DEPRECATED /teacher/... -> CANONICAL /teachers/... & /attendance/...
# -----------------------------------------------------------------------------
@router.get("/teacher/profile")
def compat_teacher_profile(request: Request, emp_code: Optional[str] = Query(None), empCode: Optional[str] = Query(None, alias="empCode"), teacher_id: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/teachers/profile"""
    return get_teacher_profile(request, emp_code, empCode, teacher_id, current_user, db)

@router.get("/teacher/class-roster")
def compat_teacher_class_roster(classId: Optional[str] = Query(None), class_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/attendance/roster"""
    return get_attendance_class_roster(classId, class_id, db)

@router.post("/teacher/attendance/bulk")
def compat_teacher_attendance_bulk(payload: AttendanceSubmitRequest, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/attendance/submit"""
    return submit_attendance(payload, current_user, db)

@router.get("/teacher/attendance/sessions")
def compat_teacher_attendance_sessions(teacher_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/attendance/sessions"""
    return get_attendance_sessions(teacher_id, db)

@router.get("/teacher/attendance/export")
def compat_teacher_attendance_export(class_name: str = Query("3R"), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/attendance/export"""
    return export_attendance_csv(class_name, db)

@router.get("/teacher/timetable")
def compat_teacher_timetable(request: Request, teacher_id: Optional[str] = Query(None), emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/timetable/my"""
    return get_my_timetable(request, teacher_id, emp_code, current_user, db)

@router.get("/teacher/timetable/tests")
def compat_teacher_timetable_tests(class_code: Optional[str] = Query("2R1"), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/timetable/tests"""
    return get_scheduled_tests(class_code, None, db)

@router.get("/teacher/quizzes")
def compat_teacher_quizzes(class_id: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes"""
    return get_all_quizzes(class_id, None, current_user, db)

@router.get("/quiz/quizzes")
def compat_quiz_quizzes(class_id: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes"""
    return get_all_quizzes(class_id, None, current_user, db)

@router.get("/quiz/teacher/quizzes")
def compat_quiz_teacher_quizzes(class_id: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes"""
    return get_all_quizzes(class_id, None, current_user, db)

@router.post("/quiz/teacher/quizzes")
def compat_quiz_create(payload: QuizCreateSchema, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/quizzes"""
    return create_quiz(payload, current_user, db)

@router.get("/quiz/classes")
def compat_quiz_classes(db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/classes"""
    return get_classes(db)

@router.get("/quiz/students")
def compat_quiz_students(class_name: Optional[str] = Query(None), class_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/students"""
    return get_all_students(class_name, class_id, db)

@router.get("/quiz/teacher/profile")
def compat_quiz_teacher_profile(request: Request, emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/teachers/profile"""
    return get_teacher_profile(request, emp_code, None, None, current_user, db)

@router.get("/quiz/student/profile")
def compat_quiz_student_profile(student_code: Optional[str] = Query(None), student_id: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/students/profile"""
    return get_student_profile(student_code or student_id, current_user, db)

@router.get("/quiz/teacher/quizzes/{quiz_id}")
def compat_quiz_details(quiz_id: str, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes/{quiz_id}"""
    return get_quiz_details(quiz_id, current_user, db)

@router.delete("/quiz/teacher/quizzes/{quiz_id}")
def compat_quiz_delete(quiz_id: str, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: DELETE /api/v1/quizzes/{quiz_id}"""
    return delete_quiz(quiz_id, current_user, db)

@router.put("/quiz/teacher/quizzes/{quiz_id}/publish")
def compat_quiz_publish(quiz_id: str, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: PUT /api/v1/quizzes/{quiz_id}/publish"""
    return publish_quiz(quiz_id, current_user, db)

@router.get("/quiz/teacher/quizzes/{quiz_id}/questions")
def compat_quiz_questions(quiz_id: str, db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes/{quiz_id}/questions"""
    return get_quiz_questions(quiz_id, db)

@router.post("/quiz/teacher/quizzes/{quiz_id}/questions")
def compat_quiz_add_question(quiz_id: str, payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/quizzes/{quiz_id}/questions"""
    return add_question_to_quiz(quiz_id, payload, current_user, db)

@router.delete("/quiz/teacher/quizzes/{quiz_id}/questions/{question_id}")
def compat_quiz_delete_question(quiz_id: str, question_id: str, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: DELETE /api/v1/quizzes/{quiz_id}/questions/{question_id}"""
    return remove_question_from_quiz(quiz_id, question_id, current_user, db)

@router.get("/quiz/student/quizzes")
def compat_quiz_student_quizzes(class_name: Optional[str] = Query(None), student_id: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes"""
    return get_all_quizzes(class_name, None, current_user, db)

@router.post("/quiz/student/quizzes/{quiz_id}/start")
def compat_quiz_start(quiz_id: str, payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/quizzes/{quiz_id}/start"""
    return start_quiz_attempt(quiz_id, payload, current_user, db)

@router.post("/quiz/student/attempts/{attempt_id}/submit")
def compat_quiz_submit(attempt_id: str, payload: QuizSubmitRequest, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/attempts/{attempt_id}/submit"""
    return submit_quiz_attempt(attempt_id, payload, current_user, db)

@router.put("/quiz/attempts/{attempt_id}/answers")
def compat_quiz_answers(attempt_id: str, payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: PUT /api/v1/attempts/{attempt_id}/answers"""
    return save_attempt_answers(attempt_id, payload, current_user, db)

@router.get("/quiz/attempts/{attempt_id}/result")
def compat_quiz_result(attempt_id: str, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/attempts/{attempt_id}/result"""
    return get_attempt_result(attempt_id, current_user, db)

@router.post("/quiz/attempts/{attempt_id}/security-event")
def compat_quiz_sec_event(attempt_id: str, payload: SecurityEventRequest, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/attempts/{attempt_id}/security-event"""
    return record_security_event(attempt_id, payload, current_user, db)

@router.get("/quiz/quizzes/{quiz_id}/analytics")
def compat_quiz_analytics(quiz_id: str, db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes/{quiz_id}/analytics"""
    return get_quiz_analytics(quiz_id, db)

@router.get("/quiz/quizzes/{quiz_id}/leaderboard")
def compat_quiz_leaderboard(quiz_id: str, db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes/{quiz_id}/leaderboard"""
    return get_quiz_leaderboard(quiz_id, db)

@router.get("/quiz/quizzes/{quiz_id}/export")
def compat_quiz_export(quiz_id: str, filter: str = Query("all"), format: str = Query("csv"), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/quizzes/{quiz_id}/export"""
    return export_quiz_results(quiz_id, filter, format, db)

@router.get("/quiz/quizzes/{quiz_id}/results")
def compat_quiz_results(quiz_id: str, db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/results/quizzes/{quiz_id}"""
    return get_quiz_class_results(quiz_id, db)

@router.post("/quiz/quizzes/{quiz_id}/toggle-release-results")
def compat_quiz_toggle_release(quiz_id: str, payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/quizzes/{quiz_id}/toggle-release-results"""
    return toggle_release_results(quiz_id, payload, current_user, db)

@router.post("/academic/results/publish")
def compat_academic_results_publish(payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: POST /api/v1/results/publish"""
    return publish_results(payload, current_user)

@router.post("/academic/results/unpublish")
def compat_academic_results_unpublish(payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: POST /api/v1/results/unpublish"""
    return unpublish_results(payload, current_user)


# -----------------------------------------------------------------------------
# 3. DEPRECATED /management/... -> CANONICAL /admin/..., /teachers/..., /attendance/...
# -----------------------------------------------------------------------------
@router.get("/management/admin/dashboard")
def compat_admin_dashboard(current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/admin/dashboard"""
    return get_admin_dashboard(current_user)

@router.get("/management/teacher/dashboard")
def compat_teacher_dashboard(request: Request, emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/teachers/dashboard"""
    return get_teacher_dashboard(request, emp_code, current_user)

@router.get("/management/teacher/classes")
def compat_teacher_classes(request: Request, emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/teachers/classes"""
    return get_teacher_classes(request, emp_code, current_user)

@router.get("/management/teacher/subjects")
def compat_teacher_subjects(request: Request, emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/teachers/subjects"""
    return get_teacher_subjects(request, emp_code, current_user)

@router.get("/management/teacher/students")
def compat_teacher_students(request: Request, class_id: Optional[str] = Query(None), emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/teachers/students"""
    return get_teacher_students(request, class_id, emp_code, current_user)

@router.get("/management/teacher/workload")
def compat_teacher_workload(request: Request, emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: GET /api/v1/teachers/workload"""
    return get_teacher_workload(request, emp_code, current_user, db)

@router.get("/management/teacher/leaves")
def compat_teacher_leaves(request: Request, emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/teachers/leaves"""
    return get_teacher_leaves(request, emp_code, current_user)

@router.post("/management/teacher/leave/apply")
def compat_teacher_leave_apply(request: Request, payload: Dict[str, Any] = Body(...), emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: POST /api/v1/teachers/leave/apply"""
    return apply_teacher_leave(request, payload, emp_code, current_user)

@router.get("/management/teacher/documents")
def compat_teacher_documents(request: Request, emp_code: Optional[str] = Query(None), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/teachers/documents"""
    return get_teacher_documents(request, emp_code, current_user)

@router.post("/management/teacher/marks/bulk")
def compat_teacher_marks_bulk(payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: POST /api/v1/results/marks/bulk"""
    return enter_bulk_marks(payload, current_user)

@router.post("/management/teacher/attendance/submit")
def compat_mgmt_attendance_submit(payload: AttendanceSubmitRequest, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Deprecated. Canonical: POST /api/v1/attendance/submit"""
    return submit_attendance(payload, current_user, db)

@router.post("/management/attendance/approve")
def compat_mgmt_attendance_approve(payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: POST /api/v1/attendance/approve"""
    return approve_attendance(payload, current_user)

@router.post("/management/attendance/unlock")
def compat_mgmt_attendance_unlock(payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: POST /api/v1/attendance/unlock"""
    return unlock_attendance(payload, current_user)

@router.get("/management/audit/logs")
def compat_mgmt_audit_logs(limit: int = Query(50, ge=1, le=500), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/admin/audit/logs"""
    return get_admin_audit_logs(limit, current_user)

@router.get("/management/leave/requests")
def compat_mgmt_leave_requests(current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/admin/leave/requests"""
    return get_all_leave_requests(current_user)

@router.post("/management/leave/review")
def compat_mgmt_leave_review(payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: POST /api/v1/admin/leave/review"""
    return review_leave_application(payload, current_user)

@router.get("/management/rbac/matrix")
def compat_mgmt_rbac_matrix(current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/admin/rbac/matrix"""
    return get_rbac_matrix(current_user)

@router.post("/management/rbac/assign")
def compat_mgmt_rbac_assign(payload: Dict[str, Any] = Body(...), current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: POST /api/v1/admin/rbac/assign"""
    return assign_rbac_role(payload, current_user)

@router.get("/management/reports/classes")
def compat_mgmt_reports_classes(current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/admin/reports/classes"""
    return get_classes_report(current_user)

@router.get("/management/reports/faculty")
def compat_mgmt_reports_faculty(current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Deprecated. Canonical: GET /api/v1/admin/reports/faculty"""
    return get_faculty_report(current_user)
