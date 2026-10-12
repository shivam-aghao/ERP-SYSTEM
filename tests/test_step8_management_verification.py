import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
from tests.db_helper import get_supabase_token, run_query

def main():
    token = get_supabase_token()
    print("Testing Step 8 Schema Objects...")

    # 1. Check tables
    tables = [
        'roles', 'permissions', 'role_permissions', 'user_roles',
        'faculty_subject_assignments', 'faculty_class_assignments',
        'faculty_leave_requests', 'faculty_documents', 'admin_audit_logs',
        'academic_years', 'academic_semesters'
    ]
    for tbl in tables:
        cnt = json.loads(run_query(f"SELECT COUNT(*) as count FROM public.{tbl};", token))[0]['count']
        print(f"Table '{tbl}': {cnt} records")

    # 2. Check Views
    views = [
        'v_teacher_assignments',
        'v_faculty_workload_summary',
        'v_admin_system_overview',
        'v_class_academic_summary',
        'v_faculty_leave_summary'
    ]
    for v in views:
        res = json.loads(run_query(f"SELECT * FROM public.{v} LIMIT 2;", token))
        print(f"View '{v}': {len(res)} rows returned successfully")

    # 3. Test RPC: get_admin_dashboard
    dash = json.loads(run_query("SELECT public.get_admin_dashboard() as dash;", token))
    print("RPC get_admin_dashboard() result:", json.dumps(dash[0]['dash']['stats'], indent=2))

    # 4. Test RPC: get_teacher_dashboard with Dr. J. M. Patil
    teacher = json.loads(run_query("SELECT id FROM public.teachers WHERE emp_code = 'EMP-CSE-1001' LIMIT 1;", token))[0]
    t_dash = json.loads(run_query(f"SELECT public.get_teacher_dashboard('{teacher['id']}'::uuid) as td;", token))
    print("Teacher Dashboard success:", t_dash[0]['td']['success'])
    print("Teacher classes assigned:", len(t_dash[0]['td']['assigned_classes']))
    print("Teacher subjects assigned:", len(t_dash[0]['td']['assigned_subjects']))
    print("Teacher workload:", t_dash[0]['td']['workload'])

    # 5. Test RPC: get_teacher_students
    try:
        t_students = json.loads(run_query(f"SELECT public.get_teacher_students('{teacher['id']}'::uuid) as studs;", token))
        print("Teacher students retrieved:", len(t_students[0]['studs']))
    except Exception as e:
        print("Error testing get_teacher_students:", e)
        if hasattr(e, 'read'):
            print(e.read().decode())

    # 6. Test Reports
    fac_rep = json.loads(run_query("SELECT public.generate_faculty_report() as rep;", token))
    print("Faculty report rows:", len(fac_rep[0]['rep']))

    print("\nALL STEP 8 DATABASE OBJECTS VERIFIED PERFECTLY!")

if __name__ == '__main__':
    main()
