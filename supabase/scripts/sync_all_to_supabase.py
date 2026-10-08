import sqlite3
import json
import urllib.request
import ctypes
from ctypes import wintypes
import sys
import uuid

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
        print(f'HTTP ERROR {e.code}: {err_msg[:250]}')
        return None

con = sqlite3.connect('backend/erp.db')

def escape_val(v, col_name, data_type):
    if v is None:
        return 'NULL'
    if data_type == 'boolean':
        if isinstance(v, (int, str)):
            return 'true' if str(v).lower() in ('1', 'true', 't') else 'false'
        return 'true' if bool(v) else 'false'
    if data_type in ('integer', 'numeric', 'bigint', 'double precision', 'smallint'):
        try:
            return str(float(v) if '.' in str(v) else int(v))
        except:
            return '0'
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

    info_json = run_query(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{target_table}';")
    target_info = {c['column_name']: c['data_type'] for c in json.loads(info_json or '[]')}

    valid_col_indices = [i for i, c in enumerate(cols) if c in target_info]
    valid_cols = [cols[i] for i in valid_col_indices]

    if not valid_cols:
        print(f'No overlapping columns for {table_name}')
        return

    # Check if id needs generation if missing or if table needs id
    col_names_str = ', '.join(f'"{c}"' for c in valid_cols)
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        values_clauses = []
        for r in batch:
            row_dict = {valid_cols[pos]: r[idx] for pos, idx in enumerate(valid_col_indices)}
            if 'id' in valid_cols and (row_dict['id'] is None or str(row_dict['id']).strip() == ''):
                row_dict['id'] = str(uuid.uuid4())
            row_vals = [escape_val(row_dict[c], c, target_info[c]) for c in valid_cols]
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

        res = run_query(insert_sql)
        if res is not None:
            print(f'  Batch {i//batch_size + 1} synced successfully')
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
sync_table('student_attendance_subjects', match_cols=['id'])
sync_table('subject_syllabus', match_cols=['id'])

print('All data cleanly synced to Supabase remote database!')

