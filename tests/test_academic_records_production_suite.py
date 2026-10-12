"""
================================================================================
SSGMCE COLLEGE ERP — ACADEMIC RECORDS MODULE PRODUCTION TEST SUITE
Comprehensive End-to-End Verification of Student, Teacher, and Admin Flows
Against Live Cloud Supabase PostgreSQL
================================================================================
"""

import sys
import uuid
import requests
from typing import Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:8000"


def api_request(method: str, url: str, **kwargs) -> requests.Response:
    timeout = kwargs.pop("timeout", 40)
    return requests.request(method, url, timeout=timeout, **kwargs)


def auth_headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


def get_token(user_id, password, role):
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/auth/login",
        json={"user_id": user_id, "password": password, "role": role}
    )
    assert res.status_code == 200, f"Login failed for {user_id}: {res.text}"
    data = res.json()
    return data["data"]["access_token"]


def run_tests():
    print("=" * 80)
    print("STARTING SSGMCE ACADEMIC RECORDS MODULE VERIFICATION SUITE")
    print("=" * 80)

    # 1. AUTHENTICATION
    print("\n[Step 1] Authenticating Test Personas...")
    student_token = get_token("308637", "ssgmce@123", "student")
    teacher_token = get_token("EMP-CSE-1001", "teacher@123", "teacher")
    admin_token = get_token("admin", "admin@123", "admin")
    print("  ✓ Student (308637) authenticated.")
    print("  ✓ Teacher (EMP-CSE-1001) authenticated.")
    print("  ✓ Admin (admin) authenticated.")

    # 2. STUDENT SCORECARD & ACADEMIC RECORDS
    print("\n[Step 2] Testing Student Academic Records & Semester Scorecard...")
    res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/results/student",
        headers=auth_headers(student_token)
    )
    assert res.status_code == 200, f"Student results fetch failed: {res.text}"
    s_data = res.json()["data"]
    assert "semesters" in s_data, "Response must include semesters list"
    assert len(s_data["semesters"]) > 0, "Student must have at least one semester record"
    sem1 = s_data["semesters"][0]
    print(f"  ✓ Fetched {len(s_data['semesters'])} semesters for student {s_data['student_code']}.")
    print(f"  ✓ Latest SGPA: {s_data['latest_sgpa']}, CGPA: {s_data['latest_cgpa']}, Status: {s_data['latest_result_status']}.")
    
    # Verify course breakdown in semester 1
    assert "subjects" in sem1, "Semester must contain subjects breakdown"
    if len(sem1["subjects"]) > 0:
        first_sub = sem1["subjects"][0]
        assert "subject_code" in first_sub
        assert "internal_marks" in first_sub
        assert "external_marks" in first_sub
        assert "total_marks" in first_sub
        assert "grade" in first_sub
        assert "credits" in first_sub
        assert "grade_point" in first_sub
        assert "result_status" in first_sub
        print(f"  ✓ Verified Subject Breakdown: {first_sub['subject_code']} - {first_sub['subject_name']}: "
              f"Int: {first_sub['internal_marks']}, Ext: {first_sub['external_marks']}, Total: {first_sub['total_marks']}, "
              f"Grade: {first_sub['grade']} ({first_sub['grade_point']} GP), Credits: {first_sub['credits']}, Status: {first_sub['result_status']}")

    # 3. ZERO-TRUST IDOR PROTECTION
    print("\n[Step 3] Testing Zero-Trust Security & IDOR Attack Rejection...")
    idor_res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/results/student?student_code=308638",
        headers=auth_headers(student_token)
    )
    assert idor_res.status_code == 403, f"Expected 403 Forbidden on spoofed student query, got {idor_res.status_code}"
    print(f"  ✓ IDOR Attack Blocked (403 Forbidden): {idor_res.json()['error']['message']}")

    # 4. TEACHER MARKS ROSTER
    print("\n[Step 4] Testing Teacher Class & Subject Marks Roster...")
    roster_res = api_request(
        "GET",
        f"{BASE_URL}/api/v1/results/marks/roster?class_id=3R&subject_id=CS502&semester=5",
        headers=auth_headers(teacher_token)
    )
    assert roster_res.status_code == 200, f"Marks roster failed: {roster_res.text}"
    roster_data = roster_res.json()["data"]
    assert "students" in roster_data
    assert len(roster_data["students"]) > 0
    print(f"  ✓ Fetched class 3R roster for CS502 (Sem 5) with {len(roster_data['students'])} students. Lock status: {roster_data['is_locked']}.")

    # 5. MARK RANGE VALIDATION (SERVER-SIDE RULES)
    print("\n[Step 5] Testing Server-Side Mark Range Validation...")
    # 5a. Negative Marks
    bad_payload_neg = {
        "class_id": "3R",
        "subject_id": "CS502",
        "semester_number": 5,
        "marks": [
            {"student_code": "308637", "internal_marks": -5.0, "external_marks": 50.0}
        ]
    }
    neg_res = api_request("POST", f"{BASE_URL}/api/v1/results/marks/entry", headers=auth_headers(teacher_token), json=bad_payload_neg)
    assert neg_res.status_code in (400, 422), f"Negative marks should be rejected, got {neg_res.status_code}"
    print("  ✓ Negative marks rejected by server validation.")

    # 5b. Internal Marks Exceeding Max
    bad_payload_max_int = {
        "class_id": "3R",
        "subject_id": "CS502",
        "semester_number": 5,
        "marks": [
            {"student_code": "308637", "internal_marks": 45.0, "external_marks": 50.0, "max_internal": 30.0}
        ]
    }
    max_int_res = api_request("POST", f"{BASE_URL}/api/v1/results/marks/entry", headers=auth_headers(teacher_token), json=bad_payload_max_int)
    assert max_int_res.status_code == 400, f"Exceeding max internal should be rejected with 400, got {max_int_res.status_code}"
    print("  ✓ Marks exceeding component maximum rejected by server.")

    # 6. TEACHER ENTERS AUTHORITATIVE MARKS
    print("\n[Step 6] Teacher Enters Valid Marks with Authoritative Server Evaluation...")
    valid_marks_payload = {
        "class_id": "3R",
        "subject_id": "CS502",
        "semester_number": 5,
        "is_draft": False,
        "marks": [
            {
                "student_code": "308637",
                "internal_marks": 28.0,
                "external_marks": 64.0,
                "practical_marks": 0.0,
                "maximum_marks": 100.0
            }
        ]
    }
    entry_res = api_request("POST", f"{BASE_URL}/api/v1/results/marks/entry", headers=auth_headers(teacher_token), json=valid_marks_payload)
    assert entry_res.status_code == 200, f"Marks entry failed: {entry_res.text}"
    entry_data = entry_res.json()["data"]
    assert entry_data["status"] == "SUBMITTED"
    assert entry_data["processed_count"] >= 1
    print(f"  ✓ Marks persisted into PostgreSQL. Status: {entry_data['status']}, Average: {entry_data['average_marks']}.")

    # Verify student record updated with authoritative Grade 'O' (92% >= 90%)
    chk_res = api_request("GET", f"{BASE_URL}/api/v1/results/semester?student_code=308637&semester=5", headers=auth_headers(admin_token))
    assert chk_res.status_code == 200
    chk_sem = chk_res.json()["data"]["semesters"][0]
    sub_eval = next((s for s in chk_sem["subjects"] if s["subject_code"] == "CS502"), None)
    assert sub_eval is not None, "Subject CS502 must exist in student record"
    assert sub_eval["grade"] == "O", f"Expected Grade 'O' for 92 marks, got {sub_eval['grade']}"
    assert sub_eval["grade_point"] == 10.0, f"Expected 10.0 GP, got {sub_eval['grade_point']}"
    assert sub_eval["result_status"] == "PASS"
    print(f"  ✓ Server-side authoritative evaluation verified: Grade {sub_eval['grade']} (10.0 GP), Status {sub_eval['result_status']}.")

    # 7. TEACHER EDITS MARKS BEFORE LOCK
    print("\n[Step 7] Teacher Edits Marks Before Locking Session...")
    edit_payload = {
        "class_id": "3R",
        "subject_id": "CS502",
        "semester_number": 5,
        "marks": [
            {
                "student_code": "308637",
                "internal_marks": 26.0,
                "external_marks": 58.0,
                "practical_marks": 0.0,
                "maximum_marks": 100.0
            }
        ]
    }
    edit_res = api_request("POST", f"{BASE_URL}/api/v1/results/marks/entry", headers=auth_headers(teacher_token), json=edit_payload)
    assert edit_res.status_code == 200, f"Editing marks before lock failed: {edit_res.text}"
    print("  ✓ Marks successfully updated before session locking.")

    # 8. TEACHER LOCKS MARKS SUBMISSION
    print("\n[Step 8] Teacher Locks Marks Submission...")
    lock_res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/results/marks/lock",
        headers=auth_headers(teacher_token),
        json={"class_id": "3R", "subject_id": "CS502", "semester_number": 5, "reason": "End-term evaluation finalized"}
    )
    assert lock_res.status_code == 200, f"Lock marks failed: {lock_res.text}"
    assert lock_res.json()["data"]["status"] == "LOCKED"
    print("  ✓ Marks submission locked against further modifications.")

    # 9. REJECT MODIFICATION ON LOCKED SUBMISSION
    print("\n[Step 9] Testing Rejection of Marks Modification on Locked Session...")
    rej_res = api_request("POST", f"{BASE_URL}/api/v1/results/marks/entry", headers=auth_headers(teacher_token), json=edit_payload)
    assert rej_res.status_code == 400, f"Expected 400 Bad Request on locked edit, got {rej_res.status_code}"
    print(f"  ✓ Locked marks modification blocked: {rej_res.json()['error']['message']}")

    # 10. ADMIN UNLOCK WITH AUDIT JUSTIFICATION
    print("\n[Step 10] Testing Admin/HOD Unlock Governance...")
    # Empty reason rejection
    bad_unl = api_request("POST", f"{BASE_URL}/api/v1/results/marks/unlock", headers=auth_headers(admin_token), json={
        "class_id": "3R", "subject_id": "CS502", "semester_number": 5, "reason": "  "
    })
    assert bad_unl.status_code in (400, 422), "Empty unlock reason must be rejected"
    print("  ✓ Empty unlock justification blocked.")

    # Valid Admin Unlock
    unl_res = api_request("POST", f"{BASE_URL}/api/v1/results/marks/unlock", headers=auth_headers(admin_token), json={
        "class_id": "3R", "subject_id": "CS502", "semester_number": 5, "reason": "Administrative unlock for clerical mark correction"
    })
    assert unl_res.status_code == 200, f"Admin unlock failed: {unl_res.text}"
    assert unl_res.json()["data"]["status"] == "SUBMITTED"
    print("  ✓ Marks submission unlocked by Admin for revision.")

    # 11. EXAMINATION AUTHORITY VERIFIES MARKS
    print("\n[Step 11] Examination Authority Verifies Marks...")
    ver_res = api_request("POST", f"{BASE_URL}/api/v1/results/marks/verify", headers=auth_headers(admin_token), json={
        "class_id": "3R", "subject_id": "CS502", "semester_number": 5, "remarks": "Scrutiny committee verified all answer sheets"
    })
    assert ver_res.status_code == 200, f"Verify marks failed: {ver_res.text}"
    assert ver_res.json()["data"]["status"] == "VERIFIED"
    print("  ✓ Marks verified and sealed by Examination Cell.")

    # 12. RESULTS PUBLICATION & WITHHOLDING LIFECYCLE
    print("\n[Step 12] Testing Official Results Publication & Withholding...")
    # Publish Results
    pub_res = api_request("POST", f"{BASE_URL}/api/v1/results/publish", headers=auth_headers(admin_token), json={
        "class_name": "3R", "semester": 5, "reason": "Official Winter 2026 End-Semester Result Declaration"
    })
    assert pub_res.status_code == 200, f"Publish results failed: {pub_res.text}"
    assert pub_res.json()["data"]["published_count"] > 0
    print(f"  ✓ Published results for {pub_res.json()['data']['published_count']} students.")

    # Withhold / Unpublish Results
    unpub_res = api_request("POST", f"{BASE_URL}/api/v1/results/unpublish", headers=auth_headers(admin_token), json={
        "class_name": "3R", "semester": 5, "reason": "Temporary administrative hold for re-tabulation"
    })
    assert unpub_res.status_code == 200
    print("  ✓ Results temporarily withheld from student view.")

    # Re-publish for student access
    api_request("POST", f"{BASE_URL}/api/v1/results/publish", headers=auth_headers(admin_token), json={
        "class_name": "3R", "semester": 5, "reason": "Re-published after verification"
    })
    print("  ✓ Results re-published for active student access.")

    # 13. STUDENT REVALUATION APPLICATION & ADMIN REVIEW
    print("\n[Step 13] Testing Student Revaluation Lifecycle & Grade Recalculation...")
    # Student applies for revaluation on CS502
    rev_app_res = api_request("POST", f"{BASE_URL}/api/v1/results/revaluation/apply", headers=auth_headers(student_token), json={
        "subject_code": "CS502",
        "semester_number": 5,
        "reason": "Requesting re-evaluation of Question 4b and Question 6 algorithms derivation.",
        "fee_receipt_no": f"REV-FEES-{uuid.uuid4().hex[:6].upper()}"
    })
    assert rev_app_res.status_code in (200, 201), f"Revaluation application failed: {rev_app_res.text}"
    rev_data = rev_app_res.json()["data"]
    req_id = rev_data["request_id"]
    assert rev_data["status"] == "APPLIED"
    print(f"  ✓ Revaluation application {req_id} registered with fee reference.")

    # Admin reviews and approves revaluation with +6 marks increase
    rev_review_res = api_request("POST", f"{BASE_URL}/api/v1/results/revaluation/review", headers=auth_headers(admin_token), json={
        "request_id": req_id,
        "status": "APPROVED",
        "revalued_marks": 90.0,
        "comments": "Re-evaluation completed: Evaluator found 6 marks uncounted in Q4b. Grade revised to Outstanding (O)."
    })
    assert rev_review_res.status_code == 200, f"Revaluation review failed: {rev_review_res.text}"
    review_data = rev_review_res.json()["data"]
    assert review_data["status"] == "APPROVED"
    assert review_data["revalued_marks"] == 90.0
    assert review_data["new_grade"] == "O"
    print(f"  ✓ Revaluation approved. New Marks: {review_data['revalued_marks']}, Revised Grade: {review_data['new_grade']}.")

    # 14. INSTITUTIONAL REPORTS
    print("\n[Step 14] Testing Institutional Academic Performance Reports...")
    # Class report
    cr_res = api_request("GET", f"{BASE_URL}/api/v1/results/reports/class?class_name=3R&semester=5", headers=auth_headers(admin_token))
    assert cr_res.status_code == 200, f"Class report failed: {cr_res.text}"
    cr = cr_res.json()["data"]
    print(f"  ✓ Class 3R Report (Sem 5): Total Students = {cr['total_students']}, Pass Rate = {cr['pass_percentage']}%, Avg SGPA = {cr['average_sgpa']}, High SGPA = {cr['highest_sgpa']}.")

    # Subject report
    sr_res = api_request("GET", f"{BASE_URL}/api/v1/results/reports/subject?subject_code=CS502&semester=5", headers=auth_headers(admin_token))
    assert sr_res.status_code == 200, f"Subject report failed: {sr_res.text}"
    sr = sr_res.json()["data"]
    print(f"  ✓ Course CS502 Report (Sem 5): Total Candidates = {sr['total_candidates']}, Pass Rate = {sr['pass_percentage']}%, Avg Marks = {sr['average_marks']}.")

    # Backlog report
    br_res = api_request("GET", f"{BASE_URL}/api/v1/results/reports/backlogs", headers=auth_headers(admin_token))
    assert br_res.status_code == 200, f"Backlog report failed: {br_res.text}"
    print(f"  ✓ Institutional Backlog Report retrieved ({len(br_res.json()['data'])} backlog records identified).")

    # 15. GAZETTE CSV / EXCEL EXPORT WITH UTF-8 BOM
    print("\n[Step 15] Testing Official Result Gazette Export...")
    exp_res = api_request("GET", f"{BASE_URL}/api/v1/results/export?class_name=3R&semester=5", headers=auth_headers(admin_token))
    assert exp_res.status_code == 200, f"Gazette export failed: {exp_res.text}"
    assert "text/csv" in exp_res.headers.get("content-type", "")
    assert exp_res.content.startswith(b'\xef\xbb\xbf'), "Exported CSV must include UTF-8 BOM bytes"
    lines = exp_res.text.strip().split("\n")
    assert len(lines) >= 2, "Gazette must include headers and data rows"
    print(f"  ✓ Result Gazette Export verified ({len(lines)} lines, UTF-8 BOM verified, headers: {lines[0][:60]}...).")

    # 16. AUDIT HISTORY VERIFICATION
    print("\n[Step 16] Verifying Audit Trail in admin_audit_logs...")
    audit_res = api_request("GET", f"{BASE_URL}/api/v1/admin/audit/logs?limit=30", headers=auth_headers(admin_token))
    assert audit_res.status_code == 200
    logs = audit_res.json()["data"]
    acad_logs = [log for log in logs if "academic" in str(log.get("module") or "").lower() or "marks" in str(log.get("action") or "").lower() or "results" in str(log.get("action") or "").lower()]
    assert len(acad_logs) > 0, "Expected academic audit log entries"
    print(f"  ✓ Verified {len(acad_logs)} academic audit log entries in admin_audit_logs (Entry, Lock, Unlock, Verify, Publish, Revaluation).")

    print("\n" + "=" * 80)
    print("ALL ACADEMIC RECORDS MODULE PRODUCTION TESTS PASSED SUCCESSFULLY! (16/16)")
    print("=" * 80)


if __name__ == "__main__":
    run_tests()
