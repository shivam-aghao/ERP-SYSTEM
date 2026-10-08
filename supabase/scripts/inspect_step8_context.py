import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def main():
    token = get_supabase_token()
    
    # 1. Inspect teachers columns
    teachers = json.loads(run_query("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'teachers';
    """, token))
    print("Teachers columns:", [c['column_name'] for c in teachers])
    
    # 2. Inspect classes columns
    classes = json.loads(run_query("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'classes';
    """, token))
    print("Classes columns:", [c['column_name'] for c in classes])

    # 3. Inspect subjects columns
    subjects = json.loads(run_query("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'subjects';
    """, token))
    print("Subjects columns:", [c['column_name'] for c in subjects])

    # 4. Inspect attendance_sessions columns
    att = json.loads(run_query("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance_sessions';
    """, token))
    print("Attendance sessions columns:", [c['column_name'] for c in att])

    # 5. Check admins
    try:
        admins_cols = json.loads(run_query("""
            SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admins';
        """, token))
        print("Admins columns:", [c['column_name'] for c in admins_cols])
        sample_admins = json.loads(run_query("SELECT * FROM public.admins LIMIT 5;", token))
        print("Sample admins:", sample_admins)
    except Exception as e:
        print("Admins query error:", e)

    # Quizzes
    quiz_cols = json.loads(run_query("""
        SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes';
    """, token))
    print("Quizzes columns:", [c['column_name'] for c in quiz_cols])

if __name__ == '__main__':
    main()
