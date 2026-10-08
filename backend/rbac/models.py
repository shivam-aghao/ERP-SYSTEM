"""
SSGMCE College ERP — Centralized RBAC Definitions & Enums
backend/rbac/models.py

Defines standard roles, granular permissions, and permission categories.
"""

from enum import Enum
from typing import List, Optional, Set
from pydantic import BaseModel, Field


class RoleName(str, Enum):
    """
    Standard ERP Roles:
    - SUPER_ADMIN: Infrastructure and complete system control.
    - ADMIN: Administrative operations, master data, user & department management.
    - HOD: Department Head (attendance approvals, faculty leave review, department reports).
    - TEACHER: Faculty instruction, attendance marking, quiz management, marks entry.
    - STUDENT: Student self-service (attendance, exam results, digital wallet, quiz taking).
    - ACCOUNTANT: Financial accounting, fee wallets, invoice creation, payment verification.
    """
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    HOD = "hod"
    TEACHER = "teacher"
    STUDENT = "student"
    ACCOUNTANT = "accountant"


class Permission(str, Enum):
    """
    Centralized Granular Permission Keys.
    Structured as '<domain>.<action>'.
    """
    # Student Data
    STUDENT_VIEW = "student.view"
    STUDENT_EDIT = "student.edit"

    # Attendance
    ATTENDANCE_VIEW = "attendance.view"
    ATTENDANCE_CREATE = "attendance.create"
    ATTENDANCE_EDIT = "attendance.edit"
    ATTENDANCE_EXPORT = "attendance.export"
    ATTENDANCE_APPROVE = "attendance.approve"
    ATTENDANCE_UNLOCK = "attendance.unlock"

    # Quizzes & Assessments
    QUIZ_VIEW = "quiz.view"
    QUIZ_CREATE = "quiz.create"
    QUIZ_EDIT = "quiz.edit"
    QUIZ_PUBLISH = "quiz.publish"
    QUIZ_DELETE = "quiz.delete"
    QUIZ_VIEW_RESULTS = "quiz.view_results"
    QUIZ_EXPORT = "quiz.export"

    # Marks & Academic Results
    MARKS_VIEW = "marks.view"
    MARKS_CREATE = "marks.create"
    MARKS_EDIT = "marks.edit"
    MARKS_PUBLISH = "marks.publish"

    # Fees & Financial Wallet
    FEES_VIEW = "fees.view"
    FEES_CREATE = "fees.create"
    FEES_UPDATE = "fees.update"
    FEES_EXPORT = "fees.export"

    # Documents & Certificates
    DOCUMENTS_VIEW = "documents.view"
    DOCUMENTS_UPLOAD = "documents.upload"
    DOCUMENTS_DELETE = "documents.delete"

    # Timetable & Scheduling
    TIMETABLE_VIEW = "timetable.view"
    TIMETABLE_CREATE = "timetable.create"
    TIMETABLE_EDIT = "timetable.edit"

    # Notifications & Alerts
    NOTIFICATIONS_VIEW = "notifications.view"
    NOTIFICATIONS_MANAGE = "notifications.manage"

    # Master Data & Institutional Management
    FACULTY_VIEW = "faculty.view"
    FACULTY_MANAGE = "faculty.manage"
    CLASS_VIEW = "class.view"
    CLASS_MANAGE = "class.manage"
    SUBJECT_VIEW = "subject.view"
    SUBJECT_MANAGE = "subject.manage"
    LEAVE_APPLY = "leave.apply"
    LEAVE_APPROVE = "leave.approve"
    REPORTS_VIEW = "reports.view"
    REPORTS_EXPORT = "reports.export"
    RBAC_MANAGE = "rbac.manage"
    SYSTEM_MANAGE = "system.manage"


# Permission Aliases Mapping (ensures backwards-compatibility with existing code & DB rows)
PERMISSION_ALIASES = {
    # Attendance aliases
    "attendance.mark": Permission.ATTENDANCE_CREATE.value,
    # Results / Marks aliases
    "result.view": Permission.MARKS_VIEW.value,
    "result.manage": Permission.MARKS_EDIT.value,
    "result.publish": Permission.MARKS_PUBLISH.value,
    # Timetable aliases
    "timetable.manage": Permission.TIMETABLE_EDIT.value,
    # Documents aliases
    "documents.manage": Permission.DOCUMENTS_UPLOAD.value,
    # Student aliases
    "student.manage": Permission.STUDENT_EDIT.value,
    # Quiz aliases
    "quiz.evaluate": Permission.QUIZ_VIEW_RESULTS.value,
    "quiz.take": Permission.QUIZ_VIEW.value,
}


def normalize_permission(perm: str) -> str:
    """Normalizes permission string to canonical permission key."""
    clean = perm.strip().lower()
    return PERMISSION_ALIASES.get(clean, clean)


class RoleMetadata(BaseModel):
    """Metadata describing a role in the ERP system."""
    name: str
    display_name: str
    hierarchy_level: int
    description: str
    is_system: bool = True

