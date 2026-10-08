import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query


def main():
    token = get_supabase_token()
    
    # 1. Tables & Views
    tables = json.loads(run_query("""
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_type, table_name;
    """, token))
    print(f"Total objects in Supabase public: {len(tables)}")
    print("\n--- BASE TABLES ---")
    for t in tables:
        if t['table_type'] == 'BASE TABLE':
            print(f"  * {t['table_name']}")
    print("\n--- VIEWS ---")
    for t in tables:
        if t['table_type'] == 'VIEW':
            print(f"  * {t['table_name']}")

    # 2. Check key tables and columns (students, classes, subjects, attendance_sessions, attendance_records, student_attendance_subjects)
    key_tables = ['students', 'classes', 'subjects', 'attendance_sessions', 'attendance_records', 'student_attendance_subjects', 'departments', 'teachers', 'fee_records', 'fee_receipts', 'student_documents']
    print("\n--- KEY TABLES SCHEMA & COLUMNS ---")
    for kt in key_tables:
        cols = json.loads(run_query(f"""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = '{kt}'
            ORDER BY ordinal_position;
        """, token))
        if cols:
            print(f"\nTable '{kt}' ({len(cols)} columns):")
            for c in cols:
                print(f"    - {c['column_name']} ({c['data_type']}) {'NULL' if c['is_nullable']=='YES' else 'NOT NULL'}")
        else:
            print(f"\nTable '{kt}': DOES NOT EXIST in Supabase")

if __name__ == '__main__':
    main()
