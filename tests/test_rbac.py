"""
================================================================================
SSGMCE COLLEGE ERP — COMPREHENSIVE RBAC & PRIVILEGE ESCALATION TEST SUITE
tests/test_rbac.py

Validates Authoritative Enforcement across All 6 Roles:
  1. SUPER_ADMIN
  2. ADMIN
  3. HOD
  4. TEACHER
  5. ACCOUNTANT
  6. STUDENT

Verifies:
  - Vertical Privilege Escalation Prevention
  - Horizontal Privilege Escalation Prevention (IDOR & Teacher Scoping)
  - Explicit Admin & Management Permissions
  - Financial, Academic, Attendance, Quiz, and Notification Modules
================================================================================
"""

import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.jwt_handler import create_access_token
from backend.rbac.models import RoleName, Permission
from backend.rbac.matrix import ROLE_PERMISSION_MATRIX, get_default_permissions_for_role
from backend.rbac.service import RBACService

client = TestClient(app)


def get_token_for(user_id: str, role: str) -> str:
    """Helper generating valid signed JWT for testing specific role access."""
    perms = list(get_default_permissions_for_role(role))
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "identifier": user_id,
        "role": role,
        "permissions": perms
    }
    return create_access_token(payload)


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. ROLE MATRIX & DEFINITION INTEGRITY
# ==============================================================================
def test_rbac_matrix_integrity():
    """Verify that canonical matrix contains all 6 required roles with distinct permission boundaries."""
    roles = [
        RoleName.SUPER_ADMIN.value,
        RoleName.ADMIN.value,
        RoleName.HOD.value,
        RoleName.TEACHER.value,
        RoleName.ACCOUNTANT.value,
        RoleName.STUDENT.value
    ]
    for r in roles:
        perms = get_default_permissions_for_role(r)
        assert len(perms) > 0, f"Role {r} has empty permission set"

    # Super Admin possesses all permissions
    all_perms = {p.value for p in Permission}
    assert get_default_permissions_for_role("super_admin") == all_perms

    # Student cannot have attendance.create or quiz.publish
    student_perms = get_default_permissions_for_role("student")
    assert "attendance.create" not in student_perms
    assert "quiz.publish" not in student_perms
    assert "fees.update" not in student_perms

    # Accountant has fees.update and fees.export, but not attendance.create or quiz.create
    acc_perms = get_default_permissions_for_role("accountant")
    assert "fees.update" in acc_perms
    assert "fees.export" in acc_perms
    assert "attendance.create" not in acc_perms
    assert "quiz.create" not in acc_perms

    # Teacher has attendance.create and quiz.create, but not fees.update or fees.export
    teach_perms = get_default_permissions_for_role("teacher")
    assert "attendance.create" in teach_perms
    assert "quiz.create" in teach_perms
    assert "fees.update" not in teach_perms
    assert "fees.export" not in teach_perms


# ==============================================================================
# 2. VERTICAL PRIVILEGE ESCALATION: STUDENT RESTRICTIONS
# ==============================================================================
def test_student_vertical_escalation_blocked():
    """Verify that student role cannot perform faculty, administrative, or accounting actions."""
    student_token = get_token_for("308637", "student")
    headers = auth_header(student_token)

    # 1. Student accessing Teacher Dashboard -> 403 Forbidden
    res = client.get("/api/v1/management/teacher/dashboard", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 2. Student accessing Admin Dashboard -> 403 Forbidden
    res = client.get("/api/v1/management/admin/dashboard", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 3. Student creating attendance draft -> 403 Forbidden
    draft_payload = {
        "class_id": "2R1",
        "subject_id": "SUB-101",
        "session_date": "2026-10-08",
        "period_number": 1,
        "session_type": "theory",
        "attendance": {}
    }
    res = client.post("/api/v1/attendance/draft", json=draft_payload, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 4. Student submitting attendance -> 403 Forbidden
    res = client.post("/api/v1/attendance/submit", json=draft_payload, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 5. Student creating quiz -> 403 Forbidden
    quiz_payload = {
        "title": "Hacked Quiz",
        "class_id": "2R1",
        "duration_minutes": 30
    }
    res = client.post("/api/v1/quizzes", json=quiz_payload, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 6. Student publishing semester results -> 403 Forbidden
    res = client.post("/api/v1/academic/results/publish", json={"student_code": "308637"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 7. Student updating fee invoices -> 403 Forbidden
    res = client.put("/api/v1/student/fees/invoice/INV-9999", json={"status": "waived"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 8. Student exporting fee ledger -> 403 Forbidden
    res = client.get("/api/v1/student/fees/export", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 9. Student broadcasting announcement -> 403 Forbidden
    res = client.post("/api/v1/notifications/broadcast", json={"title": "Spam Alert"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


# ==============================================================================
# 3. HORIZONTAL PRIVILEGE ESCALATION: STUDENT IDOR PREVENTED
# ==============================================================================
def test_student_horizontal_idor_blocked():
    """Verify that student A cannot access student B's profile, fee wallet, or results."""
    student_token = get_token_for("308637", "student")
    headers = auth_header(student_token)

    # 1. Profile IDOR -> 403 Forbidden
    res = client.get("/api/v1/student/profile?student_code=999999", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 2. Fee Wallet IDOR -> 403 Forbidden
    res = client.get("/api/v1/student/fees?student_code=999999", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 3. Semester Results IDOR -> 403 Forbidden
    res = client.get("/api/v1/student/semester-results?student_code=999999", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 4. Academic History IDOR -> 403 Forbidden
    res = client.get("/api/v1/student/academic-history?student_code=999999", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 5. Accessing OWN records -> 200 OK
    res_self = client.get("/api/v1/student/fees?student_code=308637", headers=headers)
    assert res_self.status_code == 200, f"Expected 200, got {res_self.status_code}"


# ==============================================================================
# 4. VERTICAL PRIVILEGE ESCALATION: TEACHER BOUNDARIES
# ==============================================================================
def test_teacher_role_boundaries():
    """Verify that teachers can manage instruction, but cannot alter fees or perform administrative oversight."""
    teacher_token = get_token_for("EMP-CSE-1002", "teacher")
    headers = auth_header(teacher_token)

    # 1. Teacher accessing Teacher Dashboard -> 200 OK
    res = client.get("/api/v1/management/teacher/dashboard", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 2. Teacher accessing Admin Dashboard -> 403 Forbidden
    res = client.get("/api/v1/management/admin/dashboard", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 3. Teacher modifying fee invoice -> 403 Forbidden
    res = client.put("/api/v1/student/fees/invoice/INV-100", json={"status": "adjusted"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 4. Teacher exporting fees -> 403 Forbidden
    res = client.get("/api/v1/student/fees/export", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 5. Teacher reviewing another faculty leave -> 403 Forbidden
    res = client.post("/api/v1/management/leave/review", json={"leave_id": "some-id", "action": "approve"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 6. Teacher unlocking attendance without HOD/Admin permission -> 403 Forbidden
    res = client.post("/api/v1/management/attendance/unlock", json={"session_id": "sess-1"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


# ==============================================================================
# 5. ACCOUNTANT ROLE: PERMITTED FINANCIALS & RESTRICTED ACADEMICS
# ==============================================================================
def test_accountant_role_boundaries():
    """Verify accountant possesses full fee powers, but zero academic/instructional management powers."""
    acc_token = get_token_for("accountant", "accountant")
    headers = auth_header(acc_token)

    # 1. Accountant accessing Fee Wallet for any student -> 200 OK
    res = client.get("/api/v1/student/fees?student_code=308637", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 2. Accountant adjusting fee invoice -> 200 OK
    res = client.put("/api/v1/student/fees/invoice/INV-500", json={"status": "paid", "concession_amount": 1000}, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 3. Accountant exporting financial records -> 200 OK
    res = client.get("/api/v1/student/fees/export", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 4. Accountant broadcasting fee payment alert -> 200 OK
    res = client.post("/api/v1/notifications/broadcast", json={"title": "Fee Deadline Reminder"}, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 5. Accountant calling Teacher Dashboard -> 403 Forbidden
    res = client.get("/api/v1/management/teacher/dashboard", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 6. Accountant taking class attendance -> 403 Forbidden
    draft_payload = {
        "class_id": "2R1",
        "subject_id": "SUB-101",
        "session_date": "2026-10-08",
        "period_number": 1,
        "session_type": "theory",
        "attendance": {}
    }
    res = client.post("/api/v1/attendance/submit", json=draft_payload, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 7. Accountant creating quiz -> 403 Forbidden
    res = client.post("/api/v1/quizzes", json={"title": "Accountant Quiz", "class_id": "2R1"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 8. Accountant publishing semester results -> 403 Forbidden
    res = client.post("/api/v1/academic/results/publish", json={"student_code": "308637"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


# ==============================================================================
# 6. HOD ROLE: DEPARTMENT OVERSIGHT & CLEARANCES
# ==============================================================================
def test_hod_role_powers():
    """Verify HOD possesses department-level approval powers."""
    hod_token = get_token_for("HOD-CSE", "hod")
    headers = auth_header(hod_token)

    # 1. HOD verify endpoint -> 200 OK
    res = client.get("/api/v1/auth/verify/hod", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 2. HOD can review leave requests -> 200 OK
    res = client.post("/api/v1/management/leave/review", json={"leave_id": "3d761193-dadb-44cc-ab48-5b661b6da038", "action": "approve", "reviewer_remarks": "Approved by HOD"}, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 3. HOD can publish academic results -> 200 OK
    res = client.post("/api/v1/academic/results/publish", json={"student_code": "308637", "semester": 5}, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 4. HOD cannot modify fee invoices -> 403 Forbidden
    res = client.put("/api/v1/student/fees/invoice/INV-900", json={"status": "adjusted"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 5. HOD cannot export financial ledgers -> 403 Forbidden
    res = client.get("/api/v1/student/fees/export", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


# ==============================================================================
# 7. ADMIN & SUPER_ADMIN ELEVATED OPERATIONS
# ==============================================================================
def test_admin_and_super_admin_operations():
    """Verify Admin and Super Admin access to administrative and institutional modules."""
    admin_token = get_token_for("admin", "admin")
    admin_headers = auth_header(admin_token)

    super_token = get_token_for("superadmin", "super_admin")
    super_headers = auth_header(super_token)

    # 1. Admin Dashboard -> 200 OK for both
    res1 = client.get("/api/v1/management/admin/dashboard", headers=admin_headers)
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"

    res2 = client.get("/api/v1/management/admin/dashboard", headers=super_headers)
    assert res2.status_code == 200, f"Expected 200, got {res2.status_code}"

    # 2. RBAC Assignment -> 200 OK for Admin
    res = client.post("/api/v1/management/rbac/assign", json={"user_id": "8f913c70-85ed-4261-bbd0-f2d3b42f4af1", "role_name": "teacher"}, headers=admin_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 3. Financial Invoice Update -> 200 OK for Admin
    res = client.put("/api/v1/student/fees/invoice/INV-ADMIN", json={"status": "waived"}, headers=admin_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 4. Financial Export -> 200 OK for Super Admin
    res = client.get("/api/v1/student/fees/export", headers=super_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"


# ==============================================================================
# MAIN TEST RUNNER
# ==============================================================================
if __name__ == "__main__":
    print("=" * 70)
    print("SSGMCE COLLEGE ERP — ROLE-BASED ACCESS CONTROL (RBAC) TEST SUITE")
    print("=" * 70)

    tests = [
        ("Canonical Role x Permission Matrix Integrity", test_rbac_matrix_integrity),
        ("Student Vertical Privilege Escalation Blocked (403)", test_student_vertical_escalation_blocked),
        ("Student Horizontal IDOR Record Isolation Blocked (403)", test_student_horizontal_idor_blocked),
        ("Teacher Role Boundaries & Unauthorized Access Blocked (403)", test_teacher_role_boundaries),
        ("Accountant Financial Powers & Academic Restrictions Blocked (403)", test_accountant_role_boundaries),
        ("HOD Departmental Oversight & Financial Restrictions Blocked (403)", test_hod_role_powers),
        ("Admin & Super Admin Full Authority Verification", test_admin_and_super_admin_operations),
    ]

    passed = 0
    total = len(tests)

    for name, test_func in tests:
        try:
            test_func()
            print(f" [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f" [FAIL] {name} -> {e}")
            import traceback
            traceback.print_exc()

    print("=" * 70)
    print(f"RESULTS: {passed} PASSED, {total - passed} FAILED (TOTAL: {total})")
    print("=" * 70)

    if passed == total:
        print("ALL RBAC AND PRIVILEGE ESCALATION TESTS PASSED PERFECTLY!")
        sys.exit(0)
    else:
        sys.exit(1)
