import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
import uuid
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def main():
    token = get_supabase_token()
    
    # 1. Fetch remaining students without fee accounts
    stus_json = run_query("""
        SELECT id, student_code, full_name, roll_no, class_name 
        FROM public.students s 
        WHERE NOT EXISTS (SELECT 1 FROM public.student_fee_accounts sfa WHERE sfa.student_id = s.id) 
          AND s.class_name = '3R';
    """, token)
    remaining_students = json.loads(stus_json)
    print(f"Finishing seeding for {len(remaining_students)} remaining students...")

    statements = []
    for idx, stu in enumerate(remaining_students):
        sid = stu['id']
        scode = stu['student_code']
        roll = stu['roll_no'] or f"3R{74+idx}"

        # Semesters 1 to 4
        historical_sems = [
            (1, 24.0, 24.0, 8.40, 8.40, 80.5, 6, 6, 0),
            (2, 24.0, 24.0, 8.65, 8.52, 82.8, 6, 6, 0),
            (3, 26.0, 26.0, 8.95, 8.68, 85.2, 7, 7, 0),
            (4, 26.0, 26.0, 8.85, 8.72, 84.4, 7, 7, 0),
        ]
        for sem, tot_cr, earn_cr, sgpa, cgpa, pct, tot_sub, pass_sub, fail_sub in historical_sems:
            sar_id = str(uuid.uuid4())
            statements.append(f"""
                INSERT INTO public.student_academic_records (
                    id, student_id, semester_number, enrollment_number, program_name, department_code,
                    year_level, division, total_subjects, subjects_passed, subjects_failed,
                    total_credits, earned_credits, sgpa, cgpa, percentage, result_status,
                    result_published, result_published_at
                ) VALUES (
                    '{sar_id}', '{sid}', {sem}, '{scode}', 'B.Tech in Computer Science & Engineering', 'CSE',
                    {((sem-1)//2)+1}, 'R', {tot_sub}, {pass_sub}, {fail_sub},
                    {tot_cr}, {earn_cr}, {sgpa}, {cgpa}, {pct}, 'PASS',
                    true, NOW() - INTERVAL '{5 - sem} months'
                ) ON CONFLICT (student_id, semester_number) DO NOTHING;
            """)

        # Semester 5
        sem5_sar_id = str(uuid.uuid4())
        statements.append(f"""
            INSERT INTO public.student_academic_records (
                id, student_id, semester_number, enrollment_number, program_name, department_code,
                year_level, division, total_subjects, subjects_passed, subjects_failed,
                total_credits, earned_credits, sgpa, cgpa, percentage, result_status,
                result_published, result_published_at
            ) VALUES (
                '{sem5_sar_id}', '{sid}', 5, '{scode}', 'B.Tech in Computer Science & Engineering', 'CSE',
                3, 'R', 7, 7, 0,
                24.0, 24.0, 8.80, 8.74, 83.6, 'PASS',
                true, NOW() - INTERVAL '3 days'
            ) ON CONFLICT (student_id, semester_number) DO NOTHING;
        """)

        # Semester 5 Subjects
        sem5_subjects = [
            ('CS501', 'Database Management Systems', 4.0, 28.0, 58.0, 0.0, 0.0, 86.0, 'A+', 9.0),
            ('CS502', 'Theory of Computation', 4.0, 26.0, 54.0, 0.0, 0.0, 80.0, 'A', 8.0),
            ('CS503', 'Computer Networks', 4.0, 29.0, 61.0, 0.0, 0.0, 90.0, 'O', 10.0),
            ('CS504', 'Software Engineering', 3.0, 27.0, 55.0, 0.0, 0.0, 82.0, 'A', 8.0),
            ('CS505', 'Design & Analysis of Algorithms', 4.0, 25.0, 52.0, 0.0, 0.0, 77.0, 'B+', 7.0),
            ('CS506', 'Database Management Systems Lab', 1.5, 0.0, 0.0, 48.0, 0.0, 48.0, 'O', 10.0),
            ('CS507', 'Computer Networks Lab', 1.5, 0.0, 0.0, 46.0, 0.0, 46.0, 'O', 10.0)
        ]
        for sc, sn, cr, int_m, ext_m, prac_m, ass_m, tot_m, gr, gp in sem5_subjects:
            statements.append(f"""
                INSERT INTO public.student_subject_results (
                    id, academic_record_id, student_id, semester_number, subject_code, subject_name,
                    internal_marks, external_marks, practical_marks, assignment_marks, total_marks,
                    maximum_marks, percentage, credits, grade, grade_point, result_status, attempt_number
                ) VALUES (
                    '{str(uuid.uuid4())}', (SELECT id FROM public.student_academic_records WHERE student_id = '{sid}' AND semester_number = 5 LIMIT 1),
                    '{sid}', 5, '{sc}', '{sn}',
                    {int_m}, {ext_m}, {prac_m}, {ass_m}, {tot_m},
                    {50.0 if prac_m > 0 else 100.0}, {round(tot_m / (50.0 if prac_m > 0 else 100.0) * 100, 1)},
                    {cr}, '{gr}', {gp}, 'PASS', 1
                ) ON CONFLICT (student_id, subject_code, semester_number, attempt_number) DO NOTHING;
            """)

        # Fee Account
        sfa_id = str(uuid.uuid4())
        inv_no = f"INV-2026-3R-{scode}"
        pay_ref1 = f"PAY-2026-0715-{scode}"
        rcpt_no1 = f"RCPT-20260715-{scode}"
        pay_ref2 = f"PAY-2026-0901-{scode}"
        rcpt_no2 = f"RCPT-20260901-{scode}"

        statements.append(f"""
            INSERT INTO public.student_fee_accounts (
                id, student_id, semester_number, total_fee, scholarship_amount, discount_amount,
                payable_amount, paid_amount, pending_amount, account_status
            ) VALUES (
                '{sfa_id}', '{sid}', 5, 118500.00, 55000.00, 5000.00,
                58500.00, 58500.00, 0.00, 'paid'
            ) ON CONFLICT (student_id) DO NOTHING;

            INSERT INTO public.fee_invoices (
                id, student_id, fee_account_id, invoice_number, semester_number,
                subtotal, scholarship_amount, discount_amount, total_amount, paid_amount, pending_amount, status
            ) VALUES (
                '{str(uuid.uuid4())}', '{sid}', '{sfa_id}', '{inv_no}', 5,
                118500.00, 55000.00, 5000.00, 58500.00, 58500.00, 0.00, 'paid'
            ) ON CONFLICT (invoice_number) DO NOTHING;

            INSERT INTO public.fee_payments (
                id, student_id, invoice_id, payment_reference, transaction_id,
                amount, payment_method, payment_gateway, payment_status, payment_date
            ) VALUES (
                '{str(uuid.uuid4())}', '{sid}', (SELECT id FROM public.fee_invoices WHERE invoice_number = '{inv_no}' LIMIT 1),
                '{pay_ref1}', 'TXN_UPI_{scode}_7812', 30000.00, 'upi', 'Razorpay', 'success', NOW() - INTERVAL '70 days'
            ) ON CONFLICT (payment_reference) DO NOTHING;

            INSERT INTO public.fee_receipts (
                id, payment_id, student_id, receipt_number, receipt_date, amount, document_url
            ) VALUES (
                '{str(uuid.uuid4())}', (SELECT id FROM public.fee_payments WHERE payment_reference = '{pay_ref1}' LIMIT 1),
                '{sid}', '{rcpt_no1}', NOW() - INTERVAL '70 days', 30000.00,
                '/documents/receipts/{rcpt_no1}.pdf'
            ) ON CONFLICT (receipt_number) DO NOTHING;

            INSERT INTO public.fee_payments (
                id, student_id, invoice_id, payment_reference, transaction_id,
                amount, payment_method, payment_gateway, payment_status, payment_date
            ) VALUES (
                '{str(uuid.uuid4())}', '{sid}', (SELECT id FROM public.fee_invoices WHERE invoice_number = '{inv_no}' LIMIT 1),
                '{pay_ref2}', 'TXN_NB_{scode}_9921', 28500.00, 'net_banking', 'HDFC Payment Gateway', 'success', NOW() - INTERVAL '20 days'
            ) ON CONFLICT (payment_reference) DO NOTHING;

            INSERT INTO public.fee_receipts (
                id, payment_id, student_id, receipt_number, receipt_date, amount, document_url
            ) VALUES (
                '{str(uuid.uuid4())}', (SELECT id FROM public.fee_payments WHERE payment_reference = '{pay_ref2}' LIMIT 1),
                '{sid}', '{rcpt_no2}', NOW() - INTERVAL '20 days', 28500.00,
                '/documents/receipts/{rcpt_no2}.pdf'
            ) ON CONFLICT (receipt_number) DO NOTHING;

            INSERT INTO public.student_documents (
                id, student_id, document_type, document_title, description, file_path, file_name,
                file_size, mime_type, document_number, issue_date, verified, status
            ) VALUES (
                '{str(uuid.uuid4())}', '{sid}', 'bonafide', 'Official Bonafide Certificate',
                'Official verified college record', 'student-documents/{sid}/Bonafide_{scode}.pdf',
                'Bonafide_{scode}.pdf', 245760, 'application/pdf', 'DOC-BON-2026-{scode}',
                CURRENT_DATE - INTERVAL '15 days', true, 'active'
            );

            INSERT INTO public.student_certificates (
                id, student_id, certificate_type, certificate_number, title, issue_date, verification_code, status
            ) VALUES (
                '{str(uuid.uuid4())}', '{sid}', 'Academic Excellence', 'CERT-ACAD-2026-{scode}',
                'Dean''s Merit List Academic Honor Roll 2025-26', CURRENT_DATE - INTERVAL '30 days',
                'SSGMCE-ACAD-{scode}', 'valid'
            ) ON CONFLICT (certificate_number) DO NOTHING;
        """)

    # 2. Add sample backlogs for testing ATKT workflow
    # Let's add a cleared backlog for roll 3R5 and 3R12 so backlogs view can be verified
    backlog_students = json.loads(run_query("SELECT id, student_code FROM public.students WHERE student_code IN ('308615', '312225D001');", token))
    for bs in backlog_students:
        statements.append(f"""
            INSERT INTO public.student_backlogs (
                id, student_id, subject_code, subject_name, semester_number, attempt_number, status, cleared_at
            ) VALUES (
                '{str(uuid.uuid4())}', '{bs['id']}', 'CS204', 'Data Structures & Algorithms',
                2, 2, 'cleared', NOW() - INTERVAL '6 months'
            );
        """)

    # Run remaining statements
    print(f"Executing {len(statements)} statements...")
    full_sql = "\n".join(statements)
    run_query(full_sql, token)
    print("Remaining records and backlogs seeded successfully!")

if __name__ == '__main__':
    main()
