import json
import urllib.request
import sys

BASE_URL = "http://127.0.0.1:8000"

def get_token(student_code):
    url = f"{BASE_URL}/api/v1/auth/login"
    payload = json.dumps({"user_id": student_code, "username": student_code, "password": "password123", "role": "student"}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["access_token"]

def main():
    print("=" * 80)
    print("VERIFYING SPECIFICATION COMPLIANCE FOR FEE ONLINE PAYMENT PAGE")
    print("=" * 80)

    # 1. Student 312225E015 (Class 2R1)
    print("\n[Check 1] Querying student with active dues (312225E015 - Ghate Aakansha S)...")
    tok1 = get_token("312225E015")
    req1 = urllib.request.Request(f"{BASE_URL}/api/v1/fees?student_code=312225E015", headers={"Authorization": f"Bearer {tok1}"})
    with urllib.request.urlopen(req1) as resp:
        res1 = json.loads(resp.read().decode("utf-8"))["data"]

    s_hdr = res1.get("student_info_header", {})
    print(f"  ✓ Header Name: {s_hdr.get('name')}")
    print(f"  ✓ Header Session: {s_hdr.get('academic_session')}")
    print(f"  ✓ Header Semester: {s_hdr.get('semester')}")
    print(f"  ✓ Header Course Year / Class: {s_hdr.get('course_class')}")

    assert s_hdr.get("name") == "Ghate Aakansha S", "Header Name mismatch!"
    assert "2025" in s_hdr.get("academic_session", ""), "Header Session mismatch!"
    assert "III" in s_hdr.get("semester", ""), "Header Semester mismatch!"
    assert "2R1" in s_hdr.get("course_class", ""), "Header Course Year/Class mismatch!"

    cats1 = res1.get("payment_categories", [])
    cat_keys = [c["key"] for c in cats1]
    expected_keys = ["OUTSTANDING", "OTHER", "SOCIETY", "EXAM", "CURRENT_YEAR", "HOSTEL"]
    print(f"  ✓ Payment Categories Present: {cat_keys}")
    assert cat_keys == expected_keys, f"Category keys or order mismatch! Expected: {expected_keys}, got: {cat_keys}"

    cat_map = {c["key"]: c for c in cats1}
    print(f"  ✓ OUTSTANDING: {cat_map['OUTSTANDING']['display_name']} (Amt: {cat_map['OUTSTANDING']['amount']})")
    print(f"  ✓ OTHER:       {cat_map['OTHER']['display_name']} (Amt: {cat_map['OTHER']['amount']})")
    print(f"  ✓ SOCIETY:     {cat_map['SOCIETY']['display_name']} (Amt: {cat_map['SOCIETY']['amount']})")
    print(f"  ✓ EXAM:        {cat_map['EXAM']['display_name']} (Amt: {cat_map['EXAM']['amount']})")
    print(f"  ✓ CURRENT_YEAR:{cat_map['CURRENT_YEAR']['display_name']} (Amt: {cat_map['CURRENT_YEAR']['amount']})")
    print(f"  ✓ HOSTEL:      {cat_map['HOSTEL']['display_name']} (Amt: {cat_map['HOSTEL']['amount']})")

    assert cat_map['EXAM']['amount'] == 3000.0, "EXAM due calculation mismatch!"
    assert cat_map['SOCIETY']['amount'] == 2000.0, "SOCIETY due calculation mismatch!"
    assert cat_map['OTHER']['amount'] == 7000.0, "OTHER due calculation mismatch!"
    assert cat_map['CURRENT_YEAR']['amount'] > 0, "CURRENT_YEAR due calculation mismatch!"

    # 2. Student 308637 (Class 3R) - zero dues student
    print("\n[Check 2] Querying student with zero dues (308637 - Aghao Shivam Sanjay)...")
    tok2 = get_token("308637")
    req2 = urllib.request.Request(f"{BASE_URL}/api/v1/fees?student_code=308637", headers={"Authorization": f"Bearer {tok2}"})
    with urllib.request.urlopen(req2) as resp:
        res2 = json.loads(resp.read().decode("utf-8"))["data"]

    cats2 = res2.get("payment_categories", [])
    for c in cats2:
        print(f"  ✓ {c['key']}: {c['display_name']} -> {c['amount']}")
        assert c["amount"] == 0.0, f"Expected 0 due for {c['key']} but got {c['amount']}"

    # 3. Test Online Payment Transaction
    print("\n[Check 3] Testing Payment for specific category (EXAM)...")
    pay_payload = {
        "student_code": "312225E015",
        "amount": 500.0,
        "payment_method": "upi",
        "payment_reference": "BILLDESK-EXAM-TEST-001",
        "fee_head": "EXAM"
    }
    pay_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/fees/pay",
        data=json.dumps(pay_payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {tok1}"}
    )
    with urllib.request.urlopen(pay_req) as resp:
        pay_res = json.loads(resp.read().decode("utf-8"))
        assert pay_res["success"] is True, "Payment request failed!"
        pay_data = pay_res["data"]
        print(f"  ✓ Payment successful: Amount=₹{pay_data['amount']}, Receipt={pay_data['receipt_number']}")
        assert pay_data["amount"] == 500.0
        assert "receipt_number" in pay_data

    print("\n" + "=" * 80)
    print("ALL SPECIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 80)

if __name__ == "__main__":
    main()

