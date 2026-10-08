import urllib.request, json, ctypes
from ctypes import wintypes

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD), ('Type', wintypes.DWORD), ('TargetName', wintypes.LPWSTR),
        ('Comment', wintypes.LPWSTR), ('LastWritten', wintypes.FILETIME), ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.POINTER(ctypes.c_char)), ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD), ('Attributes', ctypes.c_void_p),
        ('TargetAlias', wintypes.LPWSTR), ('UserName', wintypes.LPWSTR)
    ]

advapi32 = ctypes.windll.advapi32
cred_ptr = ctypes.POINTER(CREDENTIAL)()
advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_ptr))
token = ctypes.string_at(cred_ptr.contents.CredentialBlob, cred_ptr.contents.CredentialBlobSize).decode('utf-8')

def run_query(sql):
    req = urllib.request.Request(
        'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
        data=json.dumps({'query': sql}).encode('utf-8'),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode('utf-8')

# 1. Get CSE Department ID
d_rows = json.loads(run_query("SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1;"))
dept_id = d_rows[0]['id'] if d_rows else None

# 2. Insert standard curriculum subjects
subjects = [
    ('5CS220PC', 'Database Management Systems', 'DBMS', 'Theory', 3.0),
    ('5CS221PC', 'Compiler Design', 'CD', 'Theory', 4.0),
    ('5CS222PC', 'Computer Architecture & Organization', 'CAO', 'Theory', 3.0),
    ('5CS223PE', 'Data Science and Statistics', 'DSS', 'Theory', 3.0),
    ('5CS224PC', 'Database Management Systems-LAB', 'DBMS Lab', 'Practical', 1.5),
    ('5CS225PC', 'Compiler Design_LAB', 'CD Lab', 'Practical', 1.5),
    ('5ET227MD', 'Introduction to Microprocessors', 'Microprocessors', 'Theory', 3.0),
    ('5ET228MD', 'Microcontroller Applications', 'Microcontroller', 'Theory', 3.0),
    ('5ET229ML', 'Microprocessor and Microcontroller Lab', 'MP Lab', 'Practical', 1.5),
    ('3CS201PC', 'Data Structures & Algorithms', 'DSA', 'Theory', 4.0),
    ('3CS202PC', 'Object Oriented Programming with Java', 'OOP Java', 'Theory', 4.0),
    ('3CS204PC', 'Operating Systems', 'OS', 'Theory', 4.0),
    ('3CS205MD', 'Computer Networks', 'Networks', 'Theory', 3.0),
    ('7KS01', 'Cloud Computing', 'CC', 'Theory', 3.0),
    ('7KS02', 'Data Warehousing & Mining', 'DWM', 'Theory', 3.0)
]

for code, name, short, stype, credits in subjects:
    s_sql = f"""
    INSERT INTO public.subjects (code, name, short_name, department_id, type, credits)
    VALUES ('{code}', '{name}', '{short}', '{dept_id}', '{stype}', {credits})
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;
    """
    run_query(s_sql)
print("Curriculum subjects inserted successfully into Supabase.")

# 3. Create initial subject attendance summary for all students in 2R1, 2R2, 3R, 4R
# This links students to real course attendance tracking rows
st_rows = json.loads(run_query("SELECT id, student_code, class_name FROM public.students;"))
print(f"Populating course attendance tracking for {len(st_rows)} students...")

# Standard subjects mapped per class:
class_courses = {
    '2R1': [
        ('3CS201PC', 'Data Structures & Algorithms', 'TH', 'Theory', 'Dr. V. S. Mahalle', 'LH-201'),
        ('3CS202PC', 'Object Oriented Programming with Java', 'TH', 'Theory', 'Prof. C. M. Mankar', 'LH-201'),
        ('3CS204PC', 'Operating Systems', 'TH', 'Theory', 'Prof. K. P. Sable', 'LH-201'),
        ('3CS205MD', 'Computer Networks', 'TH', 'Theory', 'Prof. S. B. Pagrut', 'LH-201')
    ],
    '2R2': [
        ('3CS201PC', 'Data Structures & Algorithms', 'TH', 'Theory', 'Dr. V. S. Mahalle', 'LH-202'),
        ('3CS202PC', 'Object Oriented Programming with Java', 'TH', 'Theory', 'Prof. C. M. Mankar', 'LH-202'),
        ('3CS204PC', 'Operating Systems', 'TH', 'Theory', 'Prof. K. P. Sable', 'LH-202'),
        ('3CS205MD', 'Computer Networks', 'TH', 'Theory', 'Prof. S. B. Pagrut', 'LH-202')
    ],
    '3R': [
        ('5CS220PC', 'Database Management Systems', 'TH', 'Theory', 'Dr. J. M. Patil', 'LH-204'),
        ('5CS221PC', 'Compiler Design', 'TH', 'Theory', 'Dr. N. M. Kandoi', 'LH-204'),
        ('5CS222PC', 'Computer Architecture & Organization', 'TH', 'Theory', 'Prof. R. V. Deshmukh', 'LH-204'),
        ('5CS223PE', 'Data Science and Statistics', 'TH', 'Theory', 'Dr. R. A. Zamare', 'LH-204'),
        ('5CS224PC', 'Database Management Systems-LAB', 'PR', 'Practical', 'Dr. J. M. Patil', 'Lab-1'),
        ('5CS225PC', 'Compiler Design_LAB', 'PR', 'Practical', 'Dr. N. M. Kandoi', 'Lab-2')
    ],
    '4R': [
        ('7KS01', 'Cloud Computing', 'TH', 'Theory', 'Prof. S. M. Jawake', 'LH-205'),
        ('7KS02', 'Data Warehousing & Mining', 'TH', 'Theory', 'Prof. T. A. Puranik', 'LH-205')
    ]
}

batch_size = 50
records = []
for st in st_rows:
    cname = st.get('class_name') or '3R'
    courses = class_courses.get(cname, class_courses['3R'])
    for code, c_name, stype, type_name, fac, room in courses:
        records.append((
            st['id'], st['student_code'], cname, code, c_name, stype, type_name, fac, room
        ))

print(f"Total student-course pairs: {len(records)}")
for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    vals = [
        f"('{r[0]}', '{r[1]}', '{r[2]}', '{r[3]}', '{r[4]}', '{r[5]}', '{r[6]}', 0, 0, '{r[7]}', '{r[8]}')"
        for r in batch
    ]
    ins_sql = f"""
    INSERT INTO public.student_attendance_subjects 
    (student_id, student_code, class_name, subject_code, subject_name, subject_type, type_name, present_periods, total_periods, faculty_name, classroom)
    VALUES {', '.join(vals)}
    ON CONFLICT (student_code, subject_code) DO NOTHING;
    """
    run_query(ins_sql)

print("SUCCESS: Student attendance tracking subjects initialized!")

