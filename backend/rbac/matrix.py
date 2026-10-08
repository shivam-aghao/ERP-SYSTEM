"""
SSGMCE College ERP — Role × Permission Matrix
backend/rbac/matrix.py

Defines the explicit Role-Based Access Control matrix across all ERP roles and permissions.
Enforces explicit permissions without hidden wildcards.
"""

from typing import Dict, Set
from backend.rbac.models import RoleName, Permission, normalize_permission


# Explicit Canonical Permission Matrix: RoleName -> Set[PermissionKey]
ROLE_PERMISSION_MATRIX: Dict[str, Set[str]] = {
    # 1. SUPER_ADMIN: Infrastructure root control; possesses all permissions
    RoleName.SUPER_ADMIN.value: {p.value for p in Permission},

    # 2. ADMIN: Full ERP operational administration with explicit privileges
    RoleName.ADMIN.value: {
        # Student
        Permission.STUDENT_VIEW.value,
        Permission.STUDENT_EDIT.value,
        # Attendance
        Permission.ATTENDANCE_VIEW.value,
        Permission.ATTENDANCE_CREATE.value,
        Permission.ATTENDANCE_EDIT.value,
        Permission.ATTENDANCE_EXPORT.value,
        Permission.ATTENDANCE_APPROVE.value,
        Permission.ATTENDANCE_UNLOCK.value,
        # Quizzes
        Permission.QUIZ_VIEW.value,
        Permission.QUIZ_CREATE.value,
        Permission.QUIZ_EDIT.value,
        Permission.QUIZ_PUBLISH.value,
        Permission.QUIZ_DELETE.value,
        Permission.QUIZ_VIEW_RESULTS.value,
        Permission.QUIZ_EXPORT.value,
        # Marks / Results
        Permission.MARKS_VIEW.value,
        Permission.MARKS_CREATE.value,
        Permission.MARKS_EDIT.value,
        Permission.MARKS_PUBLISH.value,
        # Fees / Wallet
        Permission.FEES_VIEW.value,
        Permission.FEES_CREATE.value,
        Permission.FEES_UPDATE.value,
        Permission.FEES_EXPORT.value,
        # Documents
        Permission.DOCUMENTS_VIEW.value,
        Permission.DOCUMENTS_UPLOAD.value,
        Permission.DOCUMENTS_DELETE.value,
        # Timetable
        Permission.TIMETABLE_VIEW.value,
        Permission.TIMETABLE_CREATE.value,
        Permission.TIMETABLE_EDIT.value,
        # Notifications
        Permission.NOTIFICATIONS_VIEW.value,
        Permission.NOTIFICATIONS_MANAGE.value,
        # Master Data & Institutional Admin
        Permission.FACULTY_VIEW.value,
        Permission.FACULTY_MANAGE.value,
        Permission.CLASS_VIEW.value,
        Permission.CLASS_MANAGE.value,
        Permission.SUBJECT_VIEW.value,
        Permission.SUBJECT_MANAGE.value,
        Permission.LEAVE_APPROVE.value,
        Permission.REPORTS_VIEW.value,
        Permission.REPORTS_EXPORT.value,
        Permission.RBAC_MANAGE.value,
        Permission.SYSTEM_MANAGE.value,
    },

    # 3. HOD: Department Head (attendance approvals, leave approvals, marks publish, department reports)
    RoleName.HOD.value: {
        # Student
        Permission.STUDENT_VIEW.value,
        # Attendance
        Permission.ATTENDANCE_VIEW.value,
        Permission.ATTENDANCE_CREATE.value,
        Permission.ATTENDANCE_EDIT.value,
        Permission.ATTENDANCE_EXPORT.value,
        Permission.ATTENDANCE_APPROVE.value,
        Permission.ATTENDANCE_UNLOCK.value,
        # Quizzes
        Permission.QUIZ_VIEW.value,
        Permission.QUIZ_CREATE.value,
        Permission.QUIZ_EDIT.value,
        Permission.QUIZ_PUBLISH.value,
        Permission.QUIZ_VIEW_RESULTS.value,
        Permission.QUIZ_EXPORT.value,
        # Marks
        Permission.MARKS_VIEW.value,
        Permission.MARKS_CREATE.value,
        Permission.MARKS_EDIT.value,
        Permission.MARKS_PUBLISH.value,
        # Fees (View only for clearance)
        Permission.FEES_VIEW.value,
        # Documents
        Permission.DOCUMENTS_VIEW.value,
        Permission.DOCUMENTS_UPLOAD.value,
        # Timetable
        Permission.TIMETABLE_VIEW.value,
        Permission.TIMETABLE_CREATE.value,
        Permission.TIMETABLE_EDIT.value,
        # Notifications
        Permission.NOTIFICATIONS_VIEW.value,
        Permission.NOTIFICATIONS_MANAGE.value,
        # Master Data
        Permission.FACULTY_VIEW.value,
        Permission.CLASS_VIEW.value,
        Permission.SUBJECT_VIEW.value,
        Permission.LEAVE_APPROVE.value,
        Permission.LEAVE_APPLY.value,
        Permission.REPORTS_VIEW.value,
        Permission.REPORTS_EXPORT.value,
    },

    # 4. TEACHER: Faculty operations (strictly scoped to assigned classes & subjects)
    RoleName.TEACHER.value: {
        # Student (in assigned classes)
        Permission.STUDENT_VIEW.value,
        # Attendance (mark/edit for assigned sessions)
        Permission.ATTENDANCE_VIEW.value,
        Permission.ATTENDANCE_CREATE.value,
        Permission.ATTENDANCE_EDIT.value,
        Permission.ATTENDANCE_EXPORT.value,
        # Quizzes (for assigned courses)
        Permission.QUIZ_VIEW.value,
        Permission.QUIZ_CREATE.value,
        Permission.QUIZ_EDIT.value,
        Permission.QUIZ_PUBLISH.value,
        Permission.QUIZ_VIEW_RESULTS.value,
        Permission.QUIZ_EXPORT.value,
        # Marks (internal/CIE/ESE marks for assigned subjects)
        Permission.MARKS_VIEW.value,
        Permission.MARKS_CREATE.value,
        Permission.MARKS_EDIT.value,
        # Documents
        Permission.DOCUMENTS_VIEW.value,
        Permission.DOCUMENTS_UPLOAD.value,
        # Timetable (personal timetable)
        Permission.TIMETABLE_VIEW.value,
        # Notifications
        Permission.NOTIFICATIONS_VIEW.value,
        # Master Data
        Permission.CLASS_VIEW.value,
        Permission.SUBJECT_VIEW.value,
        Permission.LEAVE_APPLY.value,
    },

    # 5. ACCOUNTANT: College Cashier / Bursar (fee management & payments)
    RoleName.ACCOUNTANT.value: {
        # Student (for billing & fee identification)
        Permission.STUDENT_VIEW.value,
        # Fees / Financial Wallet (full financial management)
        Permission.FEES_VIEW.value,
        Permission.FEES_CREATE.value,
        Permission.FEES_UPDATE.value,
        Permission.FEES_EXPORT.value,
        # Documents (fee receipts, payment challans)
        Permission.DOCUMENTS_VIEW.value,
        Permission.DOCUMENTS_UPLOAD.value,
        # Notifications (broadcast fee payment deadline alerts)
        Permission.NOTIFICATIONS_VIEW.value,
        Permission.NOTIFICATIONS_MANAGE.value,
        # Reports
        Permission.REPORTS_VIEW.value,
        Permission.REPORTS_EXPORT.value,
    },

    # 6. STUDENT: Self-service access (strictly isolated to own records)
    RoleName.STUDENT.value: {
        # Student (own profile view & contact info edit)
        Permission.STUDENT_VIEW.value,
        Permission.STUDENT_EDIT.value,
        # Attendance (own attendance records view only)
        Permission.ATTENDANCE_VIEW.value,
        # Quizzes (view active quizzes, view own evaluated results)
        Permission.QUIZ_VIEW.value,
        Permission.QUIZ_VIEW_RESULTS.value,
        # Marks (view own published semester results)
        Permission.MARKS_VIEW.value,
        # Fees (view own fee balance, initiate online fee payment)
        Permission.FEES_VIEW.value,
        Permission.FEES_CREATE.value,
        # Documents (view own verified documents, upload new documents)
        Permission.DOCUMENTS_VIEW.value,
        Permission.DOCUMENTS_UPLOAD.value,
        # Timetable (view enrolled class timetable)
        Permission.TIMETABLE_VIEW.value,
        # Notifications (view own targeted alerts)
        Permission.NOTIFICATIONS_VIEW.value,
    }
}


def get_default_permissions_for_role(role_name: str) -> Set[str]:
    """Retrieves canonical permissions mapped to a role."""
    norm_role = role_name.strip().lower()
    return ROLE_PERMISSION_MATRIX.get(norm_role, set()).copy()

