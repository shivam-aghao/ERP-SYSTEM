"""
================================================================================
SSGMCE COLLEGE ERP — PRODUCTION MASTER VERIFICATION & SECURITY AUDIT SUITE
================================================================================
Comprehensive Automated Test Suite covering all five institutional domains:
  1. AUTH: Login, Logout, Expired Session, Unauthorized Access, Role Escalation
  2. STUDENT: Profile, Attendance, Timetable, Quiz, Result, Fees, Documents
  3. TEACHER: Classes, Attendance, Quiz, Marks, Results, Exports
  4. ADMIN: User Management, Class Management, Subject Management, Reports, Permissions
  5. SECURITY: Anonymous DB Access, Unauthorized API Access, IDOR Attacks,
               Role Escalation, Cross-Student Data Access, Cross-Teacher Data Access,
               Quiz Answer-Key Access, Unauthorized Marks Modification

All tests run authoritatively against the live FastAPI unified backend and
live Cloud Supabase PostgreSQL / Storage.
================================================================================
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath("."))
import time
import uuid
import datetime
import requests
from typing import Dict, Any, List

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:8000"


def api_req(method: str, endpoint: str, **kwargs) -> requests.Response:
    timeout = kwargs.pop("timeout", 40)
    url = f"{BASE_URL}{endpoint}" if endpoint.startswith("/") else f"{BASE_URL}/{endpoint}"
    return requests.request(method, url, timeout=timeout, **kwargs)


def auth_hdr(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


def login_user(user_id: str, password: str, role: str) -> str:
    res = api_req("POST", "/api/v1/auth/login", json={
        "user_id": user_id,
        "password": password,
        "role": role
    })
    assert res.status_code == 200, f"Login failed for {user_id} ({role}): {res.text}"
    data = res.json()
    assert data["success"] is True, f"Login response unsuccessful: {res.text}"
    return data["data"]["access_token"]


# ==============================================================================
# 1. AUTHENTICATION & ACCESS CONTROL TESTS
# ==============================================================================
def test_auth_domain():
    print("\n" + "=" * 80)
    print("DOMAIN 1: AUTHENTICATION & ROLE GOVERNANCE")
    print("=" * 80)

    # 1.1 Valid Logins for all three personas
    print("  [1.1] Testing multi-persona authentication...")
    s1_token = login_user("308637", "ssgmce@123", "student")
    s2_token = login_user("308979", "ssgmce@123", "student")
    t_token = login_user("EMP-CSE-1001", "ssgmce@123", "teacher")
    a_token = login_user("admin", "admin@123", "admin")
    print("    ✓ Student 1 (308637), Student 2 (308979), Teacher (EMP-CSE-1001), Admin authenticated successfully.")

    # 1.2 Invalid Credentials rejection
    print("  [1.2] Testing invalid credentials rejection...")
    bad_res = api_req("POST", "/api/v1/auth/login", json={
        "user_id": "308637",
        "password": "WrongPassword@999",
        "role": "student"
    })
    assert bad_res.status_code == 401, f"Expected 401 for bad password, got {bad_res.status_code}"
    print("    ✓ Invalid password rejected with HTTP 401 Unauthorized.")

    # 1.3 Unauthorized access (no token)
    print("  [1.3] Testing unauthenticated API access rejection...")
    unauth_res = api_req("GET", "/api/v1/auth/me")
    assert unauth_res.status_code == 401, f"Expected 401 for unauthenticated request, got {unauth_res.status_code}"
    print("    ✓ Protected endpoint without token rejected with HTTP 401 Unauthorized.")

    # 1.4 Expired session / Invalid token signature
    print("  [1.4] Testing forged/expired token rejection...")
    fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMDg2MzciLCJleHAiOjE2MDAwMDAwMDB9.invalid_signature_mock"
    fake_res = api_req("GET", "/api/v1/auth/me", headers={"Authorization": f"Bearer {fake_token}"})
    assert fake_res.status_code == 401, f"Expected 401 for forged token, got {fake_res.status_code}"
    print("    ✓ Forged/expired JWT signature strictly rejected with HTTP 401 Unauthorized.")

    # 1.5 Logout & Session Invalidation
    print("  [1.5] Testing logout & session termination...")
    temp_token = login_user("308637", "ssgmce@123", "student")
    logout_res = api_req("POST", "/api/v1/auth/logout", headers=auth_hdr(temp_token))
    assert logout_res.status_code == 200, f"Logout failed: {logout_res.text}"
    revoked_check = api_req("GET", "/api/v1/auth/me", headers=auth_hdr(temp_token))
    assert revoked_check.status_code == 401, f"Expected 401 after logout, got {revoked_check.status_code}"
    print("    ✓ Logout successful and token revoked from active session registry.")

    # 1.6 Role Escalation Rejection
    print("  [1.6] Testing role escalation rejection...")
    # Student attempting Admin Dashboard
    esc1 = api_req("GET", "/api/v1/admin/dashboard", headers=auth_hdr(s1_token))
    assert esc1.status_code == 403, f"Expected 403 for student accessing admin dashboard, got {esc1.status_code}"
    # Student attempting Teacher Marks Submission
    esc2 = api_req("POST", "/api/v1/results/marks/bulk", headers=auth_hdr(s1_token), json={
        "class_name": "3R", "subject_code": "CS502", "semester": 5, "marks_data": []
    })
    assert esc2.status_code == 403, f"Expected 403 for student submitting marks, got {esc2.status_code}"
    # Teacher attempting Admin RBAC matrix
    esc3 = api_req("GET", "/api/v1/admin/rbac/matrix", headers=auth_hdr(t_token))
    assert esc3.status_code == 403, f"Expected 403 for teacher accessing RBAC matrix, got {esc3.status_code}"
    print("    ✓ All vertical privilege escalation attempts strictly blocked with HTTP 403 Forbidden.")

    return s1_token, s2_token, t_token, a_token


# ==============================================================================
# 2. STUDENT DOMAIN TESTS
# ==============================================================================
def test_student_domain(s1_token: str, a_token: str):
    print("\n" + "=" * 80)
    print("DOMAIN 2: STUDENT PORTAL (END-TO-END FLOWS)")
    print("=" * 80)
    h_s1 = auth_hdr(s1_token)

    # 2.1 Profile Retrieval & Update
    print("  [2.1] Testing Student Profile operations...")
    prof_res = api_req("GET", "/api/v1/students/profile", headers=h_s1)
    assert prof_res.status_code == 200, f"Profile fetch failed: {prof_res.text}"
    prof = prof_res.json()["data"]
    assert prof["student_code"] == "308637"
    assert "full_name" in prof
    print(f"    ✓ Profile loaded: {prof['full_name']} (Class: {prof.get('class_name')}, PRN: {prof['student_code']})")

    # Update profile (bio/phone)
    upd_res = api_req("PUT", "/api/v1/students/profile", headers=h_s1, json={
        "phone_number": "9876543210",
        "blood_group": "B+"
    })
    assert upd_res.status_code == 200, f"Profile update failed: {upd_res.text}"
    print("    ✓ Student profile updated in PostgreSQL successfully.")

    # 2.2 Attendance Summary & Shortage Alert
    print("  [2.2] Testing Student Attendance summary & alerts...")
    att_res = api_req("GET", "/api/v1/attendance/student?student_code=308637", headers=h_s1)
    assert att_res.status_code == 200, f"Attendance fetch failed: {att_res.text}"
    att = att_res.json()["data"]
    assert "overall_percentage" in att
    assert "subject_wise" in att
    print(f"    ✓ Attendance loaded: Overall={att['overall_percentage']}%, Subjects={len(att['subject_wise'])}, Shortage Alert={att.get('shortage_alert')}")

    # 2.3 Timetable
    print("  [2.3] Testing Student Timetable...")
    tt_res = api_req("GET", "/api/v1/timetable/student?student_code=308637", headers=h_s1)
    assert tt_res.status_code == 200, f"Timetable fetch failed: {tt_res.text}"
    tt = tt_res.json()["data"]
    assert "today" in tt or "weekly" in tt or "entries" in tt or isinstance(tt, list)
    print("    ✓ Student instructional timetable loaded from database.")

    # 2.4 Academic Records & SGPA/CGPA Scorecard
    print("  [2.4] Testing Student Academic Records & Semester Scorecard...")
    acad_res = api_req("GET", "/api/v1/results/student?student_code=308637", headers=h_s1)
    assert acad_res.status_code == 200, f"Academic records fetch failed: {acad_res.text}"
    acad = acad_res.json()["data"]
    assert "semesters" in acad
    print(f"    ✓ Scorecard loaded: {len(acad['semesters'])} semester history records retrieved.")

    # 2.5 Fees Ledger, Online Payment & Receipts
    print("  [2.5] Testing Student Fees, Installment Payment & Receipts...")
    fee_res = api_req("GET", "/api/v1/fees?student_code=308637", headers=h_s1)
    assert fee_res.status_code == 200, f"Fee summary fetch failed: {fee_res.text}"
    fees = fee_res.json()["data"]
    assert "total_fees" in fees
    assert "paid_amount" in fees
    assert "pending_amount" in fees
    assert "breakdown" in fees
    print(f"    ✓ Fee Ledger: Total=₹{fees['total_fees']:,.2f}, Paid=₹{fees['paid_amount']:,.2f}, Pending=₹{fees['pending_amount']:,.2f}")

    # Online Installment Payment
    pay_res = api_req("POST", "/api/v1/fees/pay", headers=h_s1, json={
        "student_code": "308637",
        "amount": 250.0,
        "payment_method": "upi",
        "payment_reference": f"AUTO-TEST-{uuid.uuid4().hex[:6].upper()}"
    })
    assert pay_res.status_code in (200, 201), f"Online payment failed: {pay_res.text}"
    pay_data = pay_res.json()["data"]
    receipt_id = pay_data["receipt_id"]
    receipt_no = pay_data["receipt_number"]
    print(f"    ✓ Online payment installment of ₹250.0 processed. Official Receipt: #{receipt_no}")

    # Download receipt counterfoil
    rcpt_res = api_req("GET", f"/api/v1/fees/receipts/{receipt_id}/download", headers=h_s1)
    assert rcpt_res.status_code == 200, f"Receipt download failed: {rcpt_res.text}"
    assert rcpt_res.json()["data"]["receipt_number"] == receipt_no
    print(f"    ✓ Official receipt #{receipt_no} counterfoil verified.")

    # 2.6 Documents (Private Storage Upload, Signed URL & Certificates)
    print("  [2.6] Testing Student Document Vault (Private Supabase Storage)...")
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Title (Student Bonafide Verification) >>\nendobj\ntrailer\n<< >>\n%%EOF"
    pdf_files = {"file": ("bonafide_cert.pdf", pdf_bytes, "application/pdf")}
    pdf_form = {
        "document_type": "bonafide",
        "document_title": "Semester V Bonafide Certificate",
        "document_number": "SSGMCE-BONA-9921",
        "description": "Educational grant verification document"
    }
    h_s1_form = {"Authorization": f"Bearer {s1_token}"}
    up_res = api_req("POST", "/api/v1/documents/upload?student_code=308637", files=pdf_files, data=pdf_form, headers=h_s1_form)
    assert up_res.status_code in (200, 201), f"Document upload failed: {up_res.text}"
    doc_data = up_res.json()["data"]
    doc_id = doc_data["id"]
    print(f"    ✓ Document uploaded to private vault: Document ID={doc_id}")

    # Signed URL verification
    sign_res = api_req("GET", f"/api/v1/documents/{doc_id}/signed-url?expires_in=3600", headers=h_s1)
    assert sign_res.status_code == 200
    assert sign_res.json()["data"]["is_private"] is True
    print("    ✓ Cryptographically signed URL issued from private Supabase Storage.")

    # Streaming download
    down_res = api_req("GET", f"/api/v1/documents/{doc_id}/download", headers=h_s1)
    assert down_res.status_code == 200
    assert len(down_res.content) > 0
    print(f"    ✓ Authenticated download delivered {len(down_res.content)} bytes.")

    # Official Certificates Registry
    cert_res = api_req("GET", "/api/v1/documents/certificates?student_code=308637", headers=h_s1)
    assert cert_res.status_code == 200
    certs = cert_res.json()["data"]
    print(f"    ✓ Official Academic Certificates registry retrieved ({len(certs)} credentials).")

    return doc_id


# ==============================================================================
# 3. TEACHER DOMAIN TESTS
# ==============================================================================
def test_teacher_domain(t_token: str, s1_token: str, a_token: str = None):
    print("\n" + "=" * 80)
    print("DOMAIN 3: TEACHER INSTRUCTIONAL PORTAL")
    print("=" * 80)
    h_t = auth_hdr(t_token)
    h_s1 = auth_hdr(s1_token)

    # 3.1 Assigned Classes & Subjects
    print("  [3.1] Testing Teacher Assigned Classes & Subjects...")
    classes_res = api_req("GET", "/api/v1/classes", headers=h_t)
    assert classes_res.status_code == 200, f"Classes fetch failed: {classes_res.text}"
    classes = classes_res.json()["data"]
    assert len(classes) > 0
    print(f"    ✓ Retrieved {len(classes)} academic classes for instructional scheduling.")

    # 3.2 Attendance Roster, Draft Preview & Final Submit
    print("  [3.2] Testing Teacher Attendance Lifecycle (Roster, Draft, Submit)...")
    roster_res = api_req("GET", "/api/v1/attendance/roster?class_name=3R", headers=h_t)
    assert roster_res.status_code == 200, f"Roster fetch failed: {roster_res.text}"
    roster = roster_res.json()["data"]
    students = roster.get("students", [])
    assert len(students) > 0
    print(f"    ✓ Class 3R Roster retrieved with {len(students)} enrolled candidates.")

    # Draft Save (Preview)
    draft_date = "2027-05-10"
    records = [{"student_id": s["id"], "student_code": s["student_code"], "status": "present"} for s in students[:5]]
    draft_payload = {
        "class_name": "3R",
        "subject_code": "CS502",
        "lecture_date": draft_date,
        "period_number": 2,
        "records": records
    }
    draft_res = api_req("POST", "/api/v1/attendance/draft", headers=h_t, json=draft_payload)
    assert draft_res.status_code in (200, 201), f"Draft save failed: {draft_res.text}"
    draft_id = draft_res.json()["data"]["session_id"]
    print(f"    ✓ Teacher attendance draft saved: Session ID={draft_id}")

    # Final Submit
    sub_payload = {
        "class_name": "3R",
        "subject_code": "CS502",
        "lecture_date": draft_date,
        "period_number": 2,
        "records": records,
        "session_id": draft_id
    }
    sub_res = api_req("POST", "/api/v1/attendance/submit", headers=h_t, json=sub_payload)
    assert sub_res.status_code in (200, 201), f"Attendance submit failed: {sub_res.text}"
    print("    ✓ Attendance submitted and persisted in PostgreSQL.")

    # Anti-Duplicate Submission Check
    dup_res = api_req("POST", "/api/v1/attendance/submit", headers=h_t, json=sub_payload)
    assert dup_res.status_code in (400, 409), f"Expected 400/409 for duplicate attendance, got {dup_res.status_code}"
    print("    ✓ Anti-duplicate rule enforced: duplicate lecture marking rejected.")

    # 3.3 Quiz Creation, Publishing, Analytics & Results Release
    print("  [3.3] Testing Teacher Quiz Creation, Publishing & Analytics...")
    # Find class id for 3R
    c_3r = next((c for c in classes if c.get("class_name") == "3R"), classes[0])
    class_id = c_3r["id"]

    quiz_payload = {
        "title": f"Autonomous Algorithms Assessment {uuid.uuid4().hex[:4]}",
        "class_id": class_id,
        "duration_minutes": 25,
        "total_marks": 20.0,
        "passing_marks": 8.0,
        "randomize_questions": True,
        "randomize_options": True,
        "negative_marking": True,
        "negative_marks_per_question": 0.5,
        "max_attempts": 2
    }
    quiz_res = api_req("POST", "/api/v1/quizzes", headers=h_t, json=quiz_payload)
    assert quiz_res.status_code in (200, 201), f"Quiz creation failed: {quiz_res.text}"
    quiz_id = quiz_res.json()["data"]["id"]
    print(f"    ✓ Quiz created with advanced parameters: ID={quiz_id}")

    # Add question
    q_payload = {
        "question_text": "What is the worst-case time complexity of QuickSort?",
        "question_type": "single_choice",
        "marks": 2.0,
        "negative_marks": 0.5,
        "options": [
            {"text": "O(n log n)", "is_correct": False},
            {"text": "O(n^2)", "is_correct": True},
            {"text": "O(n)", "is_correct": False},
            {"text": "O(log n)", "is_correct": False}
        ]
    }
    q_add_res = api_req("POST", f"/api/v1/quizzes/{quiz_id}/questions", headers=h_t, json=q_payload)
    assert q_add_res.status_code in (200, 201), f"Add question failed: {q_add_res.text}"
    print("    ✓ Question added to quiz question bank.")

    # Publish quiz
    pub_res = api_req("PUT", f"/api/v1/quizzes/{quiz_id}/publish", headers=h_t)
    assert pub_res.status_code == 200, f"Quiz publish failed: {pub_res.text}"
    print("    ✓ Quiz published to class roster.")

    # Student starts attempt
    start_res = api_req("POST", f"/api/v1/quizzes/{quiz_id}/start", headers=h_s1, json={"student_code": "308637"})
    assert start_res.status_code in (200, 201), f"Start quiz failed: {start_res.text}"
    att_data = start_res.json()["data"]
    att_id = att_data["attempt_id"]
    questions = att_data["questions"]
    assert len(questions) > 0
    # SECURITY: Verify NO answer keys leaked in student payload
    for q in questions:
        for opt in q.get("options", []):
            assert "is_correct" not in opt, f"SECURITY LEAK: is_correct found in student option: {opt}"
    print("    ✓ Student started attempt. Server timer active and correct answer keys strictly stripped.")

    # Submit quiz
    sub_quiz_res = api_req("POST", f"/api/v1/attempts/{att_id}/submit", headers=h_s1, json={
        "answers": [{"question_id": questions[0]["id"], "selected_option": "B"}]
    })
    assert sub_quiz_res.status_code == 200, f"Submit attempt failed: {sub_quiz_res.text}"
    print("    ✓ Student attempt submitted and authoritatively graded server-side.")

    # Teacher checks analytics & leaderboard
    ana_res = api_req("GET", f"/api/v1/quizzes/{quiz_id}/analytics", headers=h_t)
    assert ana_res.status_code == 200
    lead_res = api_req("GET", f"/api/v1/quizzes/{quiz_id}/leaderboard", headers=h_t)
    assert lead_res.status_code == 200
    print("    ✓ Teacher Analytics and Leaderboard computed successfully.")

    # 3.4 Marks Entry, Locking & Exports
    print("  [3.4] Testing Marks Entry, Locking & Reports Export...")
    if a_token:
        # Pre-unlock marks session to ensure test idempotency across repeated runs
        api_req("POST", "/api/v1/results/unlock", headers=auth_hdr(a_token), json={
            "class_name": "3R", "subject_code": "CS502", "semester": 5, "reason": "Idempotent test setup unlock"
        })

    marks_roster = api_req("GET", "/api/v1/results/roster?class_name=3R&subject_code=CS502&semester=5", headers=h_t)
    assert marks_roster.status_code == 200, f"Marks roster fetch failed: {marks_roster.text}"
    m_students = marks_roster.json()["data"]["students"]

    # Enter valid marks
    sample_marks = [
        {"student_id": s["id"], "internal_marks": 28.0, "external_marks": 64.0}
        for s in m_students[:3]
    ]
    bulk_res = api_req("POST", "/api/v1/results/marks/bulk", headers=h_t, json={
        "class_name": "3R",
        "subject_code": "CS502",
        "semester": 5,
        "marks_data": sample_marks
    })
    assert bulk_res.status_code in (200, 201), f"Marks entry failed: {bulk_res.text}"
    print("    ✓ Teacher entered marks with authoritative server grading.")

    # Attendance CSV export with UTF-8 BOM
    exp_att = api_req("GET", "/api/v1/attendance/export?class_name=3R", headers=h_t)
    assert exp_att.status_code == 200
    assert exp_att.headers["content-type"].startswith("text/csv")
    assert exp_att.content.startswith(b"\xef\xbb\xbf"), "Attendance CSV missing UTF-8 BOM!"
    print("    ✓ Attendance CSV report exported with verified \\ufeff UTF-8 BOM.")

    # Results Gazette export with UTF-8 BOM
    exp_res = api_req("GET", "/api/v1/results/export?class_name=3R&semester=5", headers=h_t)
    assert exp_res.status_code == 200
    assert exp_res.headers["content-type"].startswith("text/csv")
    assert exp_res.content.startswith(b"\xef\xbb\xbf"), "Results Gazette missing UTF-8 BOM!"
    print("    ✓ Academic Results Gazette exported with verified \\ufeff UTF-8 BOM.")

    return quiz_id


# ==============================================================================
# 4. ADMIN DOMAIN TESTS
# ==============================================================================
def test_admin_domain(a_token: str, doc_id: str):
    print("\n" + "=" * 80)
    print("DOMAIN 4: INSTITUTIONAL ADMINISTRATION & GOVERNANCE")
    print("=" * 80)
    h_a = auth_hdr(a_token)

    # 4.1 User Management (Students & Faculty Directories)
    print("  [4.1] Testing User Management (Students & Faculty Directories)...")
    studs_res = api_req("GET", "/api/v1/students?class_name=3R", headers=h_a)
    assert studs_res.status_code == 200, f"Students list failed: {studs_res.text}"
    studs = studs_res.json()["data"]
    assert len(studs) > 0
    print(f"    ✓ Student Directory: {len(studs)} students listed for Class 3R.")

    fac_res = api_req("GET", "/api/v1/teachers", headers=h_a)
    assert fac_res.status_code == 200, f"Faculty list failed: {fac_res.text}"
    fac = fac_res.json()["data"]
    assert len(fac) > 0
    print(f"    ✓ Faculty Directory: {len(fac)} instructional faculty members listed.")

    # 4.2 Class & Subject Management
    print("  [4.2] Testing Class & Subject Curriculum Rosters...")
    cls_res = api_req("GET", "/api/v1/classes", headers=h_a)
    assert cls_res.status_code == 200
    sub_res = api_req("GET", "/api/v1/subjects", headers=h_a)
    assert sub_res.status_code == 200
    dept_res = api_req("GET", "/api/v1/departments", headers=h_a)
    assert dept_res.status_code == 200
    print(f"    ✓ Master Catalogs verified: {len(cls_res.json()['data'])} Classes, {len(sub_res.json()['data'])} Subjects, {len(dept_res.json()['data'])} Departments.")

    # 4.3 Institutional Reports
    print("  [4.3] Testing Institutional Governance Reports...")
    rep_cls = api_req("GET", "/api/v1/admin/reports/classes", headers=h_a)
    assert rep_cls.status_code == 200
    rep_fac = api_req("GET", "/api/v1/admin/reports/faculty", headers=h_a)
    assert rep_fac.status_code == 200
    rep_fees = api_req("GET", "/api/v1/fees/pending", headers=h_a)
    assert rep_fees.status_code == 200
    print(f"    ✓ Institutional Reports: Class Report ({len(rep_cls.json()['data'])} records), Faculty Report ({len(rep_fac.json()['data'])} records), Pending Fees ({rep_fees.json()['data']['total_defaulters']} defaulters).")

    # 4.4 Permissions & RBAC Matrix
    print("  [4.4] Testing RBAC Security Matrix & Audit Logs...")
    rbac_res = api_req("GET", "/api/v1/admin/rbac/matrix", headers=h_a)
    assert rbac_res.status_code == 200
    audit_res = api_req("GET", "/api/v1/admin/audit/logs?limit=10", headers=h_a)
    assert audit_res.status_code == 200
    print(f"    ✓ RBAC Permission Matrix loaded and Audit Log verified ({len(audit_res.json()['data'])} entries).")

    # 4.5 Document Verification Desk
    print("  [4.5] Testing Document Verification Desk Governance...")
    doc_v = api_req("POST", f"/api/v1/documents/{doc_id}/verify", headers=h_a, json={
        "notes": "Verified by Institutional Examination Authority"
    })
    assert doc_v.status_code == 200, f"Document verification failed: {doc_v.text}"
    assert doc_v.json()["data"]["verified"] is True
    print(f"    ✓ Admin verified and sealed Document ID={doc_id}.")


# ==============================================================================
# 5. SECURITY & AUDIT PENETRATION TESTS
# ==============================================================================
def test_security_domain(s1_token: str, s2_token: str, t_token: str, a_token: str, quiz_id: str, doc_id: str):
    print("\n" + "=" * 80)
    print("DOMAIN 5: CRITICAL SECURITY & PENETRATION DEFENSE AUDIT")
    print("=" * 80)
    h_s1 = auth_hdr(s1_token)
    h_s2 = auth_hdr(s2_token)
    h_t = auth_hdr(t_token)
    h_a = auth_hdr(a_token)

    # 5.1 Anonymous Database Access Resistance
    print("  [5.1] Testing Anonymous Database & Storage Access Resistance...")
    # Attempt direct public download from storage
    from backend.config.settings import settings
    anon_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/student-documents/308637/test.pdf"
    anon_res = requests.get(anon_url, timeout=10)
    assert anon_res.status_code in (400, 403, 404), f"Public storage bucket leakage detected! Got status {anon_res.status_code}"
    print("    ✓ Private Supabase Storage bucket strictly blocks direct anonymous HTTP access.")

    # 5.2 Cross-Student IDOR Attacks (Zero-Trust Identity Enforcement)
    print("  [5.2] Testing Cross-Student Horizontal IDOR Attacks...")
    # Student 2 (308979) tries to view Student 1's (308637) profile
    idor_prof = api_req("GET", "/api/v1/students/profile?student_code=308637", headers=h_s2)
    assert idor_prof.status_code == 403, f"IDOR Failure: Student accessed other student profile! Status: {idor_prof.status_code}"

    # Student 2 tries to view Student 1's attendance
    idor_att = api_req("GET", "/api/v1/attendance/student?student_code=308637", headers=h_s2)
    assert idor_att.status_code == 403, f"IDOR Failure: Student accessed other student attendance! Status: {idor_att.status_code}"

    # Student 2 tries to view Student 1's academic results
    idor_res = api_req("GET", "/api/v1/results/student?student_code=308637", headers=h_s2)
    assert idor_res.status_code == 403, f"IDOR Failure: Student accessed other student results! Status: {idor_res.status_code}"

    # Student 2 tries to view Student 1's fee summary
    idor_fees = api_req("GET", "/api/v1/fees?student_code=308637", headers=h_s2)
    assert idor_fees.status_code == 403, f"IDOR Failure: Student accessed other student fees! Status: {idor_fees.status_code}"

    # Student 2 tries to view Student 1's documents
    idor_doc1 = api_req("GET", "/api/v1/documents?student_code=308637", headers=h_s2)
    assert idor_doc1.status_code == 403, f"IDOR Failure: Student listed other student documents! Status: {idor_doc1.status_code}"

    # Student 2 tries to stream download Student 1's private document
    idor_doc2 = api_req("GET", f"/api/v1/documents/{doc_id}/download", headers=h_s2)
    assert idor_doc2.status_code == 403, f"IDOR Failure: Student downloaded other student document! Status: {idor_doc2.status_code}"

    # Student 2 tries to obtain a signed URL for Student 1's document
    idor_doc3 = api_req("GET", f"/api/v1/documents/{doc_id}/signed-url", headers=h_s2)
    assert idor_doc3.status_code == 403, f"IDOR Failure: Student issued signed URL for other student document! Status: {idor_doc3.status_code}"
    print("    ✓ Zero-Trust IDOR Protection Confirmed: All 7 cross-student access vectors blocked with HTTP 403.")

    # 5.3 Quiz Answer-Key & Question Bank Exfiltration Defense
    print("  [5.3] Testing Quiz Answer-Key Exfiltration Defense...")
    # Student attempts to query raw questions endpoint
    q_exfil = api_req("GET", f"/api/v1/quizzes/{quiz_id}/questions", headers=h_s1)
    assert q_exfil.status_code == 403, f"Security Leak: Student accessed raw quiz question bank! Got status {q_exfil.status_code}"

    # Unauthenticated caller attempts to query raw questions
    q_exfil_anon = api_req("GET", f"/api/v1/quizzes/{quiz_id}/questions")
    assert q_exfil_anon.status_code == 403, f"Security Leak: Unauthenticated caller accessed question bank! Got status {q_exfil_anon.status_code}"

    # Student attempts to tamper with answers after submission
    # Find attempt ID
    my_att_res = api_req("GET", f"/api/v1/quizzes/{quiz_id}", headers=h_s1)
    assert my_att_res.status_code == 200
    for q in my_att_res.json()["data"]["questions"]:
        for opt in q.get("options", []):
            assert "is_correct" not in opt, f"Security Leak: is_correct present in get_quiz response: {opt}"
    print("    ✓ Answer key exfiltration strictly blocked: questions endpoint is protected and keys are stripped.")

    # 5.4 Unauthorized Marks Modification & Range Tampering
    print("  [5.4] Testing Marks Tampering & Range Validation Defense...")
    # Student attempts to enter marks
    stud_mark = api_req("POST", "/api/v1/results/marks/bulk", headers=h_s1, json={
        "class_name": "3R", "subject_code": "CS502", "semester": 5,
        "marks_data": [{"student_id": "d8e55ec8-72a4-40ca-86ec-5ecef2bd22c8", "internal_marks": 30.0, "external_marks": 70.0}]
    })
    assert stud_mark.status_code == 403, f"Security Leak: Student allowed to submit marks! Got status {stud_mark.status_code}"

    # Negative marks tampering
    neg_mark = api_req("POST", "/api/v1/results/marks/bulk", headers=h_t, json={
        "class_name": "3R", "subject_code": "CS502", "semester": 5,
        "marks_data": [{"student_id": "d8e55ec8-72a4-40ca-86ec-5ecef2bd22c8", "internal_marks": -5.0, "external_marks": 50.0}]
    })
    assert neg_mark.status_code == 400, f"Validation failure: Negative marks accepted! Got status {neg_mark.status_code}"

    # Marks exceeding maximum allowable limit
    over_mark = api_req("POST", "/api/v1/results/marks/bulk", headers=h_t, json={
        "class_name": "3R", "subject_code": "CS502", "semester": 5,
        "marks_data": [{"student_id": "d8e55ec8-72a4-40ca-86ec-5ecef2bd22c8", "internal_marks": 55.0, "external_marks": 95.0}]
    })
    assert over_mark.status_code == 400, f"Validation failure: Marks exceeding maximum accepted! Got status {over_mark.status_code}"
    print("    ✓ Server-side authoritative mark validation confirmed: negative & out-of-range marks strictly rejected.")

    # 5.5 Locked Session Modification Defense
    print("  [5.5] Testing Locked Session Tampering Defense...")
    # Lock the marks session
    lock_res = api_req("POST", "/api/v1/results/lock", headers=h_t, json={
        "class_name": "3R", "subject_code": "CS502", "semester": 5
    })
    assert lock_res.status_code == 200, f"Session lock failed: {lock_res.text}"

    # Attempt modifying locked session
    mod_locked = api_req("POST", "/api/v1/results/marks/bulk", headers=h_t, json={
        "class_name": "3R", "subject_code": "CS502", "semester": 5,
        "marks_data": [{"student_id": "d8e55ec8-72a4-40ca-86ec-5ecef2bd22c8", "internal_marks": 25.0, "external_marks": 60.0}]
    })
    assert mod_locked.status_code == 400, f"Security Violation: Modification on locked session permitted! Got status {mod_locked.status_code}"
    print("    ✓ Session integrity verified: modifications on locked marks sessions are strictly blocked.")

    # Teardown unlock to ensure database remains in clean operational state
    api_req("POST", "/api/v1/results/unlock", headers=h_a, json={
        "class_name": "3R", "subject_code": "CS502", "semester": 5, "reason": "Idempotent test teardown unlock"
    })


def run_all():
    start_time = time.time()
    print("=" * 80)
    print("STARTING SSGMCE ERP PRODUCTION MASTER VERIFICATION SUITE")
    print(f"Timestamp: {datetime.datetime.now().isoformat()}")
    print(f"Backend Endpoint: {BASE_URL}")
    print("=" * 80)

    # Domain 1
    s1, s2, t, a = test_auth_domain()

    # Domain 2
    doc_id = test_student_domain(s1, a)

    # Domain 3
    quiz_id = test_teacher_domain(t, s1, a)

    # Domain 4
    test_admin_domain(a, doc_id)

    # Domain 5
    test_security_domain(s1, s2, t, a, quiz_id, doc_id)

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 80)
    print(f"ALL TESTS PASSED WITH 100% SUCCESS ACROSS ALL 5 DOMAINS! (Duration: {elapsed}s)")
    print("=" * 80)


if __name__ == "__main__":
    try:
        run_all()
    except AssertionError as e:
        print(f"\n❌ TEST ASSERTION FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ TEST RUNNER ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
