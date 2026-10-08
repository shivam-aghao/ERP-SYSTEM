"""
================================================================================
SSGMCE COLLEGE ERP — STEP 8: TEACHER & ADMIN MANAGEMENT TEST SUITE
Automated Verification of API Endpoints & Role-Based Workflows
================================================================================
"""

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def make_request(endpoint: str, method: str = "GET", payload: dict = None):
    url = f"/api/v1/management{endpoint}"
    if method == "POST":
        resp = client.post(url, json=payload)
    elif method == "PUT":
        resp = client.put(url, json=payload)
    elif method == "DELETE":
        resp = client.delete(url)
    else:
        resp = client.get(url)
    try:
        return resp.json(), resp.status_code
    except Exception:
        return {"raw": resp.text}, resp.status_code

def test_step8_endpoints():
    print("=================================================================")
    print("SSGMCE COLLEGE ERP: STEP 8 MANAGEMENT API TEST SUITE")
    print("=================================================================\n")
    
    passed = 0
    total = 0

    # 1. Teacher Dashboard
    total += 1
    res, code = make_request("/teacher/dashboard?emp_code=EMP-CSE-1001")
    print(f"1. GET /teacher/dashboard -> Code: {code}")
    if code == 200 and res.get("success") and res.get("data", {}).get("teacher"):
        print(f"   [OK] Success! Teacher: {res['data']['teacher']['full_name']}")
        print(f"   [OK] Classes assigned: {len(res['data']['assigned_classes'])}, Subjects: {len(res['data']['assigned_subjects'])}")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 2. Teacher Classes
    total += 1
    res, code = make_request("/teacher/classes?emp_code=EMP-CSE-1001")
    print(f"\n2. GET /teacher/classes -> Code: {code}")
    if code == 200 and res.get("success") and len(res.get("data", [])) > 0:
        print(f"   [OK] Success! Classes: {[c['short_code'] for c in res['data']]}")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 3. Teacher Subjects
    total += 1
    res, code = make_request("/teacher/subjects?emp_code=EMP-CSE-1001")
    print(f"\n3. GET /teacher/subjects -> Code: {code}")
    if code == 200 and res.get("success") and len(res.get("data", [])) > 0:
        print(f"   [OK] Success! Subjects: {[s['code'] + ' (' + s['class_code'] + ')' for s in res['data']]}")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 4. Teacher Students (Assigned Class)
    total += 1
    res, code = make_request("/teacher/students?emp_code=EMP-CSE-1001")
    print(f"\n4. GET /teacher/students -> Code: {code}")
    if code == 200 and res.get("success") and len(res.get("data", [])) > 0:
        print(f"   [OK] Success! {len(res['data'])} students retrieved for assigned classes.")
        sample_stud = res['data'][0]
        print(f"   [OK] Sample: {sample_stud['roll_no']} - {sample_stud['full_name']} (Att: {sample_stud['attendance_percentage']}%)")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 5. Teacher Workload
    total += 1
    res, code = make_request("/teacher/workload?emp_code=EMP-CSE-1001")
    print(f"\n5. GET /teacher/workload -> Code: {code}")
    if code == 200 and res.get("success") and res.get("data"):
        w = res['data']
        print(f"   [OK] Success! Lectures: {w.get('weekly_lecture_hours')}h, Practicals: {w.get('weekly_practical_hours')}h, Total: {w.get('total_weekly_load_hours')}h")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 6. Apply Leave Request
    total += 1
    leave_payload = {
        "emp_code": "EMP-CSE-1001",
        "leave_type": "casual",
        "start_date": "2026-11-05",
        "end_date": "2026-11-06",
        "total_days": 2.0,
        "reason": "Family function in hometown"
    }
    res, code = make_request("/teacher/leave/apply", method="POST", payload=leave_payload)
    print(f"\n6. POST /teacher/leave/apply -> Code: {code}")
    new_leave_id = None
    if code == 200 and res.get("success") and res.get("data", {}).get("leave_id"):
        new_leave_id = res["data"]["leave_id"]
        print(f"   [OK] Success! Leave applied ID: {new_leave_id}")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 7. Teacher Leaves List
    total += 1
    res, code = make_request("/teacher/leaves?emp_code=EMP-CSE-1001")
    print(f"\n7. GET /teacher/leaves -> Code: {code}")
    if code == 200 and res.get("success") and len(res.get("data", [])) > 0:
        print(f"   [OK] Success! Found {len(res['data'])} leaves for teacher.")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 8. Teacher Documents
    total += 1
    res, code = make_request("/teacher/documents?emp_code=EMP-CSE-1001")
    print(f"\n8. GET /teacher/documents -> Code: {code}")
    if code == 200 and res.get("success") and len(res.get("data", [])) > 0:
        print(f"   [OK] Success! Found {len(res['data'])} verified documents.")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 9. Admin Dashboard
    total += 1
    res, code = make_request("/admin/dashboard")
    print(f"\n9. GET /admin/dashboard -> Code: {code}")
    if code == 200 and res.get("success") and res.get("data", {}).get("stats"):
        stats = res['data']['stats']
        print(f"   [OK] Success! Total Students: {stats['total_students']}, Faculty: {stats['total_faculty']}, Classes: {stats['total_classes']}")
        print(f"   [OK] Active Academic Year: {stats['active_academic_year']}, Pending Leaves: {stats['pending_leave_requests']}")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 10. Admin Review Leave (Approve)
    if new_leave_id:
        total += 1
        review_payload = {
            "leave_id": new_leave_id,
            "reviewed_by": "EMP-CSE-1001",
            "status": "approved",
            "remarks": "Approved by HOD"
        }
        res, code = make_request("/leave/review", method="POST", payload=review_payload)
        print(f"\n10. POST /leave/review (Approve) -> Code: {code}")
        if code == 200 and res.get("success") and res.get("data", {}).get("status") == "approved":
            print(f"   [OK] Success! Leave {new_leave_id} approved with remark.")
            passed += 1
        else:
            print(f"   [FAIL] Failed: {res}")

    # 11. Reports: Faculty
    total += 1
    res, code = make_request("/reports/faculty")
    print(f"\n11. GET /reports/faculty -> Code: {code}")
    if code == 200 and res.get("success") and len(res.get("data", [])) > 0:
        print(f"   [OK] Success! Generated report for {len(res['data'])} faculty members.")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 12. Reports: Classes
    total += 1
    res, code = make_request("/reports/classes")
    print(f"\n12. GET /reports/classes -> Code: {code}")
    if code == 200 and res.get("success") and len(res.get("data", [])) > 0:
        print(f"   [OK] Success! Generated report for {len(res['data'])} classes.")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 13. RBAC Matrix
    total += 1
    res, code = make_request("/rbac/matrix")
    print(f"\n13. GET /rbac/matrix -> Code: {code}")
    if code == 200 and res.get("success") and "roles" in res.get("data", {}):
        matrix = res['data']
        print(f"   [OK] Success! Roles: {len(matrix['roles'])}, Permissions: {len(matrix['permissions'])}, Mappings: {len(matrix['role_permissions'])}")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 14. Audit Logs
    total += 1
    res, code = make_request("/audit/logs")
    print(f"\n14. GET /audit/logs -> Code: {code}")
    if code == 200 and res.get("success"):
        print(f"   [OK] Success! Audit logs retrieved ({len(res.get('data', []))} records recorded).")
        passed += 1
    else:
        print(f"   [FAIL] Failed: {res}")

    # 15. Bulk Marks Entry with Valid Student & Boundary Protection
    total += 1
    # Get 3R class and DBMS subject from teacher subjects
    sub_res, _ = make_request("/teacher/subjects?emp_code=EMP-CSE-1001")
    stud_res, _ = make_request("/teacher/students?emp_code=EMP-CSE-1001")
    
    if sub_res.get("data") and stud_res.get("data"):
        sub = sub_res["data"][0]
        sample_stud = stud_res["data"][0]
        marks_payload = {
            "emp_code": "EMP-CSE-1001",
            "class_id": sub["class_id"],
            "subject_id": sub["subject_id"],
            "semester": 5,
            "marks": [
                {
                    "student_id": sample_stud["student_id"],
                    "internal_marks": 26,
                    "external_marks": 52,
                    "practical_marks": 0,
                    "maximum_marks": 100
                }
            ]
        }
        res, code = make_request("/teacher/marks/bulk", method="POST", payload=marks_payload)
        print(f"\n15. POST /teacher/marks/bulk -> Code: {code}")
        if code == 200 and res.get("success") and res.get("data", {}).get("processed_count") >= 1:
            print(f"   [OK] Success! Bulk marks entry validated and saved: {res['data']}")
            passed += 1
        else:
            print(f"   [FAIL] Failed: {res}")
    else:
        print("\n15. Skipped bulk marks test due to missing sub or stud data")

    print("\n" + "=" * 65)
    print(f"TEST RESULTS: {passed} / {total} TEST SUITES PASSED ({round(passed/total*100, 1)}%)")
    print("=" * 65)

    if passed == total:
        print("ALL STEP 8 MANAGEMENT TESTS PASSED PERFECTLY!\n")
    else:
        print("SOME TESTS FAILED - REVIEW LOGS ABOVE.\n")
        sys.exit(1)

if __name__ == '__main__':
    test_step8_endpoints()
