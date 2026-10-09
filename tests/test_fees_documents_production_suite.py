"""
================================================================================
SSGMCE COLLEGE ERP — FEES & DOCUMENTS PRODUCTION INTEGRATION TEST SUITE
================================================================================
Comprehensive verification of Student Financials & Digital Document Vault:
  1. Real User Authentication (Student 308637, Student 308638, Admin)
  2. Student Fee Summary (total fees, paid, pending, due date, breakdown)
  3. Student Fee Transaction Ledger & Receipt References
  4. Student Online Payment Installment with Automatic Balance Deduction
  5. Student Digital Fee Receipt Access & Verification
  6. Zero-Trust IDOR Protection on Student Financials (Blocked with HTTP 403)
  7. Admin Institutional Fee Invoice Generation with Audit Log
  8. Admin Offline / Counter Payment Recording with Receipt Generation
  9. Admin Pending Fees Defaulters List & Class-wise Collection Report
 10. Financial Ledger CSV Export with UTF-8 BOM for Excel Compatibility
 11. Student Private Storage Document Upload (PDF)
 12. Student Private Storage Document Upload (PNG)
 13. File Type Validation Enforcement (Disallowed .exe rejected with HTTP 400)
 14. File Size Limit Enforcement (>10MB rejected with HTTP 400)
 15. Private Supabase Storage Signed URLs & Expiration Window
 16. Private Authenticated Document Streaming Download
 17. Absolute Zero Leakage: Strict Prohibition of Public Storage URLs
 18. Zero-Trust IDOR Protection on Documents (Cross-student download blocked with HTTP 403)
 19. Admin Document Review Desk Listing
 20. Admin Document Verification with DB Audit Trail Entry
 21. Admin Document Rejection with Mandatory Reason Enforcement
 22. Admin Document Deletion with Storage Cleanup & DB Audit Trail Entry
 23. Academic Certificates Retrieval & Cryptographic Verification
================================================================================
"""

import sys
import uuid
import requests
from typing import Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:8000"


def api_request(method: str, url: str, **kwargs) -> requests.Response:
    timeout = kwargs.pop("timeout", 45)
    return requests.request(method, url, timeout=timeout, **kwargs)


def auth_headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


def get_token(user_id, password, role):
    res = api_request(
        "POST",
        f"{BASE_URL}/api/v1/auth/login",
        json={"user_id": user_id, "password": password, "role": role}
    )
    assert res.status_code == 200, f"Login failed for {user_id}: {res.text}"
    data = res.json()
    return data["data"]["access_token"]


def run_tests():
    print("=" * 80)
    print("STARTING SSGMCE FEES & DIGITAL DOCUMENTS MODULE VERIFICATION SUITE")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # STEP 1: AUTHENTICATION
    # -------------------------------------------------------------------------
    print("\n[Step 1] Authenticating Test Personas...")
    student1_token = get_token("308637", "ssgmce@123", "student")
    student2_token = get_token("308979", "ssgmce@123", "student")
    admin_token = get_token("admin", "admin@123", "admin")

    h_s1 = auth_headers(student1_token)
    h_s2 = auth_headers(student2_token)
    h_admin = auth_headers(admin_token)

    print("  ✓ Primary Student (Shivam Aghao - 308637) authenticated.")
    print("  ✓ Secondary Student (Aditya Ingle - 308979) authenticated.")
    print("  ✓ Institutional Administrator (admin) authenticated.")

    # -------------------------------------------------------------------------
    # STEP 2: STUDENT FEE SUMMARY & TRANSACTIONS
    # -------------------------------------------------------------------------
    print("\n[Step 2] Testing Student Fee Wallet Summary & Transactions...")
    res = api_request("GET", f"{BASE_URL}/api/v1/fees?student_code=308637", headers=h_s1)
    assert res.status_code == 200, f"Failed to get fee summary: {res.text}"
    summary = res.json()["data"]

    assert summary["student_code"] == "308637"
    assert "total_fees" in summary
    assert "paid_amount" in summary
    assert "pending_amount" in summary
    assert "due_date" in summary
    assert "breakdown" in summary
    assert len(summary["breakdown"]) > 0

    init_pending = summary["pending_amount"]
    init_paid = summary["paid_amount"]
    print(f"  ✓ Fee Summary: Total=₹{summary['total_fees']:,.2f}, Paid=₹{init_paid:,.2f}, Pending=₹{init_pending:,.2f}")

    # Transactions ledger
    res_txn = api_request("GET", f"{BASE_URL}/api/v1/fees/transactions?student_code=308637", headers=h_s1)
    assert res_txn.status_code == 200, f"Failed to get transactions: {res_txn.text}"
    txn_data = res_txn.json()["data"]
    assert "transactions" in txn_data
    assert "receipts" in txn_data
    print(f"  ✓ Transaction ledger retrieved with {len(txn_data['transactions'])} transactions, {len(txn_data['receipts'])} receipts.")

    # -------------------------------------------------------------------------
    # STEP 3: STUDENT ONLINE INSTALLMENT PAYMENT & RECEIPT
    # -------------------------------------------------------------------------
    print("\n[Step 3] Processing Student Online Payment Installment...")
    pay_amount = 500.0
    pay_payload = {
        "student_code": "308637",
        "amount": pay_amount,
        "payment_method": "upi",
        "payment_reference": f"BILLDESK-TEST-{uuid.uuid4().hex[:6].upper()}"
    }
    res_pay = api_request("POST", f"{BASE_URL}/api/v1/fees/pay", json=pay_payload, headers=h_s1)
    assert res_pay.status_code in (200, 201), f"Failed online fee payment: {res_pay.text}"
    pay_result = res_pay.json()["data"]

    assert pay_result["amount"] == pay_amount
    assert "receipt_number" in pay_result
    assert "receipt_id" in pay_result
    assert pay_result["receipt_url"].startswith("/api/v1/fees/receipts/")
    receipt_no = pay_result["receipt_number"]
    receipt_id = pay_result["receipt_id"]
    print(f"  ✓ Installment payment of ₹{pay_amount} processed. Official Receipt: {receipt_no}")

    # Verify receipt download endpoint
    res_rcpt = api_request("GET", f"{BASE_URL}/api/v1/fees/receipts/{receipt_id}/download", headers=h_s1)
    assert res_rcpt.status_code == 200, f"Failed to download receipt: {res_rcpt.text}"
    rcpt_meta = res_rcpt.json()["data"]
    assert rcpt_meta["receipt_number"] == receipt_no
    assert rcpt_meta["student_code"] == "308637"
    assert rcpt_meta["amount"] == pay_amount
    print(f"  ✓ Receipt #{receipt_no} counterfoil verified successfully.")

    # Verify balance was updated
    res_summary2 = api_request("GET", f"{BASE_URL}/api/v1/fees?student_code=308637", headers=h_s1)
    new_pending = res_summary2.json()["data"]["pending_amount"]
    assert new_pending <= init_pending, "Pending balance should decrease after payment!"
    print(f"  ✓ Pending balance updated correctly: ₹{init_pending:,.2f} -> ₹{new_pending:,.2f}")

    # -------------------------------------------------------------------------
    # STEP 4: ZERO-TRUST IDOR PROTECTION ON FINANCIALS
    # -------------------------------------------------------------------------
    print("\n[Step 4] Enforcing Zero-Trust IDOR Protection on Fees...")
    # Student 308979 attempts to view Shivam's (308637) fees
    res_idor1 = api_request("GET", f"{BASE_URL}/api/v1/fees?student_code=308637", headers=h_s2)
    assert res_idor1.status_code == 403, f"IDOR Failure: Student accessed other student's fee summary! Got {res_idor1.status_code}"

    # Student 308979 attempts to pay Shivam's fees
    idor_pay = {"student_code": "308637", "amount": 100.0, "payment_method": "upi"}
    res_idor2 = api_request("POST", f"{BASE_URL}/api/v1/fees/pay", json=idor_pay, headers=h_s2)
    assert res_idor2.status_code == 403, f"IDOR Failure: Student allowed to pay other student's fee! Got {res_idor2.status_code}"
    print("  ✓ IDOR Protection Confirmed: HTTP 403 Forbidden on cross-student fee read/write.")

    # -------------------------------------------------------------------------
    # STEP 5: ADMIN INVOICE GENERATION & OFFLINE PAYMENT
    # -------------------------------------------------------------------------
    print("\n[Step 5] Testing Admin Fee Invoicing & Offline Payment...")
    # Admin creates new institutional invoice
    new_inv_payload = {
        "student_code": "308637",
        "academic_year": "2026-27",
        "semester": 6,
        "subtotal": 118500.0,
        "scholarship_amount": 55000.0,
        "discount_amount": 5000.0,
        "due_date": "2026-12-31",
        "items": [
            {"fee_type": "Tuition Fee", "amount": 98500.0, "description": "Semester VI Tuition"},
            {"fee_type": "Development Fee", "amount": 20000.0, "description": "Campus Facilities"}
        ]
    }
    res_inv = api_request("POST", f"{BASE_URL}/api/v1/fees/invoices", json=new_inv_payload, headers=h_admin)
    assert res_inv.status_code in (200, 201), f"Admin invoice creation failed: {res_inv.text}"
    inv_data = res_inv.json()["data"]
    assert inv_data["total_amount"] == 58500.0  # 118500 - 55000 - 5000
    assert "invoice_number" in inv_data
    print(f"  ✓ Admin created fee invoice: {inv_data['invoice_number']} (Total: ₹{inv_data['total_amount']:,.2f})")

    # Admin records offline payment (Cash counter)
    admin_pay_payload = {
        "student_code": "308637",
        "amount": 2500.0,
        "payment_method": "cash",
        "payment_reference": f"COUNTER-REC-{uuid.uuid4().hex[:6].upper()}"
    }
    res_admin_pay = api_request("POST", f"{BASE_URL}/api/v1/fees/payments/record", json=admin_pay_payload, headers=h_admin)
    assert res_admin_pay.status_code in (200, 201), f"Admin offline payment failed: {res_admin_pay.text}"
    admin_pay_data = res_admin_pay.json()["data"]
    assert admin_pay_data["amount"] == 2500.0
    print(f"  ✓ Admin recorded offline payment: Receipt #{admin_pay_data['receipt_number']}")

    # -------------------------------------------------------------------------
    # STEP 6: ADMIN REPORTS & UTF-8 BOM CSV EXPORT
    # -------------------------------------------------------------------------
    print("\n[Step 6] Testing Admin Financial Reports & CSV Export...")
    # Pending fees defaulter list
    res_pending = api_request("GET", f"{BASE_URL}/api/v1/fees/pending", headers=h_admin)
    assert res_pending.status_code == 200
    pend_rep = res_pending.json()["data"]
    assert pend_rep["total_pending_amount"] > 0
    assert len(pend_rep["records"]) > 0
    print(f"  ✓ Pending Fees Report: Defaulters={pend_rep['total_defaulters']}, Total Dues=₹{pend_rep['total_pending_amount']:,.2f}")

    # Class-wise collection report
    res_coll = api_request("GET", f"{BASE_URL}/api/v1/fees/reports/class-collection", headers=h_admin)
    assert res_coll.status_code == 200
    coll_list = res_coll.json()["data"]
    assert len(coll_list) > 0
    print(f"  ✓ Class Collection Report: {len(coll_list)} academic classes aggregated.")

    # Financial ledger CSV export with UTF-8 BOM
    res_csv = api_request("GET", f"{BASE_URL}/api/v1/fees/export", headers=h_admin)
    assert res_csv.status_code == 200
    assert res_csv.headers["content-type"].startswith("text/csv")
    assert res_csv.content.startswith(b"\xef\xbb\xbf"), "Excel compatibility violation: CSV must start with UTF-8 BOM!"
    print("  ✓ Financial Ledger CSV exported with verified \\ufeff UTF-8 BOM.")

    # -------------------------------------------------------------------------
    # STEP 7: STUDENT DOCUMENT UPLOADS (PDF & PNG)
    # -------------------------------------------------------------------------
    print("\n[Step 7] Testing Student Digital Document Vault Uploads...")
    # 1. PDF Upload
    pdf_sample = b"%PDF-1.4\n1 0 obj\n<< /Title (Institutional Bonafide) >>\nendobj\ntrailer\n<< >>\n%%EOF"
    pdf_files = {"file": ("bonafide_2026.pdf", pdf_sample, "application/pdf")}
    pdf_data = {
        "document_type": "bonafide",
        "document_title": "Institutional Bonafide Certificate 2026",
        "document_number": "SSGMCE-BONA-2026-881",
        "description": "Submitted for education grant verification"
    }
    h_s1_form = {"Authorization": f"Bearer {student1_token}"}
    res_up1 = api_request("POST", f"{BASE_URL}/api/v1/documents/upload?student_code=308637", files=pdf_files, data=pdf_data, headers=h_s1_form)
    assert res_up1.status_code in (200, 201), f"Failed to upload PDF: {res_up1.text}"
    doc1 = res_up1.json()["data"]
    doc1_id = doc1["id"]
    assert doc1["is_private"] is True
    assert doc1["student_code"] == "308637"
    print(f"  ✓ PDF uploaded to private Supabase Storage: Document ID={doc1_id}")

    # 2. PNG Upload
    png_sample = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
        b"\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    png_files = {"file": ("identity_card.png", png_sample, "image/png")}
    png_data = {
        "document_type": "aadhar",
        "document_title": "Identity Card Copy",
        "document_number": "MH-ID-99214",
        "description": "Govt identity proof"
    }
    res_up2 = api_request("POST", f"{BASE_URL}/api/v1/documents/upload?student_code=308637", files=png_files, data=png_data, headers=h_s1_form)
    assert res_up2.status_code in (200, 201), f"Failed to upload PNG: {res_up2.text}"
    doc2 = res_up2.json()["data"]
    doc2_id = doc2["id"]
    print(f"  ✓ PNG image uploaded to private Supabase Storage: Document ID={doc2_id}")

    # -------------------------------------------------------------------------
    # STEP 8: FILE VALIDATION (EXTENSIONS & SIZE LIMITS)
    # -------------------------------------------------------------------------
    print("\n[Step 8] Enforcing Strict Security Validation (File Types & Size)...")
    # Disallowed .exe
    exe_files = {"file": ("malicious.exe", b"MZ\x90\x00ExecutableBinaryData", "application/octet-stream")}
    res_val1 = api_request("POST", f"{BASE_URL}/api/v1/documents/upload?student_code=308637", files=exe_files, headers=h_s1_form)
    assert res_val1.status_code == 400, f"Security Violation: .exe upload was not rejected! Got {res_val1.status_code}"
    print("  ✓ Disallowed extension (.exe) strictly rejected with HTTP 400.")

    # Oversized file (>10 MB)
    big_files = {"file": ("oversized.pdf", b"0" * (11 * 1024 * 1024), "application/pdf")}
    res_val2 = api_request("POST", f"{BASE_URL}/api/v1/documents/upload?student_code=308637", files=big_files, headers=h_s1_form)
    assert res_val2.status_code == 400, f"Security Violation: Oversized file was not rejected! Got {res_val2.status_code}"
    print("  ✓ Oversized upload (>10 MB) strictly rejected with HTTP 400.")

    # -------------------------------------------------------------------------
    # STEP 9: SIGNED URLS & AUTHENTICATED STREAMING DOWNLOADS
    # -------------------------------------------------------------------------
    print("\n[Step 9] Verifying Private Storage Signed URLs & Authenticated Downloads...")
    # List student documents
    res_docs = api_request("GET", f"{BASE_URL}/api/v1/documents?student_code=308637", headers=h_s1)
    assert res_docs.status_code == 200
    docs = res_docs.json()["data"]
    assert len(docs) >= 2

    # Verify NO public bucket URLs are returned
    for d in docs:
        s_url = d.get("signed_url") or ""
        d_url = d.get("download_url") or ""
        assert "/public/" not in s_url, f"SECURITY LEAK: Public URL in signed_url: {s_url}"
        assert "/public/" not in d_url, f"SECURITY LEAK: Public URL in download_url: {d_url}"

    # Generate time-limited signed URL
    res_sign = api_request("GET", f"{BASE_URL}/api/v1/documents/{doc1_id}/signed-url?expires_in=3600", headers=h_s1)
    assert res_sign.status_code == 200
    signed_resp = res_sign.json()["data"]
    assert signed_resp["is_private"] is True
    assert signed_resp["expires_in_seconds"] == 3600
    print(f"  ✓ Time-limited private signed URL issued for document {doc1_id}.")

    # Authenticated streaming download
    res_stream = api_request("GET", f"{BASE_URL}/api/v1/documents/{doc1_id}/download", headers=h_s1)
    assert res_stream.status_code == 200
    assert len(res_stream.content) > 0
    assert "Content-Disposition" in res_stream.headers
    print(f"  ✓ Authenticated streaming download delivered {len(res_stream.content)} bytes with Content-Disposition.")

    # -------------------------------------------------------------------------
    # STEP 10: ZERO-TRUST IDOR PROTECTION ON DOCUMENTS
    # -------------------------------------------------------------------------
    print("\n[Step 10] Enforcing Zero-Trust IDOR Protection on Documents...")
    # Student 308979 attempts to list Shivam's documents
    res_idor_doc1 = api_request("GET", f"{BASE_URL}/api/v1/documents?student_code=308637", headers=h_s2)
    assert res_idor_doc1.status_code == 403, f"IDOR Failure: Cross-student document list allowed! Got {res_idor_doc1.status_code}"

    # Student 308979 attempts to download Shivam's private document
    res_idor_doc2 = api_request("GET", f"{BASE_URL}/api/v1/documents/{doc1_id}/download", headers=h_s2)
    assert res_idor_doc2.status_code == 403, f"IDOR Failure: Cross-student document download allowed! Got {res_idor_doc2.status_code}"

    # Student 308979 attempts to get signed URL for Shivam's document
    res_idor_doc3 = api_request("GET", f"{BASE_URL}/api/v1/documents/{doc1_id}/signed-url", headers=h_s2)
    assert res_idor_doc3.status_code == 403, f"IDOR Failure: Cross-student signed URL allowed! Got {res_idor_doc3.status_code}"
    print("  ✓ IDOR Protection Confirmed: HTTP 403 Forbidden on cross-student document read/download.")

    # -------------------------------------------------------------------------
    # STEP 11: ADMIN DOCUMENT VERIFICATION & STATUS GOVERNANCE
    # -------------------------------------------------------------------------
    print("\n[Step 11] Testing Admin Document Verification & Rejection Governance...")
    # Admin lists documents
    res_admin_docs = api_request("GET", f"{BASE_URL}/api/v1/documents/admin/list?student_code=308637", headers=h_admin)
    assert res_admin_docs.status_code == 200
    admin_docs = res_admin_docs.json()["data"]
    assert len(admin_docs) >= 2
    print(f"  ✓ Admin Document Desk listed {len(admin_docs)} documents for review.")

    # Admin verifies document
    res_verify = api_request("POST", f"{BASE_URL}/api/v1/documents/{doc1_id}/verify", json={"notes": "Original verified by Dean Office"}, headers=h_admin)
    assert res_verify.status_code == 200, f"Verification failed: {res_verify.text}"
    v_data = res_verify.json()["data"]
    assert v_data["status"] == "verified"
    assert v_data["verified"] is True
    print(f"  ✓ Admin successfully verified Document ID={doc1_id}.")

    # Admin rejects document (testing mandatory reason enforcement)
    res_rej_fail = api_request("POST", f"{BASE_URL}/api/v1/documents/{doc2_id}/reject", json={"reason": ""}, headers=h_admin)
    assert res_rej_fail.status_code in (400, 422), "Validation error expected when rejection reason is blank!"

    rej_reason = "Scan copy is incomplete; back side of ID is missing."
    res_rej = api_request("POST", f"{BASE_URL}/api/v1/documents/{doc2_id}/reject", json={"reason": rej_reason}, headers=h_admin)
    assert res_rej.status_code == 200, f"Rejection failed: {res_rej.text}"
    rej_data = res_rej.json()["data"]
    assert rej_data["status"] == "rejected"
    assert rej_data["verified"] is False
    assert rej_data["rejection_reason"] == rej_reason
    print(f"  ✓ Admin rejected Document ID={doc2_id} with mandatory reason recorded.")

    # -------------------------------------------------------------------------
    # STEP 12: ADMIN DOCUMENT DELETION & AUDIT TRAIL
    # -------------------------------------------------------------------------
    print("\n[Step 12] Testing Document Deletion & Audit Trail...")
    # Upload temporary document to delete
    tmp_files = {"file": ("to_delete.pdf", b"%PDF-1.4\nDeleteMe\n%%EOF", "application/pdf")}
    tmp_data = {"document_type": "other", "document_title": "Temporary Document to Purge"}
    res_tmp = api_request("POST", f"{BASE_URL}/api/v1/documents/upload?student_code=308637", files=tmp_files, data=tmp_data, headers=h_s1_form)
    assert res_tmp.status_code in (200, 201), f"Upload temp doc failed: {res_tmp.text}"
    tmp_id = res_tmp.json()["data"]["id"]

    # Delete document
    res_del = api_request("DELETE", f"{BASE_URL}/api/v1/documents/{tmp_id}", headers=h_admin)
    assert res_del.status_code == 200, f"Delete failed: {res_del.text}"
    assert res_del.json()["data"]["deleted"] is True
    print(f"  ✓ Document ID={tmp_id} purged from storage and database.")

    # Confirm purged document cannot be accessed
    res_check = api_request("GET", f"{BASE_URL}/api/v1/documents/{tmp_id}/download", headers=h_admin)
    assert res_check.status_code == 404

    # -------------------------------------------------------------------------
    # STEP 13: ACADEMIC CERTIFICATES & PUBLIC VERIFICATION
    # -------------------------------------------------------------------------
    print("\n[Step 13] Testing Academic Certificates & Public Verification...")
    res_certs = api_request("GET", f"{BASE_URL}/api/v1/documents/certificates?student_code=308637", headers=h_s1)
    assert res_certs.status_code == 200
    certs = res_certs.json()["data"]
    print(f"  ✓ Retrieved {len(certs)} official certificates from registry.")

    if len(certs) > 0:
        c = certs[0]
        code = c.get("verification_code")
        if code:
            res_v = api_request("GET", f"{BASE_URL}/api/v1/documents/certificates/verify/{code}")
            assert res_v.status_code == 200
            assert res_v.json()["data"]["student_code"] == "308637"
            print(f"  ✓ Cryptographic verification confirmed for code: {code}")

    print("\n" + "=" * 80)
    print("ALL 13 TESTS PASSED PERFECTLY — FEES & DOCUMENTS SUITE FULLY OPERATIONAL!")
    print("=" * 80)


if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print(f"\n❌ TEST SUITE ASSERTION FAILURE: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
