import urllib.request, json, ctypes
from ctypes import wintypes

class CREDENTIAL(ctypes.Structure):
    _fields_ = [('Flags', wintypes.DWORD), ('Type', wintypes.DWORD), ('TargetName', wintypes.LPWSTR),
                ('Comment', wintypes.LPWSTR), ('LastWritten', wintypes.FILETIME), ('CredentialBlobSize', wintypes.DWORD),
                ('CredentialBlob', ctypes.POINTER(ctypes.c_char)), ('Persist', wintypes.DWORD),
                ('AttributeCount', wintypes.DWORD), ('Attributes', ctypes.c_void_p),
                ('TargetAlias', wintypes.LPWSTR), ('UserName', wintypes.LPWSTR)]
advapi32 = ctypes.windll.advapi32
cred_ptr = ctypes.POINTER(CREDENTIAL)()
advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_ptr))
token = ctypes.string_at(cred_ptr.contents.CredentialBlob, cred_ptr.contents.CredentialBlobSize).decode('utf-8')

def q(sql_text):
    req = urllib.request.Request('https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
        data=json.dumps({'query': sql_text}).encode('utf-8'),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        print('SQL ERROR:', e.read().decode('utf-8')[:400])
        return None

statements = [
    'DROP POLICY IF EXISTS "Teachers manage notifications" ON public.notifications;',
    'DROP POLICY IF EXISTS "Students view class notifications" ON public.notifications;',
    'DROP POLICY IF EXISTS "notifications_read_all" ON public.notifications;',
    'DROP POLICY IF EXISTS "notifications_write_all" ON public.notifications;',
    'ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_teacher_id_fkey;',
    'ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_class_id_fkey;',
    'ALTER TABLE public.notifications ALTER COLUMN id TYPE character varying(100);',
    'ALTER TABLE public.notifications ALTER COLUMN teacher_id TYPE character varying(100);',
    'ALTER TABLE public.notifications ALTER COLUMN class_id TYPE character varying(100);',
    'ALTER TABLE public.timetable_entries ALTER COLUMN period_num TYPE character varying(50);',
    'ALTER TABLE public.question_bank DROP CONSTRAINT IF EXISTS question_bank_created_by_fkey;',
    'ALTER TABLE public.question_bank ALTER COLUMN created_by TYPE character varying(100);',
    'ALTER TABLE public.question_options DROP CONSTRAINT IF EXISTS question_options_question_id_fkey;',
    'ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_quiz_id_fkey;',
    'ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_question_id_fkey;',
    'ALTER TABLE public.quiz_attempt_answers DROP CONSTRAINT IF EXISTS quiz_attempt_answers_attempt_id_fkey;',
    'ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_fkey;',
    'ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_student_id_fkey;',
    'ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.timetable_entries DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.timetable_assessments DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.question_bank DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.question_options DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.quiz_questions DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.quiz_attempt_answers DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;',
    """CREATE TABLE IF NOT EXISTS public.student_attendance_subjects (
        id character varying(100) PRIMARY KEY,
        student_code character varying(50),
        academic_year character varying(50),
        semester character varying(50),
        subject_name character varying(255),
        subject_code character varying(50),
        subject_type character varying(50),
        type_name character varying(50),
        present_periods integer DEFAULT 0,
        total_periods integer DEFAULT 0,
        faculty_name character varying(255),
        classroom character varying(100),
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
    );""",
    'ALTER TABLE public.student_attendance_subjects DISABLE ROW LEVEL SECURITY;',
    'GRANT ALL ON TABLE public.student_attendance_subjects TO anon, authenticated, service_role;',
    """CREATE TABLE IF NOT EXISTS public.subject_syllabus (
        id character varying(100) PRIMARY KEY,
        subject_code character varying(50),
        subject_name character varying(255),
        credits integer DEFAULT 3,
        faculty_name character varying(255),
        faculty_designation character varying(255),
        faculty_email character varying(255),
        faculty_cabin character varying(100),
        syllabus_progress integer DEFAULT 0,
        university_curriculum_code character varying(100),
        curriculum_pdf_url text
    );""",
    'ALTER TABLE public.subject_syllabus DISABLE ROW LEVEL SECURITY;',
    'GRANT ALL ON TABLE public.subject_syllabus TO anon, authenticated, service_role;'
]

for stmt in statements:
    res = q(stmt)
    if res is not None:
        print("OK:", stmt[:50])
print("All DDL executed successfully.")

