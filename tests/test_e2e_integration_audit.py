"""
================================================================================
SSGMCE COLLEGE ERP — COMPLETE END-TO-END INTEGRATION AUDIT SUITE
Institutional Verification: Shri Sant Gajanan Maharaj College of Engineering, Shegaon
Database Target: Cloud Supabase PostgreSQL (gftqvclenyplnuoocbwe.supabase.co)

This test suite verifies the end-to-end flow:
Login -> Role detection -> Dashboard -> Module -> API -> Database -> Response -> UI update

Covers:
  - STUDENT: Login, Dashboard, Profile, Attendance, Timetable, Syllabus, Quiz,
             Quiz Attempt, Result, Academic Records, Fees, Documents, Notifications
  - TEACHER: Login, Dashboard, Profile, Assigned Classes, Timetable, Attendance,
             Question Bank, Quiz Creation, Quiz Publishing, Quiz Monitoring, Result, Export
  - ADMIN:   Login, Dashboard, Students, Teachers, Classes, Subjects, Attendance,
             Timetable, Exams, Marks, Results, Fees, Documents, Notifications, Reports
  - LIFECYCLE & STATES: UI Hooks, Auth, RBAC, Loading/Empty/Error/Success States,
                        Refresh, Logout/Login
================================================================================
"""

import os
import sys
import uuid
import json
from bs4 import BeautifulSoup
from fastapi.testclient import TestClient

# Ensure workspace root is in python path
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from backend.main import app

client = TestClient(app)

FRONTEND_HTML_DIR = os.path.join(WORKSPACE_ROOT, "frontend", "html")


# ==============================================================================
# FIXTURES: AUTHENTICATION TOKENS FOR AUDITED ROLES
# ==============================================================================

def student_auth():
    """Authenticates as student 308637 and returns access token + headers."""
    resp = client.post("/api/v1/auth/login", json={
        "user_id": "308637",
        "password": "ssgmce@123",
        "role": "student"
    })
    assert resp.status_code == 200, f"Student login failed: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    assert data["role"] == "student"
    token = data["data"]["access_token"]
    return {
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["data"]["user"]
    }


def teacher_auth():
    """Authenticates as teacher EMP-CSE-1001 and returns access token + headers."""
    resp = client.post("/api/v1/auth/login", json={
        "user_id": "EMP-CSE-1001",
        "password": "teacher@123",
        "role": "teacher"
    })
    assert resp.status_code == 200, f"Teacher login failed: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    assert data["role"] == "teacher"
    token = data["data"]["access_token"]
    return {
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["data"]["user"]
    }


def admin_auth():
    """Authenticates as admin and returns access token + headers."""
    resp = client.post("/api/v1/auth/login", json={
        "user_id": "admin",
        "password": "admin@123",
        "role": "admin"
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    assert data["role"] == "admin"
    token = data["data"]["access_token"]
    return {
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["data"]["user"]
    }


# ==============================================================================
# 1. STUDENT FLOW AUDIT
# ==============================================================================

class TestStudentFlow:
    """Verifies complete student flow and modules against live database."""

    def test_student_login_and_role_detection(self, student_auth):
        """Student Login -> Role Detection -> Permissions."""
        # 1. Role verification endpoint
        res = client.get("/api/v1/auth/verify/student", headers=student_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["role"] == "student"
        assert body["data"]["identifier"] == "308637"

        # 2. Server-side identity verification
        me_res = client.get("/api/v1/auth/me", headers=student_auth["headers"])
        assert me_res.status_code == 200
        assert me_res.json()["data"]["role"] == "student"

        # 3. Role isolation: Student cannot access teacher/admin verify endpoints
        teacher_verify = client.get("/api/v1/auth/verify/teacher", headers=student_auth["headers"])
        assert teacher_verify.status_code == 403

        admin_verify = client.get("/api/v1/auth/verify/admin", headers=student_auth["headers"])
        assert admin_verify.status_code == 403

    def test_student_dashboard_overview(self, student_auth):
        """Student Dashboard -> Database Aggregation (KPIs, CGPA, Attendance)."""
        res = client.get("/api/v1/students/overview?student_code=308637", headers=student_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        data = body["data"]
        assert "attendance_percentage" in data or "attendancePercentage" in data or "kpis" in data or "student" in data

    def test_student_profile(self, student_auth):
        """Student Profile -> SELECT, UPDATE, IDOR Isolation."""
        # 1. SELECT Profile
        res = client.get("/api/v1/students/profile?student_code=308637", headers=student_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["student_code"] == "308637"
        assert "Aghao Shivam Sanjay" in body["data"]["full_name"]

        # 2. Database UPDATE Profile
        update_res = client.put("/api/v1/students/profile?student_code=308637", headers=student_auth["headers"], json={
            "phone": "9876543210",
            "blood_group": "B+"
        })
        assert update_res.status_code == 200
        assert update_res.json()["success"] is True

        # 3. IDOR Isolation: Student cannot query another student's profile
        idor_res = client.get("/api/v1/students/profile?student_code=308638", headers=student_auth["headers"])
        assert idor_res.status_code == 403

    def test_student_attendance(self, student_auth):
        """Student Attendance -> Database Query (Overall % & Subjects)."""
        res = client.get("/api/v1/attendance/student?student_code=308637", headers=student_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        data = body["data"]
        assert "overall_percentage" in data
        assert "subjects" in data
        assert isinstance(data["subjects"], list)
        assert len(data["subjects"]) > 0

    def test_student_timetable(self, student_auth):
        """Student Timetable -> Database Grid & Assessments."""
        res = client.get("/api/v1/timetable", headers=student_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True

        test_res = client.get("/api/v1/timetable/tests?class_code=3R", headers=student_auth["headers"])
        assert test_res.status_code == 200
        assert test_res.json()["success"] is True

    def test_student_syllabus(self, student_auth):
        """Student Syllabus -> Curriculum & E-Learning Materials."""
        res = client.get("/api/v1/syllabus", headers=student_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True

        elearn_res = client.get("/api/v1/students/elearning?student_code=308637", headers=student_auth["headers"])
        assert elearn_res.status_code == 200
        assert elearn_res.json()["success"] is True

    def test_student_quiz_and_attempt_lifecycle(self, student_auth):
        """Student Quiz -> Start Attempt -> Autosave Answers -> Submit -> Evaluation."""
        # 1. Fetch available quizzes for student's class
        res = client.get("/api/v1/quizzes?class_id=3R&student_code=308637", headers=student_auth["headers"])
        assert res.status_code == 200
        quizzes = res.json()["data"]
        assert isinstance(quizzes, list)
        assert len(quizzes) > 0, "Expected at least one active quiz in Supabase"
        target_quiz = quizzes[0]
        quiz_id = target_quiz["id"]

        # 2. Start Quiz Attempt in DB
        start_res = client.post(f"/api/v1/quizzes/{quiz_id}/start", headers=student_auth["headers"], json={
            "student_id": "308637"
        })
        assert start_res.status_code in (200, 201)
        start_body = start_res.json()
        assert start_body["success"] is True
        attempt_id = start_body["data"]["attempt_id"]
        questions = start_body["data"]["questions"]
        assert len(questions) > 0

        # Verify correct answers are stripped for student!
        for q in questions:
            for opt in q.get("options", []):
                assert "is_correct" not in opt

        # 3. Autosave answers in DB
        first_q = questions[0]
        first_opt_key = first_q["options"][0]["key"] if first_q["options"] else "A"
        save_res = client.put(f"/api/v1/attempts/{attempt_id}/answers", headers=student_auth["headers"], json={
            "answers": {first_q["id"]: first_opt_key}
        })
        assert save_res.status_code == 200
        assert save_res.json()["success"] is True

        # 4. Security Proctoring Event (Tab switch / blur)
        sec_res = client.post(f"/api/v1/attempts/{attempt_id}/security-event", headers=student_auth["headers"], json={
            "event_type": "WINDOW_BLUR",
            "metadata": {"count": 1, "duration_ms": 1200}
        })
        assert sec_res.status_code == 200
        assert sec_res.json()["success"] is True

        # 5. Submit Quiz Attempt -> Server-side grading & DB persistence
        sub_res = client.post(f"/api/v1/attempts/{attempt_id}/submit", headers=student_auth["headers"], json={
            "answers": {first_q["id"]: first_opt_key},
            "is_auto_submit": False
        })
        assert sub_res.status_code == 200
        sub_body = sub_res.json()
        assert sub_body["success"] is True
        assert "score" in sub_body["data"] or "marks_obtained" in sub_body["data"]

        # 6. Retrieve Attempt Result & Scorecard
        score_res = client.get(f"/api/v1/attempts/{attempt_id}/result", headers=student_auth["headers"])
        assert score_res.status_code == 200
        assert score_res.json()["success"] is True

    def test_student_academic_records_and_results(self, student_auth):
        """Student Academic Records -> Multi-semester Progression & SGPA/CGPA."""
        dash_res = client.get("/api/v1/students/academic-dashboard?student_code=308637", headers=student_auth["headers"])
        assert dash_res.status_code == 200
        dash_body = dash_res.json()
        assert dash_body["success"] is True
        assert "cgpa" in dash_body["data"] or "cumulative" in dash_body["data"]

        hist_res = client.get("/api/v1/students/academic-history?student_code=308637", headers=student_auth["headers"])
        assert hist_res.status_code == 200
        assert hist_res.json()["success"] is True

        rec_res = client.get("/api/v1/students/records?student_code=308637", headers=student_auth["headers"])
        assert rec_res.status_code == 200
        assert rec_res.json()["success"] is True

    def test_student_fees(self, student_auth):
        """Student Fees -> Invoices, Payment Transaction, Receipts."""
        # 1. Fee summary
        fee_res = client.get("/api/v1/fees?student_code=308637", headers=student_auth["headers"])
        assert fee_res.status_code == 200
        assert fee_res.json()["success"] is True

        # 2. Online installment payment
        pay_res = client.post("/api/v1/fees/pay", headers=student_auth["headers"], json={
            "student_code": "308637",
            "amount": 5000.0,
            "payment_method": "upi",
            "invoice_id": "INV-TEST-001"
        })
        assert pay_res.status_code in (200, 201)
        assert pay_res.json()["success"] is True

        # 3. Transaction history
        tx_res = client.get("/api/v1/fees/transactions?student_code=308637", headers=student_auth["headers"])
        assert tx_res.status_code == 200
        assert tx_res.json()["success"] is True

    def test_student_documents_and_certificates(self, student_auth):
        """Student Documents -> D-Wallet Files, Certificates, Public Verification."""
        # 1. D-Wallet files
        docs_res = client.get("/api/v1/documents?student_code=308637", headers=student_auth["headers"])
        assert docs_res.status_code == 200
        assert docs_res.json()["success"] is True

        # 2. Issued certificates
        cert_res = client.get("/api/v1/documents/certificates?student_code=308637", headers=student_auth["headers"])
        assert cert_res.status_code == 200
        assert cert_res.json()["success"] is True

        # 3. Public certificate verification
        verify_res = client.get("/api/v1/documents/certificates/verify/SSGMCE-ACAD-308979")
        assert verify_res.status_code == 200
        assert verify_res.json()["success"] is True
        assert verify_res.json()["data"]["is_valid"] is True

    def test_student_notifications(self, student_auth):
        """Student Notifications -> List, Unread Tag, Mark Read."""
        notifs_res = client.get("/api/v1/notifications?user_id=308637", headers=student_auth["headers"])
        assert notifs_res.status_code == 200
        body = notifs_res.json()
        assert body["success"] is True
        assert "notifications" in body["data"] or isinstance(body["data"], list)


# ==============================================================================
# 2. TEACHER FLOW AUDIT
# ==============================================================================

class TestTeacherFlow:
    """Verifies complete faculty flow and instructional operations."""

    def test_teacher_login_and_role_detection(self, teacher_auth):
        """Teacher Login -> Role Verification -> RBAC Permissions."""
        res = client.get("/api/v1/auth/verify/teacher", headers=teacher_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["role"] in ("teacher", "hod")
        assert body["data"]["identifier"] == "EMP-CSE-1001"

        # Teacher cannot access admin verification
        adm_res = client.get("/api/v1/auth/verify/admin", headers=teacher_auth["headers"])
        assert adm_res.status_code == 403

    def test_teacher_dashboard_and_profile(self, teacher_auth):
        """Teacher Dashboard & Profile -> Teaching Workload & Assigned Subjects."""
        dash_res = client.get("/api/v1/teachers/dashboard", headers=teacher_auth["headers"])
        assert dash_res.status_code == 200
        assert dash_res.json()["success"] is True

        prof_res = client.get("/api/v1/teachers/profile", headers=teacher_auth["headers"])
        assert prof_res.status_code == 200
        assert prof_res.json()["success"] is True
        assert prof_res.json()["data"]["emp_code"] == "EMP-CSE-1001"

        # Update profile
        up_res = client.put("/api/v1/teachers/profile", headers=teacher_auth["headers"], json={
            "cabin_room": "Cabin 304, IT Block",
            "phone": "9422114455"
        })
        assert up_res.status_code == 200
        assert up_res.json()["success"] is True

    def test_teacher_assigned_classes_and_roster(self, teacher_auth):
        """Teacher Assigned Classes -> Class Student Rosters."""
        classes_res = client.get("/api/v1/teachers/classes", headers=teacher_auth["headers"])
        assert classes_res.status_code == 200
        assert classes_res.json()["success"] is True

        students_res = client.get("/api/v1/teachers/students?class_id=3R", headers=teacher_auth["headers"])
        assert students_res.status_code == 200
        assert students_res.json()["success"] is True
        students = students_res.json()["data"]
        assert len(students) > 0

    def test_teacher_timetable(self, teacher_auth):
        """Teacher Timetable -> Weekly Faculty Schedule."""
        res = client.get("/api/v1/timetable/my", headers=teacher_auth["headers"])
        assert res.status_code == 200
        assert res.json()["success"] is True

    def test_teacher_attendance_marking_and_export(self, teacher_auth):
        """Teacher Attendance -> Roster -> Draft -> Submit -> Export."""
        # 1. Attendance Roster for target class 3R
        roster_res = client.get("/api/v1/attendance/roster?class_id=3R", headers=teacher_auth["headers"])
        assert roster_res.status_code == 200
        roster = roster_res.json()["data"]
        assert "students" in roster
        student_list = roster["students"]
        assert len(student_list) > 0

        # 2. Check Duplicate
        dup_res = client.get("/api/v1/attendance/check-duplicate?class_id=3R&subject_id=Theory+of+Computation&session_date=2026-10-08&period_number=1", headers=teacher_auth["headers"])
        assert dup_res.status_code == 200

        # 3. Save Attendance Draft
        draft_res = client.post("/api/v1/attendance/draft", headers=teacher_auth["headers"], json={
            "class_id": "3R",
            "subject_id": "Theory of Computation",
            "session_date": "2026-10-08",
            "period_number": 2,
            "session_type": "theory",
            "attendance_records": []
        })
        assert draft_res.status_code in (200, 201)
        assert draft_res.json()["success"] is True

        # 4. Submit Attendance -> Persists into Cloud Supabase PostgreSQL
        first_five_students = student_list[:5]
        records = [{"student_id": s["student_id"], "status": "present"} for s in first_five_students]
        sub_res = client.post("/api/v1/attendance/submit", headers=teacher_auth["headers"], json={
            "class_id": "3R",
            "subject_id": "Theory of Computation",
            "session_date": "2026-10-08",
            "period_number": 2,
            "session_type": "theory",
            "records": records
        })
        assert sub_res.status_code == 200
        assert sub_res.json()["success"] is True

        # 5. Export Attendance CSV
        exp_res = client.get("/api/v1/attendance/export?class_name=3R", headers=teacher_auth["headers"])
        assert exp_res.status_code == 200
        assert "text/csv" in exp_res.headers.get("content-type", "")

    def test_teacher_quiz_creation_publishing_and_monitoring(self, teacher_auth):
        """Teacher Question Bank -> Create Quiz -> Publish -> Monitor -> Export Results."""
        # 1. Question Bank: Add new question
        qbank_res = client.post("/api/v1/quizzes/questions/bank", headers=teacher_auth["headers"], json={
            "question_text": "What is the time complexity of Breadth-First Search (BFS)?",
            "question_type": "MCQ",
            "subject_id": "SUB-DS-01",
            "subject_name": "Data Structures & Algorithms",
            "topic": "Graph Algorithms",
            "difficulty": "MEDIUM",
            "marks": 2.0,
            "negative_marks": 0.5,
            "expected_answer": "B",
            "explanation": "BFS visits all V vertices and explores all E edges, hence O(V + E).",
            "options": [
                {"key": "A", "text": "O(log V)", "is_correct": False},
                {"key": "B", "text": "O(V + E)", "is_correct": True},
                {"key": "C", "text": "O(V^2)", "is_correct": False},
                {"key": "D", "text": "O(E log V)", "is_correct": False}
            ]
        })
        assert qbank_res.status_code in (200, 201)
        assert qbank_res.json()["success"] is True
        new_q_id = qbank_res.json()["data"]["id"]

        # 2. Create Quiz for class 3R
        quiz_create_res = client.post("/api/v1/quizzes", headers=teacher_auth["headers"], json={
            "title": f"Algorithms Mastery Test {uuid.uuid4().hex[:6]}",
            "description": "Comprehensive midterm assessment on graphs and search algorithms.",
            "instructions": "Attempt all questions. 2 marks per question.",
            "subject_id": "SUB-DS-01",
            "subject_name": "Data Structures",
            "class_id": "3R",
            "duration_minutes": 25,
            "total_marks": 20.0,
            "passing_marks": 8.0,
            "max_attempts": 1,
            "shuffle_questions": True,
            "shuffle_options": True,
            "allow_question_navigation": True,
            "allow_back_navigation": True,
            "show_result_immediately": True,
            "show_correct_answers": True,
            "result_release_mode": "IMMEDIATE",
            "negative_marking": True,
            "negative_marks": 0.5,
            "questions": [
                {
                    "question_text": "Which data structure is typically used to implement BFS?",
                    "question_type": "MCQ",
                    "marks": 2.0,
                    "options": [
                        {"key": "A", "text": "Stack", "is_correct": False},
                        {"key": "B", "text": "Queue", "is_correct": True},
                        {"key": "C", "text": "Priority Queue", "is_correct": False},
                        {"key": "D", "text": "Binary Heap", "is_correct": False}
                    ]
                }
            ]
        })
        assert quiz_create_res.status_code in (200, 201)
        created_quiz = quiz_create_res.json()["data"]
        quiz_id = created_quiz["id"]

        # 3. Publish Quiz
        pub_res = client.put(f"/api/v1/quizzes/{quiz_id}/publish", headers=teacher_auth["headers"])
        assert pub_res.status_code == 200
        assert pub_res.json()["success"] is True
        assert pub_res.json()["data"]["is_published"] is True

        # 4. Monitor Quiz Analytics
        analytics_res = client.get(f"/api/v1/quizzes/{quiz_id}/analytics", headers=teacher_auth["headers"])
        assert analytics_res.status_code == 200
        assert analytics_res.json()["success"] is True

        # 5. Leaderboard
        lead_res = client.get(f"/api/v1/quizzes/{quiz_id}/leaderboard", headers=teacher_auth["headers"])
        assert lead_res.status_code == 200
        assert lead_res.json()["success"] is True

        # 6. Export Quiz Results CSV
        exp_res = client.get(f"/api/v1/quizzes/{quiz_id}/export?format=csv", headers=teacher_auth["headers"])
        assert exp_res.status_code == 200
        assert "text/csv" in exp_res.headers.get("content-type", "")

        # 7. Release Results Toggle
        rel_res = client.post(f"/api/v1/quizzes/{quiz_id}/toggle-release-results", headers=teacher_auth["headers"], json={"release": True})
        assert rel_res.status_code == 200
        assert rel_res.json()["success"] is True


# ==============================================================================
# 3. ADMIN FLOW AUDIT
# ==============================================================================

class TestAdminFlow:
    """Verifies complete administrative governance, institutional rosters, and security audit."""

    def test_admin_login_and_role_detection(self, admin_auth):
        """Admin Login -> Role Verification -> Superuser Privileges."""
        res = client.get("/api/v1/auth/verify/admin", headers=admin_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["role"] == "admin"
        assert body["data"]["identifier"] == "admin"

    def test_admin_dashboard_and_stats(self, admin_auth):
        """Admin Dashboard -> Institutional Analytics & KPIs."""
        dash_res = client.get("/api/v1/admin/dashboard", headers=admin_auth["headers"])
        assert dash_res.status_code == 200
        assert dash_res.json()["success"] is True

        stats_res = client.get("/api/v1/admin/stats", headers=admin_auth["headers"])
        assert stats_res.status_code == 200
        assert stats_res.json()["success"] is True

    def test_admin_students_directory(self, admin_auth):
        """Admin Students -> Master Student Directory."""
        res = client.get("/api/v1/students", headers=admin_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        students = body["data"]
        assert isinstance(students, list)
        assert len(students) > 0

    def test_admin_teachers_directory(self, admin_auth):
        """Admin Teachers -> Master Faculty Directory."""
        res = client.get("/api/v1/teachers", headers=admin_auth["headers"])
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        teachers = body["data"]
        assert isinstance(teachers, list)
        assert len(teachers) > 0

    def test_admin_classes_and_subjects(self, admin_auth):
        """Admin Classes & Subjects -> Master Curriculum Tables."""
        cls_res = client.get("/api/v1/classes", headers=admin_auth["headers"])
        assert cls_res.status_code == 200
        assert cls_res.json()["success"] is True
        assert len(cls_res.json()["data"]) > 0

        sub_res = client.get("/api/v1/subjects", headers=admin_auth["headers"])
        assert sub_res.status_code == 200
        assert sub_res.json()["success"] is True
        assert len(sub_res.json()["data"]) > 0

    def test_admin_attendance_lock_and_approval(self, admin_auth):
        """Admin Attendance Governance -> Session Approval & Unlock."""
        appr_res = client.post("/api/v1/attendance/approve", headers=admin_auth["headers"], json={
            "session_id": "test-session-id"
        })
        assert appr_res.status_code == 200
        assert appr_res.json()["success"] is True

        unl_res = client.post("/api/v1/attendance/unlock", headers=admin_auth["headers"], json={
            "session_id": "test-session-id"
        })
        assert unl_res.status_code == 200
        assert unl_res.json()["success"] is True

    def test_admin_timetable_and_scheduled_tests(self, admin_auth):
        """Admin Timetable -> Grid & Assessment Management."""
        tt_res = client.get("/api/v1/timetable", headers=admin_auth["headers"])
        assert tt_res.status_code == 200
        assert tt_res.json()["success"] is True

        # Schedule assessment in DB
        sch_res = client.post("/api/v1/timetable/tests", headers=admin_auth["headers"], json={
            "title": "Autonomous Unit Test 1",
            "subject": "Theory of Computation",
            "type": "Unit Test",
            "date": "2026-10-25",
            "start_time": "10:30 AM",
            "end_time": "11:30 AM",
            "link": "https://erp.ssgmce.ac.in/quiz/unit-1",
            "class_code": "3R"
        })
        assert sch_res.status_code in (200, 201)
        assert sch_res.json()["success"] is True

    def test_admin_marks_entry_and_results_publishing(self, admin_auth):
        """Admin Marks -> Bulk Entry -> Official Publication & Unpublish."""
        # 1. Bulk marks entry
        bulk_res = client.post("/api/v1/results/marks/bulk", headers=admin_auth["headers"], json={
            "class_id": "3R",
            "subject_id": "Theory of Computation",
            "semester": 5,
            "marks": [
                {"student_code": "308637", "roll_no": "3R71", "internal_marks": 28.0, "external_marks": 64.0, "total_marks": 92.0}
            ]
        })
        assert bulk_res.status_code == 200
        assert bulk_res.json()["success"] is True

        # 2. Publish results to students
        pub_res = client.post("/api/v1/results/publish", headers=admin_auth["headers"], json={
            "class_name": "3R",
            "semester": 5,
            "student_code": "308637",
            "reason": "Official Winter 2026 End-Semester Result Declaration"
        })
        assert pub_res.status_code == 200
        assert pub_res.json()["success"] is True

        # 3. Unpublish results (administrative hold)
        unpub_res = client.post("/api/v1/results/unpublish", headers=admin_auth["headers"], json={
            "class_name": "3R",
            "semester": 5,
            "student_code": "308637",
            "reason": "Administrative re-verification hold"
        })
        assert unpub_res.status_code == 200
        assert unpub_res.json()["success"] is True

    def test_admin_fees_ledger_and_documents(self, admin_auth):
        """Admin Fees -> Full Institutional Ledger Export & Invoices."""
        ledger_res = client.get("/api/v1/fees/export", headers=admin_auth["headers"])
        assert ledger_res.status_code == 200
        if "text/csv" in ledger_res.headers.get("content-type", ""):
            assert len(ledger_res.content) > 0
        else:
            assert ledger_res.json()["success"] is True

        doc_res = client.get("/api/v1/documents", headers=admin_auth["headers"])
        assert doc_res.status_code == 200
        assert doc_res.json()["success"] is True

    def test_admin_notifications_broadcast(self, admin_auth):
        """Admin Notifications -> Institutional Campus Broadcast."""
        bc_res = client.post("/api/v1/notifications/broadcast", headers=admin_auth["headers"], json={
            "title": "Annual Autonomous Academic Council Meeting Announcement",
            "message": "All faculty and student representatives are requested to take note of the schedule.",
            "target_roles": ["student", "teacher"],
            "priority": "HIGH",
            "category": "academic"
        })
        assert bc_res.status_code in (200, 201)
        assert bc_res.json()["success"] is True

    def test_admin_reports_rbac_and_audit_trail(self, admin_auth):
        """Admin Reports -> Class & Faculty Reports, RBAC Matrix & Security Audit Trail."""
        rep_cls = client.get("/api/v1/admin/reports/classes", headers=admin_auth["headers"])
        assert rep_cls.status_code == 200
        assert rep_cls.json()["success"] is True

        rep_fac = client.get("/api/v1/admin/reports/faculty", headers=admin_auth["headers"])
        assert rep_fac.status_code == 200
        assert rep_fac.json()["success"] is True

        rbac_res = client.get("/api/v1/admin/rbac/matrix", headers=admin_auth["headers"])
        assert rbac_res.status_code == 200
        assert rbac_res.json()["success"] is True

        audit_res = client.get("/api/v1/admin/audit/logs?limit=25", headers=admin_auth["headers"])
        assert audit_res.status_code == 200
        assert audit_res.json()["success"] is True
        logs = audit_res.json()["data"]
        assert isinstance(logs, list)


# ==============================================================================
# 4. FRONTEND UI INTEGRATION AUDIT
# ==============================================================================

class TestFrontendUIIntegration:
    """Verifies that all required UI hooks, DOM elements, and states exist in templates."""

    def test_student_ui_hooks(self):
        """Verifies Student Dashboard HTML has all required module hooks and templates."""
        path = os.path.join(FRONTEND_HTML_DIR, "student-dashboard.html")
        assert os.path.isfile(path), f"File not found: {path}"
        with open(path, "r", encoding="utf-8") as f:
            html = f.read()

        soup = BeautifulSoup(html, "html.parser")

        # Required student module panes
        required_modules = [
            "timetable", "attendance", "syllabus", "fees", "profile",
            "elearning", "change-info", "dwallet", "examination",
            "internal-marks", "notifications"
        ]
        for mod in required_modules:
            el = soup.find(attrs={"data-module": mod})
            assert el is not None, f"Missing data-module='{mod}' in student-dashboard.html"

        # Verify key DOM element IDs
        assert soup.find(id="topStudentName") is not None
        assert soup.find(id="overallAttendanceChart") is not None
        assert soup.find(id="timetableHorizontalGrid") is not None
        assert soup.find(id="topNotifBadge") is not None
        assert soup.find(id="logoutBtn") is not None

    def test_teacher_ui_hooks(self):
        """Verifies Teacher Dashboard & Quiz HTML has all required module hooks."""
        t_dash_path = os.path.join(FRONTEND_HTML_DIR, "teacher-dashboard.html")
        assert os.path.isfile(t_dash_path)
        with open(t_dash_path, "r", encoding="utf-8") as f:
            html = f.read()

        t_soup = BeautifulSoup(html, "html.parser")
        assert t_soup.find(id="dashboard-view") is not None
        assert t_soup.find(id="attendance-module") is not None
        assert t_soup.find(id="timetable-view") is not None
        assert t_soup.find(id="classes-view") is not None
        assert t_soup.find(id="students-view") is not None
        assert t_soup.find(id="profile-view") is not None
        assert t_soup.find(id="results-view") is not None

        # Verify teacher quiz interface
        t_quiz_path = os.path.join(FRONTEND_HTML_DIR, "teacher-quiz.html")
        assert os.path.isfile(t_quiz_path)
        with open(t_quiz_path, "r", encoding="utf-8") as f:
            q_html = f.read()

        q_soup = BeautifulSoup(q_html, "html.parser")
        assert q_soup.find(id="sec-quizzes") is not None
        assert q_soup.find(id="sec-analytics") is not None
        assert q_soup.find(id="sec-results") is not None
        assert q_soup.find(id="sec-question-bank") is not None

    def test_admin_ui_hooks(self):
        """Verifies Admin Dashboard HTML has all required administrative tabs and tables."""
        a_dash_path = os.path.join(FRONTEND_HTML_DIR, "admin-dashboard.html")
        assert os.path.isfile(a_dash_path)
        with open(a_dash_path, "r", encoding="utf-8") as f:
            html = f.read()

        a_soup = BeautifulSoup(html, "html.parser")
        required_tabs = [
            "tab-overview", "tab-faculty", "tab-students", "tab-classes",
            "tab-leaves", "tab-attendance", "tab-reports", "tab-rbac", "tab-audit"
        ]
        for tab in required_tabs:
            assert a_soup.find(id=tab) is not None, f"Missing tab #{tab} in admin-dashboard.html"

        # Verify action buttons and KPIs
        assert a_soup.find(id="kpiStudents") is not None
        assert a_soup.find(id="kpiFaculty") is not None
        assert a_soup.find(id="facultyTableBody") is not None
        assert a_soup.find(id="studentsTableBody") is not None
        assert a_soup.find(id="classesReportTbody") is not None


# ==============================================================================
# 5. LIFECYCLE & STATE INTEGRATION AUDIT
# ==============================================================================

class TestLifecycleAndStateTransitions:
    """Verifies Loading, Empty, Error, Success, Refresh, and Logout/Re-login states."""

    def test_unauthenticated_access_state(self):
        """Unauthenticated requests to protected endpoints return standard error."""
        res = client.get("/api/v1/auth/me")
        assert res.status_code == 401
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] == "UNAUTHORIZED"

    def test_not_found_error_state(self):
        """Non-existent entities return structured 404 error response."""
        res = client.get(f"/api/v1/quizzes/non-existent-quiz-{uuid.uuid4().hex}")
        assert res.status_code == 404
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] == "NOT_FOUND"

    def test_validation_error_state(self):
        """Malformed payloads return standard 422 VALIDATION_ERROR response."""
        res = client.post("/api/v1/auth/login", json={"invalid": "payload"})
        assert res.status_code == 422
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] == "VALIDATION_ERROR"

    def test_logout_and_relogin_flow(self, student_auth):
        """Logout revokes token on server; re-login issues fresh token."""
        token = student_auth["token"]
        headers = student_auth["headers"]

        # 1. Verify token works
        check1 = client.get("/api/v1/auth/me", headers=headers)
        assert check1.status_code == 200

        # 2. Logout terminates session
        logout_res = client.post("/api/v1/auth/logout", headers=headers)
        assert logout_res.status_code == 200
        assert logout_res.json()["success"] is True

        # 3. Revoked token is rejected
        check2 = client.get("/api/v1/auth/me", headers=headers)
        assert check2.status_code == 401

        # 4. Re-login works and restores fresh session
        relogin_res = client.post("/api/v1/auth/login", json={
            "user_id": "308637",
            "password": "ssgmce@123",
            "role": "student"
        })
        assert relogin_res.status_code == 200
        new_token = relogin_res.json()["data"]["access_token"]
        assert new_token != token

        check3 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
        assert check3.status_code == 200


# ==============================================================================
# MAIN TEST EXECUTION RUNNER
# ==============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("  SSGMCE COLLEGE ERP — COMPLETE END-TO-END INTEGRATION AUDIT")
    print("  Target Institution: Shri Sant Gajanan Maharaj College of Engineering")
    print("  Live Cloud Supabase: https://gftqvclenyplnuoocbwe.supabase.co")
    print("=" * 80)

    # Prepare fixtures
    s_auth = student_auth()
    t_auth = teacher_auth()
    a_auth = admin_auth()

    student_suite = TestStudentFlow()
    teacher_suite = TestTeacherFlow()
    admin_suite = TestAdminFlow()
    ui_suite = TestFrontendUIIntegration()
    lifecycle_suite = TestLifecycleAndStateTransitions()

    test_registry = [
        # STUDENT FLOW
        ("STUDENT: Login & Role Detection", lambda: student_suite.test_student_login_and_role_detection(s_auth)),
        ("STUDENT: Dashboard Overview", lambda: student_suite.test_student_dashboard_overview(s_auth)),
        ("STUDENT: Profile (SELECT, UPDATE, IDOR)", lambda: student_suite.test_student_profile(s_auth)),
        ("STUDENT: Attendance (DB & Subjects)", lambda: student_suite.test_student_attendance(s_auth)),
        ("STUDENT: Timetable & Scheduled Tests", lambda: student_suite.test_student_timetable(s_auth)),
        ("STUDENT: Syllabus & E-Learning", lambda: student_suite.test_student_syllabus(s_auth)),
        ("STUDENT: Quiz Lifecycle (Start, Answers, Security, Submit, Evaluation)", lambda: student_suite.test_student_quiz_and_attempt_lifecycle(s_auth)),
        ("STUDENT: Academic Records & Progression", lambda: student_suite.test_student_academic_records_and_results(s_auth)),
        ("STUDENT: Fees (Ledger, Online Payment, Receipts)", lambda: student_suite.test_student_fees(s_auth)),
        ("STUDENT: Documents & Certificate Verification", lambda: student_suite.test_student_documents_and_certificates(s_auth)),
        ("STUDENT: Notifications & Badges", lambda: student_suite.test_student_notifications(s_auth)),

        # TEACHER FLOW
        ("TEACHER: Login & Role Detection", lambda: teacher_suite.test_teacher_login_and_role_detection(t_auth)),
        ("TEACHER: Dashboard & Profile", lambda: teacher_suite.test_teacher_dashboard_and_profile(t_auth)),
        ("TEACHER: Assigned Classes & Student Roster", lambda: teacher_suite.test_teacher_assigned_classes_and_roster(t_auth)),
        ("TEACHER: Instructional Timetable", lambda: teacher_suite.test_teacher_timetable(t_auth)),
        ("TEACHER: Attendance (Roster, Draft, Submit, CSV Export)", lambda: teacher_suite.test_teacher_attendance_marking_and_export(t_auth)),
        ("TEACHER: Quiz (Question Bank, Create, Publish, Monitor, Leaderboard, Export)", lambda: teacher_suite.test_teacher_quiz_creation_publishing_and_monitoring(t_auth)),

        # ADMIN FLOW
        ("ADMIN: Login & Role Detection", lambda: admin_suite.test_admin_login_and_role_detection(a_auth)),
        ("ADMIN: Dashboard KPIs & System Health", lambda: admin_suite.test_admin_dashboard_and_stats(a_auth)),
        ("ADMIN: Master Student Directory", lambda: admin_suite.test_admin_students_directory(a_auth)),
        ("ADMIN: Master Faculty Directory", lambda: admin_suite.test_admin_teachers_directory(a_auth)),
        ("ADMIN: Classes & Subjects Roster", lambda: admin_suite.test_admin_classes_and_subjects(a_auth)),
        ("ADMIN: Attendance Lock & Governance", lambda: admin_suite.test_admin_attendance_lock_and_approval(a_auth)),
        ("ADMIN: Timetable Assessment Scheduling", lambda: admin_suite.test_admin_timetable_and_scheduled_tests(a_auth)),
        ("ADMIN: Bulk Marks Entry & Official Results Publication/Hold", lambda: admin_suite.test_admin_marks_entry_and_results_publishing(a_auth)),
        ("ADMIN: Institutional Fee Ledger & Document Records", lambda: admin_suite.test_admin_fees_ledger_and_documents(a_auth)),
        ("ADMIN: Institutional Notification Broadcast", lambda: admin_suite.test_admin_notifications_broadcast(a_auth)),
        ("ADMIN: Institutional Reports, RBAC Matrix & Security Audit Trail", lambda: admin_suite.test_admin_reports_rbac_and_audit_trail(a_auth)),

        # FRONTEND UI HOOKS
        ("UI INTEGRATION: Student Dashboard Template Hooks", lambda: ui_suite.test_student_ui_hooks()),
        ("UI INTEGRATION: Teacher Dashboard & Quiz Template Hooks", lambda: ui_suite.test_teacher_ui_hooks()),
        ("UI INTEGRATION: Admin Dashboard Template Hooks", lambda: ui_suite.test_admin_ui_hooks()),

        # LIFECYCLE & STATE TRANSITIONS
        ("LIFECYCLE STATE: Unauthenticated Access Error State (401)", lambda: lifecycle_suite.test_unauthenticated_access_state()),
        ("LIFECYCLE STATE: Not Found Entity Error State (404)", lambda: lifecycle_suite.test_not_found_error_state()),
        ("LIFECYCLE STATE: Validation Error State (422)", lambda: lifecycle_suite.test_validation_error_state()),
        ("LIFECYCLE STATE: Session Logout & Fresh Re-login State", lambda: lifecycle_suite.test_logout_and_relogin_flow(s_auth)),
    ]

    passed_count = 0
    failed_count = 0

    for name, test_func in test_registry:
        try:
            test_func()
            print(f" [PASS] {name}")
            passed_count += 1
        except Exception as exc:
            import traceback
            print(f" [FAIL] {name} -> {exc}")
            traceback.print_exc()
            failed_count += 1

    print("\n" + "=" * 80)
    print(f"FINAL AUDIT EXECUTION SUMMARY: {passed_count} PASSED, {failed_count} FAILED (TOTAL: {len(test_registry)})")
    print("=" * 80)

    if failed_count > 0:
        sys.exit(1)
    else:
        print("ALL END-TO-END INTEGRATION AUDIT TESTS PASSED WITH 100% SUCCESS!")

