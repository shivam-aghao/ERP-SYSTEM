import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
import uuid
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def main():
    token = get_supabase_token()
    print("Acquired Supabase token.")

    # 1. Fetch Students from Supabase
    stus_json = run_query("SELECT id, student_code, full_name, roll_no, class_name FROM public.students WHERE class_name = '3R' ORDER BY roll_no;", token)
    students = json.loads(stus_json)
    print(f"Found {len(students)} students in Class 3R for seeding Academic Records & Wallet.")

    if not students:
        print("Error: No students found in Class 3R.")
        return

    # Prepare batch SQL
    statements = []

    for idx, stu in enumerate(students):
        sid = stu['id']
        scode = stu['student_code']
        sname = stu['full_name'].replace("'", "''")
        roll = stu['roll_no'] or f"3R{idx+1}"

        # Semesters 1 to 4 (Historical Results)
        historical_sems = [
            (1, 24.0, 24.0, 8.45, 8.45, 81.2, 6, 6, 0),
            (2, 24.0, 24.0, 8.70, 8.58, 83.5, 6, 6, 0),
            (3, 26.0, 26.0, 9.05, 8.74, 86.8, 7, 7, 0),
            (4, 26.0, 26.0, 8.90, 8.78, 85.0, 7, 7, 0),
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
                ) ON CONFLICT (student_id, semester_number) DO UPDATE SET
                    sgpa = EXCLUDED.sgpa, cgpa = EXCLUDED.cgpa, result_published = true;
            """)

        # Semester 5 (Current / Recently Published)
        sem5_sar_id = str(uuid.uuid4())
        # Shivam Aghao (308637) or top scorers have stellar marks
        sem5_sgpa = 9.25 if scode == '308637' else round(8.0 + (idx % 15) * 0.12, 2)
        sem5_cgpa = round((8.78 * 4 + sem5_sgpa) / 5, 2)
        sem5_pct = round(sem5_sgpa * 9.5, 1)

        statements.append(f"""
            INSERT INTO public.student_academic_records (
                id, student_id, semester_number, enrollment_number, program_name, department_code,
                year_level, division, total_subjects, subjects_passed, subjects_failed,
                total_credits, earned_credits, sgpa, cgpa, percentage, result_status,
                result_published, result_published_at
            ) VALUES (
                '{sem5_sar_id}', '{sid}', 5, '{scode}', 'B.Tech in Computer Science & Engineering', 'CSE',
                3, 'R', 7, 7, 0,
                24.0, 24.0, {sem5_sgpa}, {sem5_cgpa}, {sem5_pct}, 'PASS',
                true, NOW() - INTERVAL '3 days'
            ) ON CONFLICT (student_id, semester_number) DO UPDATE SET
                sgpa = EXCLUDED.sgpa, cgpa = EXCLUDED.cgpa, result_published = true;
        """)

        # Semester 5 Subjects for each student
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
            ssr_id = str(uuid.uuid4())
            # Add minor individual variation based on student index
            v_offset = (idx % 5) - 2
            v_tot = max(50.0, min(98.0, tot_m + v_offset))
            statements.append(f"""
                INSERT INTO public.student_subject_results (
                    id, academic_record_id, student_id, semester_number, subject_code, subject_name,
                    internal_marks, external_marks, practical_marks, assignment_marks, total_marks,
                    maximum_marks, percentage, credits, grade, grade_point, result_status, attempt_number
                ) VALUES (
                    '{ssr_id}', (SELECT id FROM public.student_academic_records WHERE student_id = '{sid}' AND semester_number = 5 LIMIT 1),
                    '{sid}', 5, '{sc}', '{sn}',
                    {int_m}, {ext_m}, {prac_m}, {ass_m}, {v_tot},
                    {50.0 if prac_m > 0 else 100.0}, {round(v_tot / (50.0 if prac_m > 0 else 100.0) * 100, 1)},
                    {cr}, '{gr}', {gp}, 'PASS', 1
                ) ON CONFLICT (student_id, subject_code, semester_number, attempt_number) DO NOTHING;
            """)

        # Fee Account
        sfa_id = str(uuid.uuid4())
        tot_fee = 118500.00
        schol = 55000.00
        disc = 5000.00
        payable = tot_fee - schol - disc # 58500.00
        paid = 58500.00 if (idx % 4 != 0) else 45000.00
        pending = max(0.0, payable - paid)
        acc_status = 'paid' if pending == 0 else 'partially_paid'

        statements.append(f"""
            INSERT INTO public.student_fee_accounts (
                id, student_id, semester_number, total_fee, scholarship_amount, discount_amount,
                payable_amount, paid_amount, pending_amount, account_status
            ) VALUES (
                '{sfa_id}', '{sid}', 5, {tot_fee}, {schol}, {disc},
                {payable}, {paid}, {pending}, '{acc_status}'
            ) ON CONFLICT (student_id) DO UPDATE SET
                paid_amount = EXCLUDED.paid_amount, pending_amount = EXCLUDED.pending_amount,
                account_status = EXCLUDED.account_status;
        """)

        # Fee Invoices
        inv_id = str(uuid.uuid4())
        inv_no = f"INV-2026-3R-{scode}"
        statements.append(f"""
            INSERT INTO public.fee_invoices (
                id, student_id, fee_account_id, invoice_number, semester_number,
                subtotal, scholarship_amount, discount_amount, total_amount, paid_amount, pending_amount, status
            ) VALUES (
                '{inv_id}', '{sid}', (SELECT id FROM public.student_fee_accounts WHERE student_id = '{sid}' LIMIT 1),
                '{inv_no}', 5, {tot_fee}, {schol}, {disc}, {payable}, {paid}, {pending}, '{acc_status}'
            ) ON CONFLICT (invoice_number) DO NOTHING;
        """)

        # Invoice Breakdown Items
        items = [
            ("Tuition Fee", "Academic Instruction & Faculty Support", 85000.00),
            ("Development Fee", "Campus Infrastructure & Lab Modernization", 14500.00),
            ("Laboratory Fee", "High-Performance Computing & Network Labs", 8500.00),
            ("Library Fee", "Digital Journals, IEEE Access & Books", 4000.00),
            ("Examination Fee", "Semester University Examination & Evaluation", 3500.00),
            ("Gymkhana Fee", "Sports, Health & Cultural Facilities", 3000.00)
        ]
        for ftype, fdesc, famt in items:
            statements.append(f"""
                INSERT INTO public.fee_invoice_items (
                    id, invoice_id, fee_type, description, amount
                ) VALUES (
                    '{str(uuid.uuid4())}', (SELECT id FROM public.fee_invoices WHERE invoice_number = '{inv_no}' LIMIT 1),
                    '{ftype}', '{fdesc}', {famt}
                );
            """)

        # Fee Payments & Receipts
        pay_id1 = str(uuid.uuid4())
        pay_ref1 = f"PAY-2026-0715-{scode}"
        rcpt_no1 = f"RCPT-20260715-{scode}"
        statements.append(f"""
            INSERT INTO public.fee_payments (
                id, student_id, invoice_id, payment_reference, transaction_id,
                amount, payment_method, payment_gateway, payment_status, payment_date
            ) VALUES (
                '{pay_id1}', '{sid}', (SELECT id FROM public.fee_invoices WHERE invoice_number = '{inv_no}' LIMIT 1),
                '{pay_ref1}', 'TXN_UPI_{scode}_7812', 30000.00, 'upi', 'Razorpay', 'success', NOW() - INTERVAL '70 days'
            ) ON CONFLICT (payment_reference) DO NOTHING;

            INSERT INTO public.fee_receipts (
                id, payment_id, student_id, receipt_number, receipt_date, amount, document_url
            ) VALUES (
                '{str(uuid.uuid4())}', (SELECT id FROM public.fee_payments WHERE payment_reference = '{pay_ref1}' LIMIT 1),
                '{sid}', '{rcpt_no1}', NOW() - INTERVAL '70 days', 30000.00,
                '/documents/receipts/{rcpt_no1}.pdf'
            ) ON CONFLICT (receipt_number) DO NOTHING;
        """)

        if paid > 30000.00:
            pay_id2 = str(uuid.uuid4())
            pay_ref2 = f"PAY-2026-0901-{scode}"
            rcpt_no2 = f"RCPT-20260901-{scode}"
            p2_amt = paid - 30000.00
            statements.append(f"""
                INSERT INTO public.fee_payments (
                    id, student_id, invoice_id, payment_reference, transaction_id,
                    amount, payment_method, payment_gateway, payment_status, payment_date
                ) VALUES (
                    '{pay_id2}', '{sid}', (SELECT id FROM public.fee_invoices WHERE invoice_number = '{inv_no}' LIMIT 1),
                    '{pay_ref2}', 'TXN_NB_{scode}_9921', {p2_amt}, 'net_banking', 'HDFC Payment Gateway', 'success', NOW() - INTERVAL '20 days'
                ) ON CONFLICT (payment_reference) DO NOTHING;

                INSERT INTO public.fee_receipts (
                    id, payment_id, student_id, receipt_number, receipt_date, amount, document_url
                ) VALUES (
                    '{str(uuid.uuid4())}', (SELECT id FROM public.fee_payments WHERE payment_reference = '{pay_ref2}' LIMIT 1),
                    '{sid}', '{rcpt_no2}', NOW() - INTERVAL '20 days', {p2_amt},
                    '/documents/receipts/{rcpt_no2}.pdf'
                ) ON CONFLICT (receipt_number) DO NOTHING;
            """)

        # Scholarship
        statements.append(f"""
            INSERT INTO public.student_scholarships (
                id, student_id, scholarship_name, scholarship_type, provider, application_number, amount, status
            ) VALUES (
                '{str(uuid.uuid4())}', '{sid}', 'MahaDBT Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti',
                'Government Merit-cum-Means', 'Government of Maharashtra DTE', 'MDBT-2026-{scode}', 55000.00, 'approved'
            );
        """)

        # Digital Documents
        docs = [
            ("bonafide", "Official Bonafide Certificate", f"DOC-BON-2026-{scode}", f"Bonafide_{scode}.pdf"),
            ("marksheet", "Semester 4 Official Grade Sheet", f"DOC-MS-SEM4-{scode}", f"Marksheet_Sem4_{scode}.pdf"),
            ("marksheet", "Semester 3 Official Grade Sheet", f"DOC-MS-SEM3-{scode}", f"Marksheet_Sem3_{scode}.pdf"),
            ("admission_receipt", "Academic Admission Confirmation Receipt", f"DOC-ADM-2026-{scode}", f"Admission_Receipt_{scode}.pdf"),
            ("internship_certificate", "Industry Internship Completion Certificate", f"DOC-INT-2026-{scode}", f"Internship_Cert_{scode}.pdf")
        ]
        for dtype, dtitle, dnum, fname in docs:
            statements.append(f"""
                INSERT INTO public.student_documents (
                    id, student_id, document_type, document_title, description, file_path, file_name,
                    file_size, mime_type, document_number, issue_date, verified, status
                ) VALUES (
                    '{str(uuid.uuid4())}', '{sid}', '{dtype}', '{dtitle}', 'Official verified college record',
                    'student-documents/{sid}/{fname}', '{fname}', 245760, 'application/pdf', '{dnum}',
                    CURRENT_DATE - INTERVAL '15 days', true, 'active'
                );
            """)

        # Digital Certificates
        vcode1 = f"SSGMCE-ACAD-{scode}"
        cnum1 = f"CERT-ACAD-2026-{scode}"
        vcode2 = f"SSGMCE-TECH-{scode}"
        cnum2 = f"CERT-TECH-2026-{scode}"

        statements.append(f"""
            INSERT INTO public.student_certificates (
                id, student_id, certificate_type, certificate_number, title, issue_date, verification_code, status
            ) VALUES (
                '{str(uuid.uuid4())}', '{sid}', 'Academic Excellence', '{cnum1}',
                'Dean''s Merit List Academic Honor Roll 2025-26', CURRENT_DATE - INTERVAL '30 days',
                '{vcode1}', 'valid'
            ) ON CONFLICT (certificate_number) DO NOTHING;

            INSERT INTO public.student_certificates (
                id, student_id, certificate_type, certificate_number, title, issue_date, verification_code, status
            ) VALUES (
                '{str(uuid.uuid4())}', '{sid}', 'Technical Co-curricular', '{cnum2}',
                'National Level Hackathon & Project Symposium Merit Award', CURRENT_DATE - INTERVAL '45 days',
                '{vcode2}', 'valid'
            ) ON CONFLICT (certificate_number) DO NOTHING;
        """)

        # Audit Publication Log
        statements.append(f"""
            INSERT INTO public.academic_result_publications (
                id, academic_record_id, action, performed_by, previous_status, new_status, reason, performed_at
            ) VALUES (
                '{str(uuid.uuid4())}', (SELECT id FROM public.student_academic_records WHERE student_id = '{sid}' AND semester_number = 5 LIMIT 1),
                'published', 'a0000000-0000-0000-0000-000000000001', false, true,
                'Controller of Examinations Semester 5 Final Approval', NOW() - INTERVAL '3 days'
            );
        """)

    print(f"Generated {len(statements)} SQL statements for batch seeding.")

    # Execute in chunks of 50 statements
    chunk_size = 50
    for i in range(0, len(statements), chunk_size):
        chunk = statements[i:i+chunk_size]
        batch_sql = "\n".join(chunk)
        print(f"Executing batch {i//chunk_size + 1}/{(len(statements)-1)//chunk_size + 1} ({len(chunk)} statements)...")
        res = run_query(batch_sql, token)

    print("\nStep 6 Seeding Completed Successfully!")

if __name__ == '__main__':
    main()
