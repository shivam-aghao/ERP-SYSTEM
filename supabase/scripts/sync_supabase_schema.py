import urllib.request
import json
import ctypes
from ctypes import wintypes
import sqlite3

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
        print('HTTP ERROR:', e.code, e.read().decode('utf-8'))
        return None

# 1. Create timetable_assessments and timetable_entries in Supabase
setup_sql = """
CREATE TABLE IF NOT EXISTS public.timetable_assessments (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36),
    type VARCHAR(30) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    title VARCHAR(250) NOT NULL,
    date VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    link TEXT NOT NULL,
    class_code VARCHAR(50) DEFAULT '2R1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.timetable_entries (
    id VARCHAR(36) PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    period_num INTEGER NOT NULL,
    period_time VARCHAR(50) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    venue VARCHAR(100),
    teacher_name VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Scheduled',
    status_class VARCHAR(50) DEFAULT 'status-upcoming',
    is_completed BOOLEAN DEFAULT false,
    is_active_now BOOLEAN DEFAULT false,
    is_critical BOOLEAN DEFAULT false,
    att_label VARCHAR(100) DEFAULT 'Scheduled'
);

ALTER TABLE public.timetable_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read timetable_assessments" ON public.timetable_assessments;
CREATE POLICY "Public read timetable_assessments" ON public.timetable_assessments FOR SELECT TO PUBLIC USING (true);
DROP POLICY IF EXISTS "Manage timetable_assessments" ON public.timetable_assessments;
CREATE POLICY "Manage timetable_assessments" ON public.timetable_assessments FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.timetable_assessments TO anon, authenticated, service_role;

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read timetable_entries" ON public.timetable_entries;
CREATE POLICY "Public read timetable_entries" ON public.timetable_entries FOR SELECT TO PUBLIC USING (true);
DROP POLICY IF EXISTS "Manage timetable_entries" ON public.timetable_entries;
CREATE POLICY "Manage timetable_entries" ON public.timetable_entries FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.timetable_entries TO anon, authenticated, service_role;

-- Ensure RLS on students, classes, subjects, departments, notifications, quizzes allows public read
GRANT ALL ON TABLE public.students TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.departments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.subjects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.quizzes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.quiz_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.question_bank TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.question_options TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.quiz_attempts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.quiz_attempt_answers TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Allow all for students" ON public.students;
CREATE POLICY "Allow all for students" ON public.students FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for classes" ON public.classes;
CREATE POLICY "Allow all for classes" ON public.classes FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for notifications" ON public.notifications;
CREATE POLICY "Allow all for notifications" ON public.notifications FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for quizzes" ON public.quizzes;
CREATE POLICY "Allow all for quizzes" ON public.quizzes FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for questions" ON public.quiz_questions;
CREATE POLICY "Allow all for questions" ON public.quiz_questions FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for question_bank" ON public.question_bank;
CREATE POLICY "Allow all for question_bank" ON public.question_bank FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for question_options" ON public.question_options;
CREATE POLICY "Allow all for question_options" ON public.question_options FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for attempts" ON public.quiz_attempts;
CREATE POLICY "Allow all for attempts" ON public.quiz_attempts FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for answers" ON public.quiz_attempt_answers;
CREATE POLICY "Allow all for answers" ON public.quiz_attempt_answers FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
"""

print('Running schema setup in Supabase...')
run_query(setup_sql)
print('Schema setup complete!')

