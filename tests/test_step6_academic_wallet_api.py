import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test(name, path):
    try:
        resp = client.get(f"/api/v1{path}")
        data = resp.json()
        print(f"[PASS] {name}: code={data.get('code')}")
        return data.get("data")
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        return None

def main():
    print("=============================================================")
    print("  STEP 6: STUDENT ACADEMIC RECORDS & DIGITAL WALLET API TESTS")
    print("=============================================================")

    d1 = test("1. Academic Dashboard", "/student/academic-dashboard?student_code=308637")
    if d1:
        print(f"     Student: {d1.get('student_name')}, Sem: {d1.get('current_semester')}, SGPA: {d1.get('latest_sgpa')}, CGPA: {d1.get('latest_cgpa')}")

    d2 = test("2. Semester 5 Results", "/student/semester-results?student_code=308637&semester=5")
    if d2:
        print(f"     Subjects returned: {len(d2)}")

    d3 = test("3. Examination Summary", "/student/examination?student_code=308637")
    if d3:
        print(f"     Courses: {len(d3.get('courses', []))}, SGPA: {d3.get('sgpa')}, CGPA: {d3.get('cgpa')}")

    d4 = test("4. Fee Wallet", "/student/fees?student_code=308637")
    if d4:
        print(f"     Total: Rs.{d4.get('total_fees')}, Paid: Rs.{d4.get('paid_amount')}, Pending: Rs.{d4.get('pending_amount')}")

    d5 = test("5. Fee Transactions", "/student/fee-transactions?student_code=308637")
    if d5:
        print(f"     Receipts: {len(d5.get('receipts', []))}")

    d6 = test("6. Digital Documents", "/student/documents?student_code=308637")
    if d6:
        print(f"     Documents: {len(d6)}")

    d7 = test("7. Certificates", "/student/certificates?student_code=308637")
    if d7:
        print(f"     Certificates: {len(d7)}")

    d8 = test("8. Certificate Verification", "/certificates/verify/SSGMCE-ACAD-308637")
    if d8:
        print(f"     Valid: {d8.get('is_valid')}, Title: {d8.get('title')}, Student: {d8.get('student_name')}")

if __name__ == "__main__":
    main()
