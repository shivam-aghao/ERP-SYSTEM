import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    """Verify system health check endpoint."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("OK", "healthy")
    print("Health check OK:", data)

def test_auth_login_teacher():
    """Verify teacher authentication against Supabase PostgreSQL."""
    payload = {
        "email": "EMP-CSE-1001",
        "password": "teacher@123",
        "role": "teacher"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["role"] == "teacher"
    assert "token" in data["data"]
    print("Teacher Login OK:", data["data"]["user"]["name"])

def test_auth_login_student():
    """Verify student authentication against Supabase PostgreSQL."""
    payload = {
        "email": "308637",
        "password": "ssgmce@123",
        "role": "student"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["role"] == "student"
    assert "token" in data["data"]
    print("Student Login OK:", data["data"]["user"]["name"])

def test_master_data_endpoints():
    """Verify core classes, departments, subjects retrieval from Supabase."""
    # Classes
    res_classes = client.get("/api/v1/classes")
    assert res_classes.status_code == 200
    classes = res_classes.json().get("data", [])
    assert len(classes) >= 4
    class_names = [c["class_name"] for c in classes]
    assert "2R1" in class_names and "3R" in class_names
    print("Classes OK:", class_names)

    # Subjects
    res_subs = client.get("/api/v1/subjects")
    assert res_subs.status_code == 200
    subs = res_subs.json().get("data", [])
    assert len(subs) >= 15
    print(f"Subjects OK: {len(subs)} retrieved")

def test_student_portal_endpoints():
    """Verify student profile, academic metrics, and attendance."""
    res_prof = client.get("/api/v1/student/profile?student_code=308637")
    assert res_prof.status_code == 200
    prof = res_prof.json().get("data", {})
    assert prof.get("studentCode") == "308637" or prof.get("student_code") == "308637"
    print("Student Profile OK:", prof.get("fullName"))

    res_att = client.get("/api/v1/student/attendance?student_code=308637")
    assert res_att.status_code == 200
    print("Student Attendance OK")

def test_teacher_roster_endpoint():
    """Verify teacher class roster returns real student records from Supabase."""
    res_roster = client.get("/api/v1/teacher/class-roster?classId=2R1")
    assert res_roster.status_code == 200
    data = res_roster.json().get("data", {})
    students = data.get("students", [])
    assert len(students) > 0
    print(f"Teacher Roster for 2R1 OK: {len(students)} students loaded")

def test_quiz_portal_endpoints():
    """Verify quizzes list from Supabase."""
    res_q = client.get("/api/v1/quiz/quizzes")
    assert res_q.status_code == 200
    quizzes = res_q.json().get("data", [])
    assert len(quizzes) >= 3
    print(f"Quizzes OK: {len(quizzes)} retrieved")

def test_management_admin_dashboard():
    """Verify admin overview RPC endpoint."""
    res_adm = client.get("/api/v1/management/admin/dashboard")
    assert res_adm.status_code == 200
    data = res_adm.json()
    assert data["success"] is True
    print("Admin Management Dashboard OK")

def test_management_teacher_dashboard():
    """Verify teacher overview RPC endpoint."""
    res_tch = client.get("/api/v1/management/teacher/dashboard?emp_code=EMP-CSE-1001")
    assert res_tch.status_code == 200
    data = res_tch.json()
    assert data["success"] is True
    print("Teacher Management Dashboard OK")

if __name__ == "__main__":
    test_health_endpoint()
    test_auth_login_teacher()
    test_auth_login_student()
    test_master_data_endpoints()
    test_student_portal_endpoints()
    test_teacher_roster_endpoint()
    test_quiz_portal_endpoints()
    test_management_admin_dashboard()
    test_management_teacher_dashboard()
    print("ALL API ENDPOINT TESTS PASSED!")
