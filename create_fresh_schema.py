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
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100) DEFAULT 'book',
    classes_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    class_name VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    academic_year VARCHAR(50) DEFAULT '2026-2027',
    semester INTEGER DEFAULT 3,
    year INTEGER DEFAULT 2,
    division VARCHAR(10) DEFAULT 'A',
    room VARCHAR(50) DEFAULT 'LH-201',
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS & LOGIN PROFILES
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT 'ssgmce@123',
    full_name VARCHAR(255) NOT NULL,
    roll_no VARCHAR(50),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    class_name VARCHAR(50),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    year INTEGER DEFAULT 2,
    division VARCHAR(10) DEFAULT 'A',
    email VARCHAR(255),
    phone VARCHAR(50),
    prn VARCHAR(50),
    gender VARCHAR(20),
    date_of_birth DATE,
    blood_group VARCHAR(10),
    category VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    is_provisional BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. TEACHERS & FACULTY
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_code VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT 'teacher@123',
    full_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. ADMINS
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT 'admin@123',
    name VARCHAR(255) DEFAULT 'System Administrator',
    email VARCHAR(255) DEFAULT 'admin@ssgmce.ac.in',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Disable RLS for clean development access
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.departments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.students TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.teachers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.admins TO anon, authenticated, service_role;
"""

req = urllib.request.Request(
    'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
    data=json.dumps({'query': sql}).encode('utf-8'),
    headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as resp:
        print('Tables successfully created on remote Supabase!')
except urllib.error.HTTPError as e:
    print('HTTP ERROR:', e.code, e.read().decode('utf-8'))

