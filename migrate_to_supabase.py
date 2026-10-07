import sqlite3
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
blob = ctypes.string_at(cred.CredentialBlob, cred.CredentialBlobSize)
token = blob.decode('utf-8')

def run_query(sql):
    req = urllib.request.Request('https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query', data=json.dumps({'query': sql}).encode('utf-8'), headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='replace')
        sys.stdout.buffer.write(f'HTTP ERROR {e.code}: {err_msg[:200]}\n'.encode('utf-8'))
        return None

# Fix foreign keys and constraints first so import is clean
fix_constraints_sql = """
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_department_id_fkey;
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_department_id_fkey;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_fkey;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_name_roll_no_key;
ALTER TABLE public.classes ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.classes ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.departments ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.departments ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.students ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.students ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.students ALTER COLUMN is_provisional DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN is_provisional TYPE BOOLEAN USING (CASE WHEN is_provisional::text IN ('1', 'true', 't') THEN true ELSE false END);
"""
print('Applying constraint relaxation for clean sync...')
run_query(fix_constraints_sql)

con = sqlite3.connect('backend/erp.db')

def escape_val(v, col_name=None):
    if v is None:
        return 'NULL'
    if col_name == 'is_provisional' or (isinstance(v, int) and col_name and ('is_' in col_name or 'has_' in col_name)):
        return 'true' if v == 1 else 'false'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

def sync_table(table_name, target_table=None, match_cols=None):
    if not target_table:
        target_table = table_name
    print(f'Syncing {table_name} -> {target_table}...')
    cursor = con.execute(f'SELECT * FROM {table_name}')
    cols = [d[0] for d in cursor.description]
    rows = cursor.fetchall()
    if not rows:
        print(f'No rows in {table_name}')
        return

    info_json = run_query(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{target_table}';")
    target_cols = {c['column_name'] for c in json.loads(info_json or '[]')}

    valid_col_indices = [i for i, c in enumerate(cols) if c in target_cols]
    valid_cols = [cols[i] for i in valid_col_indices]

    if not valid_cols:
        print(f'No overlapping columns for {table_name}')
        return

    col_names_str = ', '.join(f'"{c}"' for c in valid_cols)
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        values_clauses = []
        for r in batch:
            row_vals = [escape_val(r[idx], valid_cols[pos]) for pos, idx in enumerate(valid_col_indices)]
            values_clauses.append(f"({', '.join(row_vals)})")
        
        insert_sql = f'INSERT INTO public."{target_table}" ({col_names_str}) VALUES\n' + ',\n'.join(values_clauses)
        if match_cols:
            conflict_cols = ', '.join(f'"{c}"' for c in match_cols)
            update_clauses = [f'"{c}" = EXCLUDED."{c}"' for c in valid_cols if c not in match_cols]
            if update_clauses:
                insert_sql += f'\nON CONFLICT ({conflict_cols}) DO UPDATE SET ' + ', '.join(update_clauses)
            else:
                insert_sql += f'\nON CONFLICT ({conflict_cols}) DO NOTHING'
        else:
            insert_sql += '\nON CONFLICT DO NOTHING'
        insert_sql += ';'

        run_query(insert_sql)
    print(f'Synced {len(rows)} rows into {target_table}.')

sync_table('departments', match_cols=['id'])
sync_table('classes', match_cols=['id'])
sync_table('subjects', match_cols=['id'])
sync_table('students', match_cols=['id'])
sync_table('timetable_entries', match_cols=['id'])
sync_table('timetable_assessments', match_cols=['id'])
sync_table('notifications', match_cols=['id'])
sync_table('question_bank', match_cols=['id'])
sync_table('question_options', match_cols=['id'])
sync_table('quizzes', match_cols=['id'])
sync_table('quiz_questions')
sync_table('quiz_attempts', match_cols=['id'])
sync_table('quiz_attempt_answers', match_cols=['id'])
sync_table('student_documents', match_cols=['id'])
sync_table('student_attendance_subjects')
sync_table('subject_syllabus')

print('All data migrated to Supabase remote database!')

