import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def main():
    token = get_supabase_token()
    
    # 1. Check admins table
    admins = json.loads(run_query("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admins';
    """, token))
    print("Admins columns:", [c['column_name'] for c in admins])
    
    # 2. Check if auth.users exists or has rows
    try:
        auth_users = json.loads(run_query("""
            SELECT id, email FROM auth.users LIMIT 5;
        """, token))
        print("Auth users count sample:", len(auth_users))
    except Exception as e:
        print("Auth users query error:", e)

    # 3. Check sample student, teacher, admin IDs
    student_sample = json.loads(run_query("""
        SELECT id, student_code, full_name, class_id, class_name, division FROM public.students LIMIT 3;
    """, token))
    print("Student sample:", student_sample)

    teacher_sample = json.loads(run_query("""
        SELECT id, emp_code, full_name, department_id FROM public.teachers LIMIT 3;
    """, token))
    print("Teacher sample:", teacher_sample)

    # 4. Check if notifications table already exists
    notifs = json.loads(run_query("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE '%notif%';
    """, token))
    print("Existing notification tables:", [n['table_name'] for n in notifs])

if __name__ == '__main__':
    main()
