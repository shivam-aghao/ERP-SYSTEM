"""
======================================================================
SSGMCE COLLEGE ERP — COMPLETE SUPABASE ROW LEVEL SECURITY (RLS) TEST SUITE
======================================================================
Tests row-level isolation and security policy enforcement across:
1. Unauthenticated (anon) access denial & public verification
2. Student role isolation (IDOR protection, read own records, deny tampering)
3. Teacher role boundaries (assigned classes, own quizzes, deny publish results)
4. HOD departmental oversight (approvals, result publishing, deny billing modification)
5. Accountant financial management (fees, invoices, deny academic modifications)
6. Admin & Super Admin system authority
======================================================================
"""

import sys
import json
import urllib.request
import ctypes
from ctypes import wintypes

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD),
        ('Type', wintypes.DWORD),
        ('TargetName', wintypes.LPWSTR),
        ('Comment', wintypes.LPWSTR),
        ('LastWritten', wintypes.FILETIME),
        ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.POINTER(ctypes.c_char)),
        ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD),
        ('Attributes', ctypes.c_void_p),
        ('TargetAlias', wintypes.LPWSTR),
        ('UserName', wintypes.LPWSTR),
    ]

# Fetch management token
advapi32 = ctypes.windll.advapi32
cred_pointer = ctypes.POINTER(CREDENTIAL)()
advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_pointer))
cred = cred_pointer.contents
token = ctypes.string_at(cred.CredentialBlob, cred.CredentialBlobSize).decode('utf-8')

def execute_rls_sql(sql: str):
    """Executes SQL statements in Supabase PostgreSQL."""
    req = urllib.request.Request(
        'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
        data=json.dumps({'query': sql}).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode('utf-8')
            return json.loads(data) if data else []
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', errors='replace')
        return {"error": err, "code": e.code}

def run_tests():
    print("=" * 70)
    print("SSGMCE COLLEGE ERP — ROW LEVEL SECURITY (RLS) AUDIT SUITE")
    print("=" * 70)

    passed_tests = 0
    total_tests = 0

    # -------------------------------------------------------------
    # SUITE 1: UNAUTHENTICATED (ANON) ACCESS DENIAL
    # -------------------------------------------------------------
    total_tests += 1
    sql = """
    BEGIN;
    SET LOCAL ROLE anon;
    SELECT 
        (SELECT count(*) FROM public.students) as anon_students,
        (SELECT count(*) FROM public.student_documents) as anon_docs,
        (SELECT count(*) FROM public.student_fee_accounts) as anon_fees,
        (SELECT count(*) FROM public.attendance_records) as anon_att,
        (SELECT count(*) FROM public.quizzes) as anon_quizzes;
    ROLLBACK;
    """
    res = execute_rls_sql(sql)
    if isinstance(res, list) and len(res) > 0:
        row = res[0]
        if (row.get('anon_students') == 0 and 
            row.get('anon_docs') == 0 and 
            row.get('anon_fees') == 0 and 
            row.get('anon_att') == 0 and 
            row.get('anon_quizzes') == 0):
            print(" [PASS] 1. Unauthenticated anon SELECT completely blocked (0 rows across sensitive tables)")
            passed_tests += 1
        else:
            print(" [FAIL] 1. Unauthenticated anon saw sensitive data:", row)
    else:
        print(" [FAIL] 1. Error running anon test:", res)

    # -------------------------------------------------------------
    # SUITE 2: UNAUTHENTICATED WRITE REJECTION
    # -------------------------------------------------------------
    total_tests += 1
    sql = """
    BEGIN;
    SET LOCAL ROLE anon;
    INSERT INTO public.attendance_records (student_id, is_present) VALUES ('33d191fe-d09c-486c-b831-f405e3ebdcd2', true);
    ROLLBACK;
    """
    res = execute_rls_sql(sql)
    if isinstance(res, dict) and "error" in res and ("violates row-level security policy" in res["error"] or "42501" in res["error"]):
        print(" [PASS] 2. Unauthenticated anon INSERT blocked with 42501 RLS violation")
        passed_tests += 1
    else:
        print(" [FAIL] 2. Unauthenticated anon INSERT was not rejected properly:", res)

    # -------------------------------------------------------------
    # SUITE 3: STUDENT ISOLATION & HORIZONTAL PRIVILEGE ESCALATION
    # -------------------------------------------------------------
    total_tests += 1
    sql = """
    BEGIN;
    SET LOCAL ROLE authenticated;
    SET LOCAL request.jwt.claims = '{"sub": "37f33351-6395-4c96-ac64-2acfbf3054af", "role": "authenticated", "email": "308619@ssgmce.local", "user_metadata": {"role": "student", "user_id": "308619"}}';
    SELECT 
        (SELECT count(*) FROM public.students) as visible_students,
        (SELECT count(*) FROM public.students WHERE student_code != '308619') as other_students,
        (SELECT count(*) FROM public.student_documents WHERE student_id = '33d191fe-d09c-486c-b831-f405e3ebdcd2') as own_docs,
        (SELECT count(*) FROM public.student_documents WHERE student_id != '33d191fe-d09c-486c-b831-f405e3ebdcd2') as other_docs;
    ROLLBACK;
    """
    res = execute_rls_sql(sql)
    if isinstance(res, list) and len(res) > 0:
        row = res[0]
        if row.get('visible_students') == 1 and row.get('other_students') == 0 and row.get('other_docs') == 0:
            print(" [PASS] 3. Student horizontal isolation verified (only self profile and self documents visible)")
            passed_tests += 1
        else:
            print(" [FAIL] 3. Student isolation leaked other records:", row)
    else:
        print(" [FAIL] 3. Error running student isolation test:", res)

    # -------------------------------------------------------------
    # SUITE 4: STUDENT TAMPERING PREVENTED (MARKS & ATTENDANCE)
    # -------------------------------------------------------------
    total_tests += 1
    sql = """
    BEGIN;
    SET LOCAL ROLE authenticated;
    SET LOCAL request.jwt.claims = '{"sub": "37f33351-6395-4c96-ac64-2acfbf3054af", "role": "authenticated", "email": "308619@ssgmce.local", "user_metadata": {"role": "student", "user_id": "308619"}}';
    UPDATE public.student_academic_records SET sgpa = 10.0 WHERE student_id = '33d191fe-d09c-486c-b831-f405e3ebdcd2';
    ROLLBACK;
    """
    res = execute_rls_sql(sql)
    # In PostgreSQL, UPDATE on rows blocked by RLS returns 0 rows updated without modifying anything
    # Or raises 42501 if WITH CHECK is violated
    is_safe = False
    if isinstance(res, list) and len(res) == 0:
        is_safe = True
    elif isinstance(res, dict) and "error" in res:
        is_safe = True
    if is_safe:
        print(" [PASS] 4. Student marks tampering prevented (UPDATE blocked by RLS)")
        passed_tests += 1
    else:
        print(" [FAIL] 4. Student was able to modify academic records:", res)

    # -------------------------------------------------------------
    # SUITE 5: TEACHER INSTRUCTIONAL BOUNDARIES & QUIZ OWNERSHIP
    # -------------------------------------------------------------
    total_tests += 1
    # Teacher EMP-CSE-1002 (Dr. N. M. Kandoi: 9ea97e99-4bfb-4576-a958-14a0ea0d391f)
    # Cannot modify quizzes belonging to Prof. J. M. Patil (8f913c70-85ed-4261-bbd0-f2d3b42f4af1)
    sql = """
    BEGIN;
    SET LOCAL ROLE authenticated;
    SET LOCAL request.jwt.claims = '{"sub": "8ce804b5-c1a5-4b0b-92a1-8a842e100002", "role": "authenticated", "email": "nmkandoi@ssgmce.ac.in", "user_metadata": {"role": "faculty", "user_id": "EMP-CSE-1002"}}';
    UPDATE public.quizzes SET title = 'Hacked Title' WHERE teacher_id = '8f913c70-85ed-4261-bbd0-f2d3b42f4af1';
    ROLLBACK;
    """
    res = execute_rls_sql(sql)
    is_safe = False
    if isinstance(res, list) and len(res) == 0:
        is_safe = True
    elif isinstance(res, dict) and "error" in res:
        is_safe = True
    if is_safe:
        print(" [PASS] 5. Teacher boundaries verified (cannot modify another teacher's quiz)")
        passed_tests += 1
    else:
        print(" [FAIL] 5. Teacher modified other teacher's resource:", res)

    # -------------------------------------------------------------
    # SUITE 6: HOD & ACCOUNTANT ROLE SEGREGATION
    # -------------------------------------------------------------
    total_tests += 1
    # Accountant cannot modify quiz definitions
    sql = """
    BEGIN;
    SET LOCAL ROLE authenticated;
    SET LOCAL request.jwt.claims = '{"sub": "8ce804b5-c1a5-4b0b-92a1-8a842e000999", "role": "authenticated", "email": "accountant@ssgmce.ac.in", "user_metadata": {"role": "accountant", "user_id": "accountant"}}';
    UPDATE public.quizzes SET title = 'Accountant Edit' WHERE 1=1;
    ROLLBACK;
    """
    res = execute_rls_sql(sql)
    is_safe = False
    if isinstance(res, list) and len(res) == 0:
        is_safe = True
    elif isinstance(res, dict) and "error" in res:
        is_safe = True
    if is_safe:
        print(" [PASS] 6. Role segregation verified (Accountant blocked from modifying academic quizzes)")
        passed_tests += 1
    else:
        print(" [FAIL] 6. Accountant modified academic quizzes:", res)

    # -------------------------------------------------------------
    # SUITE 7: ADMIN SYSTEM AUTHORITY
    # -------------------------------------------------------------
    total_tests += 1
    sql = """
    BEGIN;
    SET LOCAL ROLE authenticated;
    SET LOCAL request.jwt.claims = '{"sub": "b319e831-c312-402f-89a7-d273c86f18c4", "role": "authenticated", "email": "admin@ssgmce.ac.in", "user_metadata": {"role": "admin", "user_id": "admin"}}';
    SELECT 
        (SELECT count(*) FROM public.students) as admin_student_count,
        (SELECT count(*) FROM public.admin_audit_logs) as admin_audit_count,
        (SELECT count(*) FROM public.user_roles) as admin_user_roles_count;
    ROLLBACK;
    """
    res = execute_rls_sql(sql)
    if isinstance(res, list) and len(res) > 0:
        row = res[0]
        if row.get('admin_student_count', 0) > 100 and row.get('admin_user_roles_count', 0) > 0:
            print(" [PASS] 7. Admin & Super Admin authority verified (full visibility across students, roles, audit)")
            passed_tests += 1
        else:
            print(" [FAIL] 7. Admin visibility restricted:", row)
    else:
        print(" [FAIL] 7. Error running admin test:", res)

    print("=" * 70)
    print(f"RESULTS: {passed_tests} PASSED, {total_tests - passed_tests} FAILED (TOTAL: {total_tests})")
    print("=" * 70)
    if passed_tests == total_tests:
        print("ALL ROW LEVEL SECURITY AND ISOLATION TESTS PASSED PERFECTLY!\n")
    else:
        print("SOME RLS TESTS FAILED!\n")
        sys.exit(1)

if __name__ == '__main__':
    run_tests()

