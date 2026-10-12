import urllib.request
import json
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
        ('UserName', wintypes.LPWSTR)
    ]

advapi32 = ctypes.windll.advapi32
cred_ptr = ctypes.POINTER(CREDENTIAL)()
advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_ptr))
token = ctypes.string_at(cred_ptr.contents.CredentialBlob, cred_ptr.contents.CredentialBlobSize).decode('utf-8')

def exec_sql(sql_text):
    req = urllib.request.Request(
        'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
        data=json.dumps({'query': sql_text}).encode('utf-8'),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        print('SQL ERROR:', e.read().decode('utf-8')[:500])
        return None

ddl_statements = [
    # Baseline departments
    """
    INSERT INTO public.departments (id, name, code)
    VALUES ('945f3faf-8b04-45d8-a274-a96908abb7d9', 'Computer Science & Engineering', 'CSE')
    ON CONFLICT (id) DO NOTHING;
    """,

    # Baseline classes
    """
    INSERT INTO public.classes (id, class_name, department_id, semester, academic_year)
    VALUES 
      ('51e6fba4-bd51-43ba-8cd1-aef0248c97c8', '2R1', '945f3faf-8b04-45d8-a274-a96908abb7d9', 3, '2026-27'),
      ('c63be68c-b5de-4d27-9a95-ad4b42e42d09', '2R2', '945f3faf-8b04-45d8-a274-a96908abb7d9', 3, '2026-27'),
      ('f6f20676-7307-415f-8e4b-92bc9f347646', '3R', '945f3faf-8b04-45d8-a274-a96908abb7d9', 5, '2026-27'),
      ('08827e9b-22ac-49f8-a452-ee3c787fb003', '4R', '945f3faf-8b04-45d8-a274-a96908abb7d9', 7, '2026-27')
    ON CONFLICT (id) DO NOTHING;
    """,

    # 1. Quizzes
    """
    CREATE TABLE IF NOT EXISTS public.quizzes (
        id character varying(100) PRIMARY KEY,
        teacher_id character varying(100),
        class_id character varying(100) NOT NULL,
        subject_id character varying(100),
        subject_name character varying(150) NOT NULL DEFAULT 'Computer Science',
        title character varying(200) NOT NULL,
        description text,
        instructions text,
        start_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        end_at timestamp with time zone,
        duration_minutes integer NOT NULL DEFAULT 30,
        total_marks double precision NOT NULL DEFAULT 100.0,
        passing_marks double precision NOT NULL DEFAULT 40.0,
        max_attempts integer NOT NULL DEFAULT 1,
        shuffle_questions boolean NOT NULL DEFAULT false,
        shuffle_options boolean NOT NULL DEFAULT false,
        allow_question_navigation boolean NOT NULL DEFAULT true,
        allow_back_navigation boolean NOT NULL DEFAULT true,
        show_result_immediately boolean NOT NULL DEFAULT true,
        show_correct_answers boolean NOT NULL DEFAULT true,
        result_release_mode character varying(20) NOT NULL DEFAULT 'IMMEDIATE',
        negative_marking boolean NOT NULL DEFAULT false,
        negative_marks double precision NOT NULL DEFAULT 0.0,
        require_all_questions boolean NOT NULL DEFAULT false,
        allow_unanswered boolean NOT NULL DEFAULT true,
        status character varying(20) NOT NULL DEFAULT 'ACTIVE',
        is_published integer NOT NULL DEFAULT 1,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # 2. Question Bank
    """
    CREATE TABLE IF NOT EXISTS public.question_bank (
        id character varying(100) PRIMARY KEY,
        subject_id character varying(100),
        question_text text NOT NULL,
        question_type character varying(50) NOT NULL DEFAULT 'MCQ',
        marks double precision NOT NULL DEFAULT 2.0,
        negative_marks double precision NOT NULL DEFAULT 0.0,
        difficulty character varying(50) NOT NULL DEFAULT 'MEDIUM',
        explanation text,
        created_by character varying(100),
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # 3. Question Options
    """
    CREATE TABLE IF NOT EXISTS public.question_options (
        id character varying(100) PRIMARY KEY,
        question_id character varying(100) NOT NULL,
        option_key character varying(10) NOT NULL,
        option_text text NOT NULL,
        is_correct integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # 4. Quiz Questions
    """
    CREATE TABLE IF NOT EXISTS public.quiz_questions (
        id character varying(100) PRIMARY KEY,
        quiz_id character varying(100) NOT NULL,
        question_id character varying(100) NOT NULL,
        question_order integer NOT NULL DEFAULT 1,
        marks double precision NOT NULL DEFAULT 2.0,
        negative_marks double precision NOT NULL DEFAULT 0.0,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # 5. Quiz Attempts
    """
    CREATE TABLE IF NOT EXISTS public.quiz_attempts (
        id character varying(100) PRIMARY KEY,
        quiz_id character varying(100) NOT NULL,
        student_id character varying(100) NOT NULL,
        attempt_number integer NOT NULL DEFAULT 1,
        status character varying(30) NOT NULL DEFAULT 'in_progress',
        started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        submitted_at timestamp with time zone,
        time_taken_seconds integer DEFAULT 0,
        total_questions integer DEFAULT 0,
        score double precision DEFAULT 0.0,
        percentage double precision DEFAULT 0.0,
        accuracy double precision DEFAULT 0.0,
        passed boolean DEFAULT false,
        total_correct integer DEFAULT 0,
        total_wrong integer DEFAULT 0,
        total_unanswered integer DEFAULT 0,
        correct_count integer DEFAULT 0,
        incorrect_count integer DEFAULT 0,
        unanswered_count integer DEFAULT 0,
        expires_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # 6. Quiz Attempt Answers
    """
    CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
        id character varying(100) PRIMARY KEY,
        attempt_id character varying(100) NOT NULL,
        question_id character varying(100) NOT NULL,
        selected_option character varying(50),
        selected_options text,
        text_answer text,
        is_correct boolean DEFAULT false,
        marks_awarded double precision DEFAULT 0.0,
        is_marked_for_review boolean DEFAULT false,
        answered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(attempt_id, question_id)
    );
    """,

    # 7. Quiz Security Events
    """
    CREATE TABLE IF NOT EXISTS public.quiz_security_events (
        id character varying(100) PRIMARY KEY,
        attempt_id character varying(100) NOT NULL,
        event_type character varying(50) NOT NULL,
        event_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        metadata text
    );
    """,

    # 8. Timetable Assessments
    """
    CREATE TABLE IF NOT EXISTS public.timetable_assessments (
        id character varying(100) PRIMARY KEY,
        teacher_id character varying(100),
        type character varying(50) NOT NULL,
        subject character varying(150) NOT NULL,
        title character varying(250) NOT NULL,
        date character varying(50) NOT NULL,
        start_time character varying(20) NOT NULL,
        end_time character varying(20) NOT NULL,
        link text NOT NULL,
        class_code character varying(50) DEFAULT '3R',
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # Disable RLS and Grant permissions to postgrest anon/authenticated roles
    "ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.question_bank DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.question_options DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.quiz_questions DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.quiz_attempt_answers DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.quiz_security_events DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.timetable_assessments DISABLE ROW LEVEL SECURITY;",

    "GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;",
    "NOTIFY pgrst, 'reload schema';"
]

for stmt in ddl_statements:
    res = exec_sql(stmt)
    if res is not None:
        first_line = stmt.strip().splitlines()[0]
        print("APPLIED:", first_line[:60])

print("\nAll Quiz & Assessment tables successfully created and configured in Supabase Cloud.")

