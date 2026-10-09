"""
Test Dynamic Attendance Integration & Static Value Removal
Validates:
1. /api/v1/attendance/student returns database-driven attendance metrics (85.19%)
2. /api/v1/students/overview returns authoritative attendance_pct and attendanceSummary
3. /api/v1/student/overview compat returns authoritative attendance_pct and attendanceSummary
4. Static 35.14% and static 82% are eradicated from HTML and JS source files
"""

import sys
import glob
import urllib.request
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:8000"


def test_student_attendance_api():
    url = f"{BASE_URL}/api/v1/attendance/student?student_code=308637"
    req = urllib.request.urlopen(url)
    assert req.status == 200
    res = json.loads(req.read().decode("utf-8"))
    assert res["success"] is True
    data = res["data"]
    
    assert data["student_code"] == "308637"
    assert data["overall_percentage"] == 85.19
    assert data["total_conducted"] == 81
    assert data["total_attended"] == 69
    assert data["absent_lectures"] == 12
    assert "subjects" in data
    assert "subjectWise" in data
    assert len(data["subjects"]) == 6
    
    # Check subject aliases
    first_sub = data["subjects"][0]
    assert "present" in first_sub
    assert "total" in first_sub
    assert "percentage" in first_sub
    assert "code" in first_sub
    print("✓ /api/v1/attendance/student returned valid dynamic data (85.19%)")


def test_student_overview_api():
    url = f"{BASE_URL}/api/v1/students/overview?student_code=308637"
    req = urllib.request.urlopen(url)
    assert req.status == 200
    res = json.loads(req.read().decode("utf-8"))
    assert res["success"] is True
    data = res["data"]
    
    assert data["attendance_pct"] == 85.19
    assert "attendanceSummary" in data
    summary = data["attendanceSummary"]
    assert summary["overallPercentage"] == 85.19
    assert summary["attendedLectures"] == 69
    assert summary["absentLectures"] == 12
    assert summary["totalLectures"] == 81
    assert len(summary["subjectWise"]) == 6
    print("✓ /api/v1/students/overview returned valid attendanceSummary (85.19%)")


def test_student_compat_overview_api():
    url = f"{BASE_URL}/api/v1/student/overview?student_code=308637"
    req = urllib.request.urlopen(url)
    assert req.status == 200
    res = json.loads(req.read().decode("utf-8"))
    assert res["success"] is True
    data = res["data"]
    
    assert data["attendance_pct"] == 85.19
    assert "attendanceSummary" in data
    print("✓ /api/v1/student/overview returned valid attendanceSummary (85.19%)")


def test_no_static_attendance_in_html_files():
    html_files = glob.glob("frontend/html/*.html")
    for f in html_files:
        with open(f, "r", encoding="utf-8") as fp:
            content = fp.read()
            assert "35.14%" not in content, f"Static 35.14% found in {f}"
            assert "82%" not in content, f"Static 82% found in {f}"
            assert "26 Periods" not in content, f"Static '26 Periods' found in {f}"
            assert "48 Periods" not in content, f"Static '48 Periods' found in {f}"
            assert "74 Periods" not in content, f"Static '74 Periods' found in {f}"
    print(f"✓ All {len(html_files)} HTML files are clean of static attendance artifacts")


def test_no_static_attendance_in_js_files():
    js_files = glob.glob("frontend/js/*.js")
    for f in js_files:
        with open(f, "r", encoding="utf-8") as fp:
            content = fp.read()
            assert "35.14" not in content, f"Static 35.14 found in {f}"
            assert "82%" not in content, f"Static 82% found in {f}"
    print(f"✓ All {len(js_files)} JS files are clean of static attendance fallbacks")


if __name__ == "__main__":
    test_student_attendance_api()
    test_student_overview_api()
    test_student_compat_overview_api()
    test_no_static_attendance_in_html_files()
    test_no_static_attendance_in_js_files()
    print("\nALL DYNAMIC ATTENDANCE TESTS PASSED (5/5)!")
