import os
import re
import json
import zipfile
import xml.etree.ElementTree as ET
import urllib.request
import ctypes
from ctypes import wintypes
import pypdf

# 1. Supabase credentials
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

print("1. Inserting Department...")
dept_sql = """
INSERT INTO public.departments (code, name, icon, description)
VALUES ('CSE', 'Computer Science & Engineering', 'laptop', 'Department of Computer Science and Engineering, SSGMCE')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
RETURNING id;
"""
res = run_query(dept_sql)
dept_rows = json.loads(res or '[]')
dept_id = dept_rows[0]['id'] if dept_rows else None
print(f"   Department CSE ID: {dept_id}")

print("2. Inserting Classes (2R1, 2R2, 3R, 4R)...")
classes_data = [
    ('2R1', 'Second Year CSE - Section A (2R1)', 2, 3, 'A', 'LH-201'),
    ('2R2', 'Second Year CSE - Section B (2R2)', 2, 3, 'B', 'LH-202'),
    ('3R', 'Third Year CSE - Section A (3R)', 3, 5, 'A', 'LH-204'),
    ('4R', 'Final Year CSE - Section A (4R)', 4, 7, 'A', 'LH-205')
]
class_id_map = {}
for c_name, full_name, yr, sem, div, room in classes_data:
    c_sql = f"""
    INSERT INTO public.classes (department_id, class_name, name, year, semester, division, room, academic_year)
    VALUES ('{dept_id}', '{c_name}', '{full_name}', {yr}, {sem}, '{div}', '{room}', '2026-2027')
    ON CONFLICT (class_name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, class_name;
    """
    c_res = json.loads(run_query(c_sql) or '[]')
    if c_res:
        class_id_map[c_res[0]['class_name']] = c_res[0]['id']
print(f"   Classes inserted: {list(class_id_map.keys())}")

# Helper for parsing XLSX without openpyxl
def parse_xlsx(path):
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for elem in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                t = elem.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                shared.append(t.text if t is not None else '')
        tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = []
        for r in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            cells = []
            for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                t_attr = c.attrib.get('t')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = v.text if v is not None else ''
                if t_attr == 's' and val.isdigit(): val = shared[int(val)]
                cells.append(val)
            if any(cells): rows.append(cells)
    return [r for r in rows if len(r) >= 4 and r[0].isdigit()]

students = []

# Extract 2R1 from PDF
print("3. Parsing students from DATA files...")
reader = pypdf.PdfReader('d:/ERP-SYSTEM/DATA/Final Roll List (2R1).pdf')
pat = re.compile(r'^(\d+)\s+(2RA\d+)\s+([A-Za-z0-9]+)\s+(.+)$')
for p in reader.pages:
    for line in p.extract_text().split('\n'):
        m = pat.match(line.strip())
        if m:
            sr, roll, code, name = m.groups()
            students.append({
                'class_name': '2R1',
                'division': 'A',
                'year': 2,
                'roll_no': roll,
                'student_code': code,
                'full_name': name.strip()
            })

# Extract 2R2
for r in parse_xlsx('d:/ERP-SYSTEM/DATA/2R2-26-27-Roll-list-updated-21_july-2026.xlsx'):
    students.append({
        'class_name': '2R2',
        'division': 'B',
        'year': 2,
        'roll_no': r[2],
        'student_code': r[1],
        'full_name': r[3].strip()
    })

# Extract 3R
for r in parse_xlsx('d:/ERP-SYSTEM/DATA/3R-26-27-Roll-list-updated-21_july-2026.xlsx'):
    students.append({
        'class_name': '3R',
        'division': 'A',
        'year': 3,
        'roll_no': r[2],
        'student_code': r[1],
        'full_name': r[3].strip()
    })

# Extract 4R
for r in parse_xlsx('d:/ERP-SYSTEM/DATA/4R-Roll_list Autumn 2026-27 (17-06-26).xlsx'):
    students.append({
        'class_name': '4R',
        'division': 'A',
        'year': 4,
        'roll_no': r[2],
        'student_code': r[1],
        'full_name': r[3].strip()
    })

print(f"   Parsed {len(students)} total students from DATA.")

# Batch insert students into Supabase
print("4. Uploading student accounts to Supabase...")
batch_size = 50
for i in range(0, len(students), batch_size):
    batch = students[i:i+batch_size]
    values = []
    for s in batch:
        cid = class_id_map.get(s['class_name'])
        c_code = s['student_code'].replace("'", "''")
        fn = s['full_name'].replace("'", "''")
        roll = s['roll_no'].replace("'", "''")
        cname = s['class_name']
        div = s['division']
        yr = s['year']
        # Generated institutional email format
        email = f"{c_code.lower()}@ssgmce.ac.in"
        # Standard default student password
        pwd = "ssgmce@123"
        values.append(f"('{c_code}', '{pwd}', '{fn}', '{roll}', '{cid}', '{cname}', '{dept_id}', {yr}, '{div}', '{email}')")
    
    insert_sql = f"""
    INSERT INTO public.students (student_code, password, full_name, roll_no, class_id, class_name, department_id, year, division, email)
    VALUES {', '.join(values)}
    ON CONFLICT (student_code) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        roll_no = EXCLUDED.roll_no,
        class_id = EXCLUDED.class_id,
        class_name = EXCLUDED.class_name,
        password = EXCLUDED.password;
    """
    run_query(insert_sql)
    print(f"   Batch {i//batch_size + 1} ({len(batch)} students) synced.")

# 5. Extract Teachers & insert
print("5. Parsing and inserting Teachers from DATA...")
tt_reader = pypdf.PdfReader('d:/ERP-SYSTEM/DATA/Personal Timtable for teacher.pdf')
teachers = []
for p in tt_reader.pages:
    txt = p.extract_text()
    for line in txt.split('\n'):
        if 'Faculty:' in line:
            t = line.split('Faculty:')[1].split('wef:')[0].strip()
            if t and t not in teachers:
                teachers.append(t)

for idx, t_name in enumerate(teachers):
    emp_code = f"EMP-CSE-{1000 + idx + 1}"
    t_email = f"{t_name.lower().replace('dr.', '').replace('prof.', '').replace('mr.', '').replace(' ', '').replace('.', '')[:10]}@ssgmce.ac.in"
    t_sql = f"""
    INSERT INTO public.teachers (emp_code, password, full_name, department_id, email, designation)
    VALUES ('{emp_code}', 'teacher@123', '{t_name.replace("'", "''")}', '{dept_id}', '{t_email}', 'Assistant Professor')
    ON CONFLICT (emp_code) DO UPDATE SET full_name = EXCLUDED.full_name;
    """
    run_query(t_sql)

print(f"   Inserted {len(teachers)} teacher accounts.")

# 6. Admin user
admin_sql = """
INSERT INTO public.admins (username, password, name, email)
VALUES ('admin', 'admin@123', 'System Administrator', 'admin@ssgmce.ac.in')
ON CONFLICT (username) DO NOTHING;
"""
run_query(admin_sql)
print("   Admin account ready (admin / admin@123).")

# Update class total counts
for c_name, cid in class_id_map.items():
    cnt_sql = f"""
    UPDATE public.classes 
    SET total_students = (SELECT COUNT(*) FROM public.students WHERE class_id = '{cid}')
    WHERE id = '{cid}';
    """
    run_query(cnt_sql)

print("\nSUCCESS! All student and faculty profiles & login credentials created in Supabase.")

