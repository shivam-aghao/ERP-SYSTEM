import urllib.request
import json

BASE = "http://localhost:8000/api/v1"

def test(name, url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"[PASS] {name}: code={data.get('code')}")
            return data.get("data")
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        return None

def main():
    print("=============================================================")
    print("  STEP 6: STUDENT ACADEMIC RECORDS & DIGITAL WALLET API TESTS")
    print("=============================================================")

    d1 = test("1. Academic Dashboard", f"{BASE}/student/academic-dashboard?student_code=308637")
    if d1:
        print(f"     Student: {d1.get('student_name')}, Sem: {d1.get('current_semester')}, SGPA: {d1.get('latest_sgpa')}, CGPA: {d1.get('latest_cgpa')}")

    d2 = test("2. Semester 5 Results", f"{BASE}/student/semester-results?student_code=308637&semester=5")
    if d2:
        print(f"     Subjects returned: {len(d2)}")

    d3 = test("3. Examination Summary", f"{BASE}/student/examination?student_code=308637")
    if d3:
        print(f"     Courses: {len(d3.get('courses', []))}, SGPA: {d3.get('sgpa')}, CGPA: {d3.get('cgpa')}")

    d4 = test("4. Fee Wallet", f"{BASE}/student/fees?student_code=308637")
    if d4:
        print(f"     Total: Rs.{d4.get('total_fees')}, Paid: Rs.{d4.get('paid_amount')}, Pending: Rs.{d4.get('pending_amount')}")

    d5 = test("5. Fee Transactions", f"{BASE}/student/fee-transactions?student_code=308637")
    if d5:
        print(f"     Receipts: {len(d5.get('receipts', []))}")

    d6 = test("6. Digital Documents", f"{BASE}/student/documents?student_code=308637")
    if d6:
        print(f"     Documents: {len(d6)}")

    d7 = test("7. Certificates", f"{BASE}/student/certificates?student_code=308637")
    if d7:
        print(f"     Certificates: {len(d7)}")

    d8 = test("8. Certificate Verification", f"{BASE}/certificates/verify/SSGMCE-ACAD-308637")
    if d8:
        print(f"     Valid: {d8.get('is_valid')}, Title: {d8.get('title')}, Student: {d8.get('student_name')}")

if __name__ == "__main__":
    main()

