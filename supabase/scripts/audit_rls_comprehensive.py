import json
import urllib.request
import ctypes
from ctypes import wintypes
import sys

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

advapi32 = ctypes.windll.advapi32
cred_pointer = ctypes.POINTER(CREDENTIAL)()
advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_pointer))
cred = cred_pointer.contents
token = ctypes.string_at(cred.CredentialBlob, cred.CredentialBlobSize).decode('utf-8')

def run_query(sql):
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
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP ERROR {e.code}: {e.read().decode('utf-8')}")
        raise

def run():
    print("=== 1. AUDITING ALL PUBLIC TABLES & RLS STATUS ===")
    tables = run_query("""
        SELECT 
            c.relname as table_name,
            c.relrowsecurity as rls_enabled,
            c.relforcerowsecurity as rls_forced
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname;
    """)
    print(f"Total Tables in 'public': {len(tables)}")
    
    rls_disabled = [t['table_name'] for t in tables if not t['rls_enabled']]
    print(f"\nTables with RLS DISABLED ({len(rls_disabled)}):")
    for t in rls_disabled:
        print(f"  - {t}")

    print("\n=== 2. AUDITING ALL EXISTING POLICIES ===")
    policies = run_query("""
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
    """)
    print(f"Total Existing Policies: {len(policies)}")

    unrestricted_policies = []
    for p in policies:
        is_unrestricted_qual = p['qual'] == 'true' or p['qual'] is True
        is_unrestricted_check = p['with_check'] == 'true' or p['with_check'] is True
        is_public_role = 'public' in p['roles']
        if (is_unrestricted_qual or is_unrestricted_check) and is_public_role:
            unrestricted_policies.append(p)

    print(f"\nCRITICAL: Unrestricted Policies (USING(true) / WITH CHECK(true) TO public): {len(unrestricted_policies)}")
    for p in unrestricted_policies:
        print(f"  [TABLE: {p['tablename']:<30}] {p['policyname']} ({p['cmd']}) -> USING({p['qual']}) WITH_CHECK({p['with_check']})")

    # Save full audit data to json
    audit_data = {
        'total_tables': len(tables),
        'tables': tables,
        'rls_disabled_tables': rls_disabled,
        'total_policies': len(policies),
        'policies': policies,
        'unrestricted_policies': unrestricted_policies
    }
    with open('docs/rls_audit_raw.json', 'w') as f:
        json.dump(audit_data, f, indent=2)
    print("\nSaved full audit data to docs/rls_audit_raw.json")

    # 3. Check auth.users vs students & teachers
    print("\n=== 3. CHECKING AUTH.USERS AND LINKAGE ===")
    auth_summary = run_query("""
        SELECT 
            raw_user_meta_data->>'role' as meta_role,
            count(*) as user_count
        FROM auth.users
        GROUP BY raw_user_meta_data->>'role';
    """)
    print("Auth Users distribution:")
    for a in auth_summary:
        print(f"  Role '{a['meta_role']}': {a['user_count']} users")

    # Sample user records from students & teachers
    print("\nSample Student:")
    std = run_query("SELECT id, student_code, email, full_name, class_id FROM students LIMIT 1;")
    print(" ", std)

    print("\nSample Teacher:")
    tch = run_query("SELECT id, emp_code, email, full_name, department_id FROM teachers LIMIT 1;")
    print(" ", tch)

    print("\nSample Admin:")
    adm = run_query("SELECT id, username, email, name FROM admins LIMIT 1;")
    print(" ", adm)

if __name__ == '__main__':
    run()

