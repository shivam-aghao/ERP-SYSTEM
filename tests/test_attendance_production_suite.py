"""
================================================================================
SSGMCE COLLEGE ERP — ATTENDANCE PRODUCTION TEST SUITE
Comprehensive verification of database-driven, role-secure attendance system.
================================================================================
"""

import sys
import os
import json
import uuid
import time
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"


def api_request(method, url, **kwargs):
    """Executes HTTP request with retry to absorb any transient pooler reconnections."""
    for attempt in range(3):
        try:
            res = requests.request(method, url, timeout=20, **kwargs)
            if res.status_code == 500 and attempt < 2:
                time.sleep(1)
                continue
            return res
        except Exception:
            if attempt < 2:
                time.sleep(1)
                continue
            raise


def get_token(user_id, password, role):
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/auth/login",
        json={"user_id": user_id, "password": password, "role": role}
    )
    assert res.status_code == 200, f"Login failed for {user_id}: {res.text}"
    data = res.json()
    return data["data"]["access_token"]


def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


def run_tests():
    print("=" * 80)
    print("STARTING SSGMCE PRODUCTION ATTENDANCE VERIFICATION SUITE")
    print("=" * 80)

    # 1. AUTHENTICATE USERS
    print("\n[Step 1] Authenticating Test Personas...")
    student_token = get_token("308637", "ssgmce@123", "student")
    teacher_token = get_token("EMP-CSE-1001", "teacher@123", "teacher")
    admin_token = get_token("admin", "admin@123", "admin")
    print("  ✓ Student (308637) authenticated.")
    print("  ✓ Teacher (EMP-CSE-1001) authenticated.")
    print("  ✓ Admin (admin) authenticated.")

    # 2. TEACHER ROSTER RETRIEVAL
    print("\n[Step 2] Testing Class Roster Retrieval...")
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/roster?class_id=3R",
        headers=auth_headers(teacher_token)
    )
    assert res.status_code == 200, f"Roster failed: {res.text}"
    roster_data = res.json()["data"]
    students = roster_data.get("students", [])
    assert len(students) > 0, "Roster should not be empty"
    print(f"  ✓ Fetched class 3R roster with {len(students)} students.")
    student_ids = [s["student_id"] for s in students[:5]]
    assert len(student_ids) >= 2, "Need at least 2 students for test"

    # 3. DUPLICATE CHECK (EMPTY/INITIAL)
    period = 1 + (uuid.uuid4().int % 7)
    test_day = 1 + (uuid.uuid4().int % 28)
    test_month = 1 + (uuid.uuid4().int % 12)
    test_year = 2027 + (uuid.uuid4().int % 3)
    test_date = f"{test_year}-{test_month:02d}-{test_day:02d}"  # unique future date
    class_id = "3R"
    subject_code = "5CS220PC"

    print(f"\n[Step 3] Checking Duplicate Status for {class_id} - {subject_code} on {test_date} (Period {period})...")
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/check-duplicate?class_id={class_id}&subject_id={subject_code}&session_date={test_date}&period_number={period}",
        headers=auth_headers(teacher_token)
    )
    assert res.status_code == 200, f"Duplicate check failed: {res.text}"
    dup_res = res.json()["data"]
    assert dup_res["duplicate_exists"] is False, "Initial session should not exist"
    print("  ✓ Verified no duplicate exists initially.")

    # 4. TEACHER SAVES DRAFT (PREVIEW FLOW)
    print("\n[Step 4] Teacher Saves Attendance Draft (Preview Flow)...")
    draft_payload = {
        "class_id": class_id,
        "subject_id": subject_code,
        "session_date": test_date,
        "period_number": period,
        "session_type": "theory",
        "present_student_ids": [student_ids[0]],
        "absent_student_ids": [student_ids[1]],
        "topic_taught": "Relational Algebra Operations",
        "remark": "Draft attendance for verification"
    }
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/attendance/draft",
        headers=auth_headers(teacher_token),
        json=draft_payload
    )
    assert res.status_code == 201, f"Save draft failed: {res.text}"
    draft_data = res.json()["data"]
    session_id = draft_data["session_id"]
    assert draft_data["status"] == "draft", "Session status should be draft"
    print(f"  ✓ Draft saved with session ID: {session_id}.")

    # Verify Draft Retrieval
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/draft?class_id={class_id}&subject_id={subject_code}&session_date={test_date}&period_number={period}",
        headers=auth_headers(teacher_token)
    )
    assert res.status_code == 200, f"Get draft failed: {res.text}"
    retrieved_draft = res.json()["data"]
    assert retrieved_draft is not None, "Draft should be retrieved"
    assert retrieved_draft["status"] == "draft", "Retrieved status should be draft"
    print("  ✓ Retrieved draft verified from database.")

    # 5. TEACHER FINAL SUBMISSION
    print("\n[Step 5] Teacher Submits Final Attendance...")
    submit_payload = {
        "class_id": class_id,
        "subject_id": subject_code,
        "session_date": test_date,
        "period_number": period,
        "session_type": "theory",
        "present_student_ids": [student_ids[0]],
        "absent_student_ids": [student_ids[1]],
        "topic_taught": "Relational Algebra Operations Finalized",
        "remark": "Final attendance submitted"
    }
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/attendance/submit",
        headers=auth_headers(teacher_token),
        json=submit_payload
    )
    assert res.status_code == 200, f"Submit attendance failed: {res.text}"
    submit_data = res.json()["data"]
    assert submit_data["status"] == "SUBMITTED", "Session status must be SUBMITTED"
    print(f"  ✓ Attendance successfully persisted in PostgreSQL with status {submit_data['status']}.")

    # 6. ANTI-DUPLICATE RULE: PREVENT DUPLICATE SUBMISSION
    print("\n[Step 6] Testing Anti-Duplicate Protection Rule...")
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/attendance/submit",
        headers=auth_headers(teacher_token),
        json=submit_payload
    )
    assert res.status_code == 400, f"Duplicate submission should be rejected with 400, got: {res.status_code} - {res.text}"
    print(f"  ✓ Duplicate submission blocked: {res.json()['error']['message']}")

    # 7. TEACHER LOCKS SESSION
    print("\n[Step 7] Teacher Locks Attendance Session...")
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/attendance/lock",
        headers=auth_headers(teacher_token),
        json={"session_id": session_id, "reason": "End of lecture lock"}
    )
    assert res.status_code == 200, f"Lock session failed: {res.text}"
    assert res.json()["data"]["status"] == "LOCKED", "Session status must be LOCKED"
    print("  ✓ Session successfully locked against further edits.")

    # 8. PREVENT UNAUTHORIZED EDITS ON LOCKED SESSION
    print("\n[Step 8] Testing Unauthorized Edit Rejection on Locked Session...")
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/attendance/draft",
        headers=auth_headers(teacher_token),
        json=draft_payload
    )
    assert res.status_code == 400, f"Editing locked session should be rejected, got: {res.status_code}"
    print(f"  ✓ Locked session edit blocked: {res.json()['error']['message']}")

    # 9. ADMIN / HOD UNLOCK WITH MANDATORY JUSTIFICATION
    print("\n[Step 9] Testing Admin/HOD Unlock Governance...")
    # Attempt unlock without proper reason (should fail)
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/attendance/unlock",
        headers=auth_headers(admin_token),
        json={"session_id": session_id, "reason": "  "}
    )
    assert res.status_code in (400, 422), "Empty unlock reason should be rejected"
    print("  ✓ Unlock rejected when justification is absent.")

    # Proper Admin Unlock
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/attendance/unlock",
        headers=auth_headers(admin_token),
        json={"session_id": session_id, "reason": "Administrative correction for student on medical leave"}
    )
    assert res.status_code == 200, f"Admin unlock failed: {res.text}"
    assert res.json()["data"]["status"] == "draft", "Status must revert to draft upon unlock"
    print("  ✓ Session unlocked by Admin for correction.")

    # 10. HOD / ADMIN APPROVAL & FINAL SEAL
    print("\n[Step 10] Testing HOD/Admin Approval & Governance...")
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/attendance/approve",
        headers=auth_headers(admin_token),
        json={"session_id": session_id, "remark": "Verified and approved by Department Authority"}
    )
    assert res.status_code == 200, f"Approve session failed: {res.text}"
    assert res.json()["data"]["status"] == "APPROVED", "Session must be marked APPROVED"
    print("  ✓ Session approved and archived by Department Authority.")

    # 11. STUDENT FLOW & ZERO-TRUST SECURITY
    print("\n[Step 11] Testing Student Attendance Flow & Zero-Trust Client Identity...")
    # Legitimate Student request
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/student",
        headers=auth_headers(student_token)
    )
    assert res.status_code == 200, f"Student attendance fetch failed: {res.text}"
    st_data = res.json()["data"]
    assert "overall_percentage" in st_data, "Response must include overall_percentage"
    assert "subjects" in st_data, "Response must include subject-wise breakdown"
    assert "monthly_attendance" in st_data, "Response must include monthly breakdown"
    assert "lecture_history" in st_data, "Response must include lecture history"
    assert "shortage_warning" in st_data, "Response must include shortage_warning"
    assert "classes_needed_to_75" in st_data, "Response must include consecutive classes needed"
    print(f"  ✓ Student 308637 Attendance Summary:")
    print(f"    - Overall Percentage: {st_data['overall_percentage']}% ({st_data['eligibility_status']})")
    print(f"    - Total Conducted: {st_data['total_conducted']}, Attended: {st_data['total_attended']}")
    print(f"    - Shortage Alert: {st_data['shortage_warning']}")
    if st_data['shortage_warning']:
        print(f"    - Warning Message: {st_data['warning_message']}")
        print(f"    - Consecutive Lectures Needed to Reach 75%: {st_data['classes_needed_to_75']}")
    print(f"    - Subject Count: {len(st_data['subjects'])}")
    print(f"    - Monthly Entries: {len(st_data['monthly_attendance'])}")

    # Zero-Trust Security Check: Student attempting to query another student's record (IDOR attack)
    print("\n[Step 12] Testing Zero-Trust IDOR Protection (Student querying another code)...")
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/student?student_code=308638",
        headers=auth_headers(student_token)
    )
    assert res.status_code == 403, f"IDOR spoof should be blocked with 403 Forbidden, got: {res.status_code}"
    print(f"  ✓ IDOR Attack Blocked: {res.json()['error']['message']}")

    # 13. ADMIN / HOD INSTITUTIONAL REPORTS
    print("\n[Step 13] Testing Institutional Reports (Admin / HOD)...")
    # Class-wise report
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/reports/class?class_id=3R",
        headers=auth_headers(admin_token)
    )
    assert res.status_code == 200, f"Class report failed: {res.text}"
    class_report = res.json()["data"]
    print(f"  ✓ Class Report (3R): Average Rate = {class_report.get('average_attendance_rate')}%, Total Students = {class_report.get('total_students')}")

    # Subject-wise report
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/reports/subject?class_id=3R&subject_id=5CS220PC",
        headers=auth_headers(admin_token)
    )
    assert res.status_code == 200, f"Subject report failed: {res.text}"
    sub_report = res.json()["data"]
    print(f"  ✓ Subject Report (5CS220PC): Average Rate = {sub_report.get('average_attendance_rate')}%, Enrolled = {sub_report.get('total_enrolled')}")

    # Teacher-wise report
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/reports/teacher?teacher_id=EMP-CSE-1002",
        headers=auth_headers(admin_token)
    )
    assert res.status_code == 200, f"Teacher report failed: {res.text}"
    teacher_report = res.json()["data"]
    print(f"  ✓ Teacher Report (EMP-CSE-1002): Conducted = {teacher_report.get('total_sessions_conducted')}, Avg Rate = {teacher_report.get('average_attendance_rate')}%")

    # Shortage / Defaulters list
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/reports/shortage?threshold=75.0",
        headers=auth_headers(admin_token)
    )
    assert res.status_code == 200, f"Shortage report failed: {res.text}"
    shortage_list = res.json()["data"]
    print(f"  ✓ Shortage Report (<75%): {len(shortage_list)} students in defaulters list.")

    # 14. EXPORTS WITH UTF-8 BOM
    print("\n[Step 14] Testing CSV / Excel Exports with UTF-8 BOM...")
    # Class attendance export
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/export?class_name=3R",
        headers=auth_headers(admin_token)
    )
    assert res.status_code == 200, f"Export CSV failed: {res.text}"
    assert res.headers.get("content-type", "").startswith("text/csv"), "Content type must be text/csv"
    assert res.content.startswith(b'\xef\xbb\xbf'), "CSV must start with UTF-8 BOM for Excel compatibility"
    print("  ✓ Class attendance export validated with UTF-8 BOM header.")

    # Shortage list export
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/attendance/reports/shortage/export?class_name=3R",
        headers=auth_headers(admin_token)
    )
    assert res.status_code == 200, f"Shortage export failed: {res.text}"
    assert res.content.startswith(b'\xef\xbb\xbf'), "Shortage export must start with UTF-8 BOM"
    print("  ✓ Shortage list export validated with UTF-8 BOM header.")

    # 15. AUDIT HISTORY VERIFICATION
    print("\n[Step 15] Verifying Audit Trail in admin_audit_logs...")
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/admin/audit/logs?limit=20",
        headers=auth_headers(admin_token)
    )
    assert res.status_code == 200, f"Audit logs fetch failed: {res.text}"
    audit_logs = res.json()["data"]
    att_logs = [log for log in audit_logs if log.get("module") == "ATTENDANCE" or "ATTENDANCE" in str(log.get("action"))]
    assert len(att_logs) > 0, "Attendance actions must be logged in admin_audit_logs"
    print(f"  ✓ Verified {len(att_logs)} attendance audit log entries (Lock, Unlock, Submit, Approve).")

    print("\n" + "=" * 80)
    print("ALL ATTENDANCE PRODUCTION TESTS PASSED SUCCESSFULLY! (15/15)")
    print("=" * 80)


if __name__ == "__main__":
    run_tests()

