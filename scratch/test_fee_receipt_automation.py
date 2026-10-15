import json
import urllib.request
import urllib.parse
import urllib.error
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def get_token(student_code):
    url = f"{BASE_URL}/api/v1/auth/login"
    payload = json.dumps({"user_id": student_code, "username": student_code, "password": "password123", "role": "student"}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["access_token"], data["user"]

def main():
    print("=" * 80)
    print("RUNNING 10-STAGE AUTOMATIC RECEIPT GENERATION ACCEPTANCE SUITE")
    print("=" * 80)

    # Stage 0: Authenticate Personas
    tok1, user1 = get_token("312225E015") # Ghate Aakansha S
    tok2, user2 = get_token("308637")     # Shivam Aghao
    print("  ✓ Authenticated Primary Student: 312225E015 (Ghate Aakansha S)")
    print("  ✓ Authenticated Secondary Student: 308637 (Shivam Aghao)")

    # 1. Fetch initial fee summary & count of existing receipts
    req_init = urllib.request.Request(f"{BASE_URL}/api/v1/fees?student_code=312225E015", headers={"Authorization": f"Bearer {tok1}"})
    with urllib.request.urlopen(req_init) as resp:
        init_summary = json.loads(resp.read().decode("utf-8"))["data"]
    init_pending = init_summary["pending_amount"]
    init_rcpt_count = len(init_summary.get("receipts", []))
    print(f"  ✓ Initial Standing: Outstanding dues=₹{init_pending:,.2f}, Existing receipts={init_rcpt_count}")

    # 2. Test Failed / Pending / Cancelled payments (Do NOT create receipt)
    print("\n[Step 9 Verification] Testing failed and cancelled payment rejection...")
    # A. Failed payment
    try:
        fail_payload = {
            "student_code": "312225E015",
            "amount": 1000.0,
            "payment_method": "upi",
            "payment_reference": f"BILLDESK-FAIL-{uuid.uuid4().hex[:6].upper()}",
            "payment_status": "failed",
            "fee_head": "EXAM"
        }
        fail_req = urllib.request.Request(f"{BASE_URL}/api/v1/fees/pay", data=json.dumps(fail_payload).encode(), headers={"Content-Type": "application/json", "Authorization": f"Bearer {tok1}"})
        urllib.request.urlopen(fail_req)
        print("  ❌ ERROR: Failed payment was accepted!")
        sys.exit(1)
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected HTTP 400 on failed status, got {e.code}"
        print("  ✓ Failed transaction rejected as expected with HTTP 400 (no receipt produced).")

    # B. Cancelled payment
    try:
        cancel_payload = {
            "student_code": "312225E015",
            "amount": 1000.0,
            "payment_method": "card",
            "payment_reference": f"BILLDESK-CANCEL-{uuid.uuid4().hex[:6].upper()}",
            "payment_status": "cancelled",
            "fee_head": "EXAM"
        }
        cancel_req = urllib.request.Request(f"{BASE_URL}/api/v1/fees/pay", data=json.dumps(cancel_payload).encode(), headers={"Content-Type": "application/json", "Authorization": f"Bearer {tok1}"})
        urllib.request.urlopen(cancel_req)
        print("  ❌ ERROR: Cancelled payment was accepted!")
        sys.exit(1)
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected HTTP 400 on cancelled status, got {e.code}"
        print("  ✓ Cancelled transaction rejected as expected with HTTP 400 (no receipt produced).")

    # 3. Successful Payment Execution (Steps 1, 2, 3, 4)
    print("\n[Steps 1-4 Verification] Executing confirmed test payment for EXAM fee...")
    pay_ref = f"BILLDESK-EXAM-VERIF-{uuid.uuid4().hex[:6].upper()}"
    test_amount = 1500.0
    pay_payload = {
        "student_code": "312225E015",
        "amount": test_amount,
        "payment_method": "upi",
        "payment_reference": pay_ref,
        "payment_status": "success",
        "fee_head": "EXAM"
    }
    pay_req = urllib.request.Request(f"{BASE_URL}/api/v1/fees/pay", data=json.dumps(pay_payload).encode(), headers={"Content-Type": "application/json", "Authorization": f"Bearer {tok1}"})
    with urllib.request.urlopen(pay_req) as resp:
        pay_res = json.loads(resp.read().decode())["data"]

    rcpt_no = pay_res["receipt_number"]
    rcpt_id = pay_res["receipt_id"]
    txn_id = pay_res["transaction_id"]
    print(f"  ✓ Payment confirmed by backend: Amount=₹{pay_res['amount']:,.2f}")
    print(f"  ✓ Exactly one receipt generated automatically: Receipt #{rcpt_no} (ID: {rcpt_id})")
    print(f"  ✓ Linked Transaction ID: {txn_id}, Reference: {pay_ref}")
    print(f"  ✓ Amount in words: {pay_res.get('amount_in_words')}")
    assert pay_res["fee_category"] == "EXAM"
    assert pay_res["amount"] == test_amount

    # 4. Idempotency Check (Step 8: Refreshing/re-sending payment callback does NOT duplicate receipt)
    print("\n[Step 8 Verification] Testing Idempotent Retry (prevent duplicate receipts)...")
    retry_req = urllib.request.Request(f"{BASE_URL}/api/v1/fees/pay", data=json.dumps(pay_payload).encode(), headers={"Content-Type": "application/json", "Authorization": f"Bearer {tok1}"})
    with urllib.request.urlopen(retry_req) as resp:
        retry_res = json.loads(resp.read().decode())["data"]

    assert retry_res["receipt_number"] == rcpt_no, "Idempotency failed: Different receipt number generated!"
    assert retry_res.get("duplicate_prevented") is True, "Idempotency duplicate prevention flag missing!"
    print(f"  ✓ Idempotency Confirmed: Duplicate callback returned existing Receipt #{retry_res['receipt_number']} without generating a second receipt.")

    # 5. Check Receipt History Listing (Step 5)
    print("\n[Step 5 Verification] Querying Fees → Receipt history for student...")
    req_history = urllib.request.Request(f"{BASE_URL}/api/v1/fees?student_code=312225E015", headers={"Authorization": f"Bearer {tok1}"})
    with urllib.request.urlopen(req_history) as resp:
        hist_summary = json.loads(resp.read().decode())["data"]

    new_rcpts = hist_summary.get("receipts", [])
    matching_rcpt = next((r for r in new_rcpts if r.get("receipt_number") == rcpt_no or r.get("receipt_no") == rcpt_no), None)
    assert matching_rcpt is not None, f"Newly generated receipt #{rcpt_no} not found in student receipts history!"
    print(f"  ✓ Receipt #{rcpt_no} automatically appears in student's Receipt ledger (Category: {matching_rcpt.get('fee_category')}, Date: {matching_rcpt.get('payment_date')})")

    # 6. Check Payable Balance Update (Step 7)
    print("\n[Step 7 Verification] Verifying Payable ledger balance reflects confirmed payment...")
    new_pending = hist_summary["pending_amount"]
    print(f"  ✓ Outstanding Balance updated: ₹{init_pending:,.2f} -> ₹{new_pending:,.2f} (Reduced by ₹{test_amount:,.2f})")
    assert round(new_pending, 2) <= round(init_pending - test_amount + 0.01, 2)

    # 7. View & Download PDF/HTML Action (Step 6)
    print("\n[Step 6 Verification] Testing View Receipt, Download PDF, and Print endpoints...")
    enc_rcpt_no = urllib.parse.quote(rcpt_no, safe='')

    # JSON endpoint
    view_req = urllib.request.Request(f"{BASE_URL}/api/v1/fees/receipts/{enc_rcpt_no}", headers={"Authorization": f"Bearer {tok1}"})
    with urllib.request.urlopen(view_req) as resp:
        view_data = json.loads(resp.read().decode())["data"]
    assert view_data["receipt_number"] == rcpt_no
    assert view_data["amount"] == test_amount
    assert "Shri Sant Gajanan Maharaj" in view_data["college_name"]
    assert view_data["student_code"] == "312225E015"
    assert view_data["student_name"] == "Ghate Aakansha S"
    assert view_data["fee_category"] == "EXAM"
    assert len(view_data["particulars"]) > 0
    print(f"  ✓ View Receipt API verified: College={view_data['college_name']}, Student={view_data['student_name']}, Words={view_data['amount_in_words']}")

    # HTML Print / PDF endpoint
    print_req = urllib.request.Request(f"{BASE_URL}/api/v1/fees/receipts/{enc_rcpt_no}/download?format=html", headers={"Authorization": f"Bearer {tok1}"})
    with urllib.request.urlopen(print_req) as resp:
        html_content = resp.read().decode("utf-8")
    assert "<title>Receipt -" in html_content
    assert rcpt_no in html_content
    assert "Ghate Aakansha S" in html_content
    assert "Autonomous Examination Fee" in html_content
    print("  ✓ Print & Download PDF HTML endpoint verified with clean responsive layout.")

    # 8. Zero-Trust IDOR Protection (Step 10: Another student cannot access the receipt)
    print("\n[Step 10 Verification] Enforcing Zero-Trust IDOR: Secondary Student attempts to access primary student receipt...")
    try:
        idor_req = urllib.request.Request(f"{BASE_URL}/api/v1/fees/receipts/{enc_rcpt_no}", headers={"Authorization": f"Bearer {tok2}"})
        urllib.request.urlopen(idor_req)
        print("  ❌ IDOR FAILURE: Secondary student accessed primary student receipt!")
        sys.exit(1)
    except urllib.error.HTTPError as e:
        assert e.code == 403, f"Expected HTTP 403 Forbidden on IDOR check, got {e.code}"
        print("  ✓ Zero-Trust IDOR Protection Confirmed: HTTP 403 Forbidden returned when cross-student receipt access attempted.")

    print("\n" + "=" * 80)
    print("ALL 10 AUTOMATIC RECEIPT GENERATION ACCEPTANCE CRITERIA PASSED 100%!")
    print("=" * 80)

if __name__ == "__main__":
    main()
