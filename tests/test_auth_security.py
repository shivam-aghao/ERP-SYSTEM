import os
import sys
import time
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.jwt_handler import create_access_token

client = TestClient(app)


def test_valid_student_login():
    """Verify student authentication returns signed JWT and student role."""
    payload = {
        "user_id": "308637",
        "password": "ssgmce@123",
        "role": "student"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["role"] == "student"
    assert "access_token" in body["data"]
    assert "refresh_token" in body["data"]
    assert body["data"]["user"]["identifier"] == "308637"
    assert body["data"]["redirect"] == "student-dashboard.html"


def test_valid_teacher_login():
    """Verify teacher authentication returns signed JWT and teacher role."""
    payload = {
        "user_id": "EMP-CSE-1001",
        "password": "teacher@123",
        "role": "teacher"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["role"] == "teacher"
    assert "access_token" in body["data"]
    assert "refresh_token" in body["data"]
    assert body["data"]["user"]["identifier"] == "EMP-CSE-1001"
    assert body["data"]["redirect"] == "teacher-dashboard.html"


def test_valid_admin_login():
    """Verify admin authentication returns signed JWT and admin role."""
    payload = {
        "user_id": "admin",
        "password": "admin@123",
        "role": "admin"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["role"] == "admin"
    assert "access_token" in body["data"]
    assert "refresh_token" in body["data"]
    assert body["data"]["redirect"] == "admin-dashboard.html"


def test_invalid_login_credentials():
    """Verify wrong credentials return 401 Unauthorized."""
    # Wrong password for existing user
    res1 = client.post("/api/v1/auth/login", json={
        "user_id": "308637",
        "password": "wrong_password_123"
    })
    assert res1.status_code == 401, f"Expected 401, got {res1.status_code}"

    # Non-existent user
    res2 = client.post("/api/v1/auth/login", json={
        "user_id": "non_existent_user_99999",
        "password": "some_password"
    })
    assert res2.status_code == 401, f"Expected 401, got {res2.status_code}"

    # Empty credentials
    res3 = client.post("/api/v1/auth/login", json={
        "user_id": "",
        "password": ""
    })
    assert res3.status_code in (400, 422)


def test_direct_access_without_token():
    """Verify direct API access to protected endpoints without Bearer token returns 401 Unauthorized."""
    # /auth/me requires token
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    # /auth/verify/student requires token
    res2 = client.get("/api/v1/auth/verify/student")
    assert res2.status_code == 401

    # /auth/verify/teacher requires token
    res3 = client.get("/api/v1/auth/verify/teacher")
    assert res3.status_code == 401

    # /auth/verify/admin requires token
    res4 = client.get("/api/v1/auth/verify/admin")
    assert res4.status_code == 401


def test_server_side_identity_verification_me():
    """Verify GET /api/v1/auth/me verifies identity from token claims."""
    # Student login
    login_res = client.post("/api/v1/auth/login", json={
        "user_id": "308637",
        "password": "ssgmce@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]

    # Call /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()["data"]
    assert me_data["role"] == "student"
    assert me_data["identifier"] == "308637"
    assert "permissions" in me_data


def test_student_cannot_access_teacher_or_admin_endpoints():
    """Verify Student token accessing teacher/admin verify endpoints receives 403 Forbidden."""
    login_res = client.post("/api/v1/auth/login", json={
        "user_id": "308637",
        "password": "ssgmce@123"
    })
    assert login_res.status_code == 200
    student_token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {student_token}"}

    # Student accessing student endpoint -> OK
    res_st = client.get("/api/v1/auth/verify/student", headers=headers)
    assert res_st.status_code == 200

    # Student accessing teacher endpoint -> 403 Forbidden
    res_teach = client.get("/api/v1/auth/verify/teacher", headers=headers)
    assert res_teach.status_code == 403, f"Expected 403, got {res_teach.status_code}"

    # Student accessing admin endpoint -> 403 Forbidden
    res_adm = client.get("/api/v1/auth/verify/admin", headers=headers)
    assert res_adm.status_code == 403, f"Expected 403, got {res_adm.status_code}"

    # Student accessing teacher management dashboard -> 403 Forbidden
    res_mgmt = client.get("/api/v1/management/teacher/dashboard", headers=headers)
    assert res_mgmt.status_code == 403, f"Expected 403, got {res_mgmt.status_code}"


def test_teacher_cannot_access_admin_endpoints():
    """Verify Teacher token accessing admin verify endpoints receives 403 Forbidden."""
    login_res = client.post("/api/v1/auth/login", json={
        "user_id": "EMP-CSE-1001",
        "password": "teacher@123"
    })
    assert login_res.status_code == 200
    teacher_token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {teacher_token}"}

    # Teacher accessing teacher endpoint -> OK
    res_teach = client.get("/api/v1/auth/verify/teacher", headers=headers)
    assert res_teach.status_code == 200

    # Teacher accessing admin endpoint -> 403 Forbidden
    res_adm = client.get("/api/v1/auth/verify/admin", headers=headers)
    assert res_adm.status_code == 403, f"Expected 403, got {res_adm.status_code}"


def test_admin_has_elevated_access():
    """Verify Admin token can access admin, teacher, and student endpoints."""
    login_res = client.post("/api/v1/auth/login", json={
        "user_id": "admin",
        "password": "admin@123"
    })
    assert login_res.status_code == 200
    admin_token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin accessing admin endpoint -> OK
    res_adm = client.get("/api/v1/auth/verify/admin", headers=headers)
    assert res_adm.status_code == 200

    # Admin accessing teacher endpoint -> OK (admin is allowed in require_teacher)
    res_teach = client.get("/api/v1/auth/verify/teacher", headers=headers)
    assert res_teach.status_code == 200


def test_token_refresh_workflow():
    """Verify refresh token can issue new access token and performs token rotation."""
    login_res = client.post("/api/v1/auth/login", json={
        "user_id": "308637",
        "password": "ssgmce@123"
    })
    assert login_res.status_code == 200
    refresh_token = login_res.json()["data"]["refresh_token"]

    # Request new access token using refresh token
    refresh_res = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_res.status_code == 200, f"Refresh failed: {refresh_res.text}"
    refresh_data = refresh_res.json()["data"]
    assert "access_token" in refresh_data
    assert "refresh_token" in refresh_data

    # Use the newly minted access token
    new_access_token = refresh_data["access_token"]
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_access_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["data"]["identifier"] == "308637"

    # Attempting to reuse the consumed old refresh token should be rejected (revoked / rotation check)
    reused_res = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert reused_res.status_code == 401, f"Expected 401 for reused refresh token, got {reused_res.status_code}"


def test_logout_and_revocation():
    """Verify logout revokes the access token so subsequent calls return 401."""
    login_res = client.post("/api/v1/auth/login", json={
        "user_id": "308637",
        "password": "ssgmce@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify token works before logout
    check_before = client.get("/api/v1/auth/me", headers=headers)
    assert check_before.status_code == 200

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200
    assert logout_res.json()["data"]["logged_out"] is True

    # Subsequent call with the same token must fail with 401
    check_after = client.get("/api/v1/auth/me", headers=headers)
    assert check_after.status_code == 401, f"Expected 401 after revocation, got {check_after.status_code}"


def test_expired_session_handling():
    """Verify an expired token is rejected with 401 Unauthorized."""
    # Create an artificially expired token (-10 minutes)
    expired_token = create_access_token(
        data={"sub": "308637", "user_id": "308637", "role": "student"},
        expires_delta=timedelta(minutes=-10)
    )

    headers = {"Authorization": f"Bearer {expired_token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401, f"Expected 401 for expired token, got {res.status_code}"
    detail = res.json().get("detail", "")
    assert "expired" in detail.lower()


def test_student_idor_protection():
    """Verify authenticated student cannot query or update other students' profiles."""
    login_res = client.post("/api/v1/auth/login", json={
        "user_id": "308637",
        "password": "ssgmce@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Student attempting to access student code 999999 -> 403 Forbidden
    res = client.get("/api/v1/student/profile?student_code=999999", headers=headers)
    assert res.status_code == 403, f"Expected 403 for student accessing another student's profile, got {res.status_code}"


if __name__ == "__main__":
    print("=" * 70)
    print("SSGMCE COLLEGE ERP — CENTRAL AUTHENTICATION & SECURITY TEST SUITE")
    print("=" * 70)

    tests = [
        ("Valid Student Login", test_valid_student_login),
        ("Valid Teacher Login", test_valid_teacher_login),
        ("Valid Admin Login", test_valid_admin_login),
        ("Invalid Login Credentials (401)", test_invalid_login_credentials),
        ("Direct Access Without Token (401)", test_direct_access_without_token),
        ("Server-Side Identity Verification /auth/me", test_server_side_identity_verification_me),
        ("Role Isolation: Student Cannot Access Teacher/Admin (403)", test_student_cannot_access_teacher_or_admin_endpoints),
        ("Role Isolation: Teacher Cannot Access Admin (403)", test_teacher_cannot_access_admin_endpoints),
        ("Admin Elevated Access Verification", test_admin_has_elevated_access),
        ("Token Refresh & Token Rotation", test_token_refresh_workflow),
        ("Logout & Server-Side Token Revocation", test_logout_and_revocation),
        ("Expired Session Handling (401)", test_expired_session_handling),
        ("IDOR Protection: Student Isolated from Other Students (403)", test_student_idor_protection),
    ]

    passed = 0
    failed = 0

    for name, test_fn in tests:
        try:
            test_fn()
            print(f" [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f" [FAIL] {name} -> {e}")
            failed += 1

    print("=" * 70)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED (TOTAL: {len(tests)})")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)
    else:
        print("ALL AUTHENTICATION SECURITY TESTS PASSED PERFECTLY!")

