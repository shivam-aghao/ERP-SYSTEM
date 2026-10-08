import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_login_page():
    res = client.get("/login.html")
    assert res.status_code == 200
    assert "SSGMCE" in res.text
    print("login.html: 200 OK")

def test_student_dashboard_page():
    res = client.get("/student-dashboard.html")
    assert res.status_code == 200
    assert "Student" in res.text
    print("student-dashboard.html: 200 OK")

def test_teacher_dashboard_page():
    res = client.get("/teacher-dashboard.html")
    assert res.status_code == 200
    assert "Teacher" in res.text or "Faculty" in res.text
    print("teacher-dashboard.html: 200 OK")

def test_admin_dashboard_page():
    res = client.get("/admin-dashboard.html")
    assert res.status_code == 200
    assert "Admin" in res.text
    print("admin-dashboard.html: 200 OK")

def test_student_quiz_page():
    res = client.get("/student-quiz.html")
    assert res.status_code == 200
    assert "Quiz" in res.text or "Assessment" in res.text
    print("student-quiz.html: 200 OK")

def test_teacher_quiz_page():
    res = client.get("/teacher-quiz.html")
    assert res.status_code == 200
    assert "Quiz" in res.text
    print("teacher-quiz.html: 200 OK")

def test_teacher_attendance_pages():
    res1 = client.get("/teacher-attendance.html")
    assert res1.status_code == 200
    print("teacher-attendance.html: 200 OK")

    res2 = client.get("/teacher-attendance-roster.html")
    assert res2.status_code == 200
    print("teacher-attendance-roster.html: 200 OK")

def test_dashboard_redirects():
    """Verify alias URL redirects."""
    for path, expected_loc in [
        ("/student", "/student-dashboard.html"),
        ("/teacher", "/teacher-dashboard.html"),
        ("/attendance", "/teacher-dashboard.html#attendance"),
        ("/attendance/roster", "/teacher-dashboard.html#attendance/roster"),
        ("/teacher_dashboard.html", "/teacher-dashboard.html"),
        ("/student_dashboard.html", "/student-dashboard.html"),
        ("/admin_dashboard.html", "/admin-dashboard.html")
    ]:
        res = client.get(path, follow_redirects=False)
        assert res.status_code in (302, 307), f"{path} returned {res.status_code}"
        assert res.headers["location"] == expected_loc, f"{path} redirected to {res.headers['location']}"
        print(f"Redirect {path} -> {expected_loc}: OK")

if __name__ == "__main__":
    test_login_page()
    test_student_dashboard_page()
    test_teacher_dashboard_page()
    test_admin_dashboard_page()
    test_student_quiz_page()
    test_teacher_quiz_page()
    test_teacher_attendance_pages()
    test_dashboard_redirects()
    print("ALL FRONTEND ASSET TESTS PASSED!")
