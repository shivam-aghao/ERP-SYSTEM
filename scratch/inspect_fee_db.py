import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    for c_name in ['2R1', '3R', '4R', '1R1']:
        fs = db.execute(text('SELECT id, class_name, academic_year, semester, total_fee FROM fee_structures WHERE class_name = :c LIMIT 1'), {'c': c_name}).fetchone()
        if fs:
            parts = db.execute(text('SELECT fee_head, amount, is_refundable, display_order FROM fee_structure_particulars WHERE fee_structure_id = :id ORDER BY display_order ASC'), {'id': fs.id}).fetchall()
            print(f"=== Class {c_name} (Total: {fs.total_fee}) ===")
            struct_total = 0.0
            non_struct_total = 0.0
            for p in parts:
                is_struct = ('tuition' in p.fee_head.lower() or 'development' in p.fee_head.lower())
                cat = "STRUCT" if is_struct else "NON-STRUCT"
                if is_struct:
                    struct_total += p.amount
                else:
                    non_struct_total += p.amount
                print(f"  [{cat}] {p.fee_head}: {p.amount}")
            print(f"  Subtotal Structural: {struct_total}")
            print(f"  Subtotal Non-Structural: {non_struct_total}")
            print(f"  Net Total: {struct_total + non_struct_total} (matches fs.total_fee: {struct_total + non_struct_total == fs.total_fee})\n")
finally:
    db.close()

