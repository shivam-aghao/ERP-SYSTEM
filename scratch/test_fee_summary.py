import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config.database import SessionLocal
from sqlalchemy import text
from datetime import datetime

db = SessionLocal()
try:
    test_codes = ['308637', '312225E015', '308979', '307001', '308393']
    for student_code in test_codes:
        print("="*60)
        print(f"Testing student: {student_code}")

        # 1. Resolve student
        q_stud = text("""
            SELECT s.id, s.student_code, s.full_name,
                   COALESCE(c.class_name, s.class_name, '3R') as class_name,
                   COALESCE(c.name, s.class_name, '3R') as class_full_name,
                   COALESCE(c.semester, 5) as semester,
                   COALESCE(c.year, 3) as year,
                   COALESCE(c.academic_year, '2025-26') as academic_year,
                   COALESCE(s.roll_no, '') as roll_no,
                   COALESCE(s.email, '') as email
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.student_code = :sc OR CAST(s.id AS TEXT) = :sc
            LIMIT 1
        """)
        row = db.execute(q_stud, {"sc": student_code}).fetchone()
        if not row:
            print(f"Student {student_code} not found")
            continue
        m = dict(row._mapping)
        student = {
            "id": str(m["id"]),
            "student_code": str(m["student_code"]),
            "full_name": str(m["full_name"]),
            "class_name": str(m["class_name"]),
            "class_full_name": str(m["class_full_name"]),
            "semester": int(m["semester"]),
            "year": int(m["year"]),
            "academic_year": str(m["academic_year"]),
            "roll_no": str(m["roll_no"])
        }
        print(f"Name: {student['full_name']}, Class: {student['class_name']}, Title: {student['class_full_name']}")

        # 2. Fee record
        rec = db.execute(text("""
            SELECT id, student_code, academic_year, semester,
                   tuition_fee, development_fee, exam_fee, gymkhana_fee,
                   total_fee, paid_amount, due_amount, status
            FROM fee_records
            WHERE student_code = :sc
            ORDER BY semester DESC
            LIMIT 1
        """), {"sc": student['student_code']}).fetchone()

        # 3. Receipts paid
        receipts_paid = 0.0
        r_sum = db.execute(text("""
            SELECT COALESCE(SUM(amount), 0.0)
            FROM fee_receipts
            WHERE (student_code = :sc OR CAST(id AS TEXT) = :sid)
              AND UPPER(status) IN ('SUCCESS', 'PAID', 'COMPLETED')
        """), {"sc": student['student_code'], "sid": student['id']}).fetchone()
        if r_sum and r_sum[0]:
            receipts_paid = float(r_sum[0])

        # 4. Fee structures lookup
        fs_row = db.execute(text("""
            SELECT id, class_name, academic_year, semester, total_fee, program_name, department_name
            FROM fee_structures
            WHERE (class_name = :cname OR semester = :sem) AND is_approved = 1
            ORDER BY CASE WHEN class_name = :cname THEN 0 ELSE 1 END, created_at DESC
            LIMIT 1
        """), {"cname": student['class_name'], "sem": student['semester']}).fetchone()

        p_rows = []
        if fs_row:
            p_rows = db.execute(text("""
                SELECT fee_head, amount, is_refundable, display_order
                FROM fee_structure_particulars
                WHERE fee_structure_id = :fs_id
                ORDER BY display_order ASC, amount DESC
            """), {"fs_id": fs_row[0]}).fetchall()

        rec_m = dict(rec._mapping) if rec else {}
        tot_fees = float(fs_row[4]) if fs_row else float(rec_m.get("total_fee") or 0.0)
        rec_paid = float(rec_m.get("paid_amount") or 0.0)
        tot_paid = max(rec_paid, receipts_paid)
        tot_pending = max(0.0, tot_fees - tot_paid)

        raw_ay = student["academic_year"]
        academic_year = f"{raw_ay[:4]}-20{raw_ay[5:]}" if len(raw_ay) == 7 and raw_ay[4] == "-" else raw_ay
        roman_map = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}
        semester_roman = roman_map.get(student["semester"], str(student["semester"]))

        title_caption = f"Payable ({student['class_full_name']} {academic_year}(SEMESTER {semester_roman}))"
        print(f"Title: {title_caption}")
        print(f"Total Fees: {tot_fees}, Paid: {tot_paid}, Pending: {tot_pending}")
        print(f"Particulars Count: {len(p_rows)}")
        for p in p_rows:
            is_struct = ("tuition" in p[0].lower() or "development" in p[0].lower())
            print(f"   [{'STRUCT' if is_struct else 'NON-STRUCT'}] {p[0]}: {p[1]}")
finally:
    db.close()

