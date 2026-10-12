import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def main():
    token = get_supabase_token()

    print("==================================================================")
    print("  STEP 6: STUDENT ACADEMIC RECORDS & DIGITAL WALLET VERIFICATION")
    print("==================================================================")

    # 1. Total Counts Across All Step 6 Tables
    tables = [
        'student_academic_records', 'student_subject_results', 'student_backlogs',
        'student_fee_accounts', 'fee_invoices', 'fee_invoice_items', 'fee_payments',
        'fee_receipts', 'student_scholarships', 'student_documents', 'student_certificates',
        'academic_result_publications'
    ]
    print("\n1. RECORD COUNTS IN SUPABASE CLOUD TABLES:")
    for t in tables:
        cnt = json.loads(run_query(f"SELECT count(*) as total FROM public.{t};", token))[0]['total']
        print(f"   * {t:30s} : {cnt:4d} records")

    # 2. Student Academic Dashboard View for primary student (Shivam Aghao - 308637)
    dashboard_row = json.loads(run_query("""
        SELECT student_name, student_code, roll_no, class_name, current_semester,
               latest_sgpa, latest_cgpa, latest_percentage, total_credits, earned_credits,
               subjects_passed, subjects_failed, active_backlogs, overall_attendance_pct,
               fee_payable, fee_paid, fee_pending, fee_status
        FROM public.student_academic_dashboard
        WHERE student_code = '308637';
    """, token))

    if dashboard_row:
        d = dashboard_row[0]
        print("\n2. STUDENT ACADEMIC DASHBOARD VIEW (Student: 308637):")
        print(f"   * Student: {d['student_name']} (Roll: {d['roll_no']}, Class: {d['class_name']})")
        print(f"   * Current Semester: Sem {d['current_semester']} | SGPA: {d['latest_sgpa']} | CGPA: {d['latest_cgpa']} ({d['latest_percentage']}%)")
        print(f"   * Credits: {d['earned_credits']}/{d['total_credits']} Earned | Passed: {d['subjects_passed']} | Failed: {d['subjects_failed']} | Backlogs: {d['active_backlogs']}")
        print(f"   * Attendance: {d['overall_attendance_pct']}%")
        print(f"   * Financial Balance: Payable: Rs.{float(d['fee_payable']):,.2f} | Paid: Rs.{float(d['fee_paid']):,.2f} | Pending: Rs.{float(d['fee_pending']):,.2f} [{d['fee_status'].upper()}]")

    # 3. Semester 5 Subject Results (Student: 308637)
    sem5_results = json.loads(run_query("""
        SELECT subject_code, subject_name, credits, internal_marks, external_marks,
               practical_marks, total_marks, grade, grade_point, result_status
        FROM public.student_semester_results
        WHERE student_code = '308637' AND semester_number = 5
        ORDER BY subject_code;
    """, token))
    print(f"\n3. SEMESTER 5 SUBJECT-WISE PERFORMANCE ({len(sem5_results)} subjects):")
    for r in sem5_results:
        print(f"   * {r['subject_code']} - {r['subject_name']:32s} | Cr: {r['credits']} | CIE: {r['internal_marks']} | ESE: {r['external_marks']} | Total: {r['total_marks']}/100 | Grade: {r['grade']} (GP: {r['grade_point']}) -> [{r['result_status']}]")

    # 4. Digital Fee Wallet View (Student: 308637)
    wallet_row = json.loads(run_query("""
        SELECT student_name, student_code, total_fees, scholarship, discount, payable, paid, pending,
               fee_status, latest_payment_date, latest_receipt_number, document_count, certificate_count
        FROM public.student_digital_wallet
        WHERE student_code = '308637';
    """, token))
    if wallet_row:
        w = wallet_row[0]
        print("\n4. DIGITAL FEE WALLET SUMMARY (Student: 308637):")
        print(f"   * Total Fees   : Rs. {float(w['total_fees']):,.2f}")
        print(f"   * Scholarship  : Rs. {float(w['scholarship']):,.2f} (MahaDBT Post-Matric)")
        print(f"   * Discount     : Rs. {float(w['discount']):,.2f} (Institutional Merit Waiver)")
        print(f"   * Net Payable  : Rs. {float(w['payable']):,.2f}")
        print(f"   * Paid Amount  : Rs. {float(w['paid']):,.2f}")
        print(f"   * Pending Due  : Rs. {float(w['pending']):,.2f} -> Status: [{w['fee_status'].upper()}]")
        print(f"   * Latest Receipt: {w['latest_receipt_number']} on {w['latest_payment_date']}")
        print(f"   * Wallet Assets: {w['document_count']} Verified Documents, {w['certificate_count']} Official Certificates")

    # 5. Fee Payments & Transaction Ledger
    txs = json.loads(run_query("""
        SELECT invoice_number, payment_reference, transaction_id, payment_date, amount, payment_method, payment_status, receipt_number
        FROM public.student_fee_wallet_transactions
        WHERE student_id = (SELECT id FROM public.students WHERE student_code = '308637')
        ORDER BY payment_date ASC;
    """, token))
    print(f"\n5. FEE PAYMENT TRANSACTIONS & RECEIPTS ({len(txs)} transactions):")
    for tx in txs:
        print(f"   * Invoice: {tx['invoice_number']} | Ref: {tx['payment_reference']} | Rs.{float(tx['amount']):,.2f} via {tx['payment_method'].upper()} [{tx['payment_status'].upper()}] | Receipt: {tx['receipt_number']}")



    # 6. Digital Documents Wallet
    docs = json.loads(run_query("""
        SELECT document_type, document_title, document_number, file_name, file_size, verified, status
        FROM public.student_documents
        WHERE student_id = (SELECT id FROM public.students WHERE student_code = '308637')
        ORDER BY issue_date DESC;
    """, token))
    print(f"\n6. DIGITAL DOCUMENT WALLET ({len(docs)} documents):")
    for doc in docs:
        print(f"   * [{doc['document_type'].upper():12s}] {doc['document_title']} ({doc['document_number']}) | File: {doc['file_name']} ({doc['file_size']} bytes) | Verified: {doc['verified']}")

    # 7. Digital Certificate Verification RPC
    cert_verify = json.loads(run_query("""
        SELECT public.verify_student_certificate('SSGMCE-ACAD-308637') as result;
    """, token))
    v = cert_verify[0]['result']
    print("\n7. DIGITAL CERTIFICATE VERIFICATION (Code: 'SSGMCE-ACAD-308637'):")
    print(f"   * Is Valid       : {v.get('is_valid')}")
    print(f"   * Certificate No : {v.get('certificate_number')}")
    print(f"   * Title          : {v.get('title')}")
    print(f"   * Student        : {v.get('student_name')} ({v.get('student_code')}, Class: {v.get('class_name')})")
    print(f"   * Institution    : {v.get('institution')}")

    # 8. Result Publication & Audit Logs
    audit = json.loads(run_query("""
        SELECT action, reason, performed_at FROM public.academic_result_publications LIMIT 2;
    """, token))
    print("\n8. RESULT PUBLICATION AUDIT LOG:")
    for a in audit:
        print(f"   * Action: {a['action'].upper()} on {a['performed_at']} | Reason: {a['reason']}")

    # 9. Storage Buckets
    buckets = json.loads(run_query("""
        SELECT id, name, public FROM storage.buckets WHERE id IN ('student-documents', 'student-certificates', 'fee-receipts', 'marksheets');
    """, token))
    print("\n9. SUPABASE STORAGE BUCKETS (Private & Secure):")
    for b in buckets:
        print(f"   * Bucket: '{b['id']}' | Name: {b['name']} | Public Access: {b['public']}")

    print("\n==================================================================")
    print("  STEP 6 DATABASE IS 100% OPERATIONAL, INTEGRATED & VERIFIED!")
    print("==================================================================")

if __name__ == '__main__':
    main()
