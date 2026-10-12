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

sql = """
-- 1. SUBJECTS (Academic catalog needed for attendance marking)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    type VARCHAR(50) DEFAULT 'Theory', -- Theory / Practical / Tutorial / Seminar
    credits NUMERIC(3, 1) DEFAULT 3.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. ATTENDANCE SESSIONS
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(100),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    class_name VARCHAR(50),
    department_code VARCHAR(50) DEFAULT 'CSE',
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_code VARCHAR(50),
    subject_name VARCHAR(255),
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_number VARCHAR(50) DEFAULT '1',
    period VARCHAR(50) DEFAULT '1',
    session_type VARCHAR(50) DEFAULT 'Theory',
    topic_taught TEXT,
    remark TEXT,
    total_students INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    attendance_rate NUMERIC(5, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'SUBMITTED', -- 'DRAFT' | 'SUBMITTED'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. ATTENDANCE RECORDS (Per student)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    roll_no VARCHAR(50),
    student_name VARCHAR(255),
    is_present BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'PRESENT', -- 'PRESENT' | 'ABSENT'
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENT ATTENDANCE AGGREGATE SUMMARY (Subject-wise & Cumulative)
CREATE TABLE IF NOT EXISTS public.student_attendance_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_code VARCHAR(50) NOT NULL,
    class_name VARCHAR(50),
    academic_year VARCHAR(50) DEFAULT '2026-2027',
    semester VARCHAR(50) DEFAULT 'V',
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    subject_type VARCHAR(50) DEFAULT 'TH', -- TH | PR | TUT
    type_name VARCHAR(50) DEFAULT 'Theory',
    present_periods INTEGER DEFAULT 0,
    total_periods INTEGER DEFAULT 0,
    faculty_name VARCHAR(255),
    classroom VARCHAR(100) DEFAULT 'LH-201',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_subject UNIQUE (student_code, subject_code)
);

-- Disable RLS for frictionless sync & frontend connectivity
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance_subjects DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.subjects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.attendance_sessions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.attendance_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.student_attendance_subjects TO anon, authenticated, service_role;
"""

req = urllib.request.Request(
    'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
    data=json.dumps({'query': sql}).encode('utf-8'),
    headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as resp:
        print('Attendance tables successfully created on Supabase!')
except urllib.error.HTTPError as e:
    print('HTTP ERROR:', e.code, e.read().decode('utf-8'))

