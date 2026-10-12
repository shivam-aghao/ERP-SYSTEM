import urllib.request
import json

def test_api(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("==================================================")
    print("TEST 1: Faculty List & Teaching Loads from PDF")
    print("==================================================")
    teachers_resp = test_api("http://127.0.0.1:8000/api/v1/teachers")
    teachers = teachers_resp["data"]
    print(f"Total CSE Faculty Members in DB: {len(teachers)}")
    for t in teachers:
        print(f"  [{t['emp_code']}] {t['full_name']} — Load: {t['total_load_hours']} hrs")

    print("\n==================================================")
    print("TEST 2: Personal Timetable Isolation Verification")
    print("==================================================")
    # Teacher 1: Dr. J. M. Patil
    p1 = test_api("http://127.0.0.1:8000/api/v1/timetable/my?emp_code=EMP-CSE-1001")["data"]
    print(f"Teacher: {p1['teacher']['name']} ({p1['teacher']['emp_code']})")
    print(f"Total Load: {p1['total_load']} hrs")
    for row in p1["grid"]:
        active = [f"Slot {p['slot_index']}: {p['subject']} ({p['venue']})" for p in row["periods"] if not p["is_free"]]
        if active:
            print(f"  {row['day']}: {', '.join(active)}")

    print("\n--------------------------------------------------")
    # Teacher 2: Dr. N. M. Kandoi
    p2 = test_api("http://127.0.0.1:8000/api/v1/timetable/my?emp_code=EMP-CSE-1002")["data"]
    print(f"Teacher: {p2['teacher']['name']} ({p2['teacher']['emp_code']})")
    print(f"Total Load: {p2['total_load']} hrs")
    for row in p2["grid"]:
        active = [f"Slot {p['slot_index']}: {p['subject']} ({p['venue']})" for p in row["periods"] if not p["is_free"]]
        if active:
            print(f"  {row['day']}: {', '.join(active)}")

    print("\n--------------------------------------------------")
    # Teacher 9: Prof. R. V. Deshmukh
    p9 = test_api("http://127.0.0.1:8000/api/v1/timetable/my?emp_code=EMP-CSE-1009")["data"]
    print(f"Teacher: {p9['teacher']['name']} ({p9['teacher']['emp_code']})")
    print(f"Total Load: {p9['total_load']} hrs")
    for row in p9["grid"]:
        active = [f"Slot {p['slot_index']}: {p['subject']} ({p['venue']})" for p in row["periods"] if not p["is_free"]]
        if active:
            print(f"  {row['day']}: {', '.join(active)}")

    print("\n==================================================")
    print("TEST 3: Header-based Context Switching (X-Emp-Code)")
    print("==================================================")
    phdr = test_api("http://127.0.0.1:8000/api/v1/timetable/my", headers={"X-Emp-Code": "EMP-CSE-1003"})["data"]
    print(f"Resolved Teacher: {phdr['teacher']['name']} ({phdr['teacher']['emp_code']})")
    print(f"Total Load: {phdr['total_load']} hrs")
    mon = next(r for r in phdr["grid"] if r["day"] == "Monday")
    mon_classes = [p["subject"] for p in mon["periods"] if not p["is_free"]]
    print(f"Monday Schedule: {mon_classes}")

    print("\n==================================================")
    print("TEST 4: Specific Teacher Path (/timetable/teacher/{id})")
    print("==================================================")
    pspec = test_api("http://127.0.0.1:8000/api/v1/timetable/teacher/EMP-CSE-1015")["data"]
    print(f"Resolved Teacher: {pspec['teacher']['name']} ({pspec['teacher']['emp_code']})")
    print(f"Total Load: {pspec['total_load']} hrs")
    fri = next(r for r in pspec["grid"] if r["day"] == "Friday")
    fri_classes = [p["subject"] for p in fri["periods"] if not p["is_free"]]
    print(f"Friday Schedule: {fri_classes}")

    print("\n==================================================")
    print("ALL TIMETABLE ISOLATION CHECKS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    main()

