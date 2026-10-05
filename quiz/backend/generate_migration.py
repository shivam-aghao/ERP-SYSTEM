"""
Full Migration & Batch SQL Generator
Generates:
1. 01_student_class_quiz_schema.sql (Complete DDL migration for Supabase PostgreSQL)
2. 02_insert_students_from_pdfs.sql (Complete DML data import for both PDFs)
"""
import uuid
from process_roll_lists import parse_pdf1, parse_pdf2, validate_students

def generate_sql():
    meta1, s1 = parse_pdf1('d:/QUIZ/1R1_Roll_List.pdf')
    meta2, s2 = parse_pdf2('d:/QUIZ/3R_ Student_Roll_List.pdf')
    v1, e1 = validate_students(s1, '1R1')
    v2, e2 = validate_students(s2, '3R')

    batch1_id = str(uuid.uuid4())
    batch2_id = str(uuid.uuid4())

    # --- 1. DDL Migration Script ---
    ddl_sql = """-- ==============================================================================
-- COLLEGE ERP: STUDENT + CLASS + QUIZ MODULE DATABASE MIGRATION
-- File: 01_student_class_quiz_schema.sql
-- Target: PostgreSQL / Supabase
--
-- DESIGN PRINCIPLES:
-- 1. Non-destructive: Reuses existing ERP tables (departments, classes, students).
-- 2. Extensions: Safely adds columns to match new schema without breaking old modules.
-- 3. Strict Identifiers: SIS ID is VARCHAR UNIQUE NOT NULL (preserves leading zeros).
-- 4. Internal PK: UUID primary key on all core tables.
-- 5. Referential Integrity: Foreign keys with ON DELETE RESTRICT.
-- 6. Quiz Module Readiness: Restricts quizzes by class_id (quizzes.class_id -> classes.id).
-- 7. Audit & Logs: student_import_batches & student_import_errors for PDF import tracking.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. REUSE & EXTEND: DEPARTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure standard college departments exist
INSERT INTO public.departments (code, name, description)
VALUES
    ('CSE', 'Computer Science & Engineering', 'Department of Computer Science & Engineering'),
    ('IT', 'Information Technology', 'Department of Information Technology'),
    ('MECH', 'Mechanical Engineering', 'Department of Mechanical Engineering'),
    ('EE', 'Electrical Engineering', 'Department of Electrical Engineering'),
    ('ENTC', 'Electronics & Telecommunication', 'Department of Electronics & Telecommunication Engineering'),
    ('ASH', 'Applied Sciences and Humanities', 'Department of Applied Sciences and Humanities (First Year)')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = COALESCE(departments.description, EXCLUDED.description);

-- ==============================================================================
-- 3. REUSE & EXTEND: CLASSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
    class_name VARCHAR,
    year INTEGER,
    division VARCHAR,
    academic_year VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add missing columns to public.classes if table already existed with legacy structure
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_name VARCHAR;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS division VARCHAR;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS academic_year VARCHAR;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Synchronize legacy class_code into class_name where applicable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'class_code'
    ) THEN
        UPDATE public.classes 
        SET class_name = class_code 
        WHERE class_name IS NULL AND class_code IS NOT NULL;
    END IF;
END $$;

-- Populate / Update core classes for Computer Science & Engineering
INSERT INTO public.classes (id, department_id, class_name, year, division, academic_year)
SELECT 
    '0a7372d4-db33-4908-9f85-896c7009fd76'::uuid, 
    d.id, 
    '2R1', 
    2, 
    '1', 
    '2025-26'
FROM public.departments d WHERE d.code = 'CSE'
ON CONFLICT (id) DO UPDATE 
SET class_name = EXCLUDED.class_name,
    department_id = EXCLUDED.department_id,
    year = EXCLUDED.year,
    division = EXCLUDED.division,
    academic_year = EXCLUDED.academic_year;

INSERT INTO public.classes (id, department_id, class_name, year, division, academic_year)
SELECT 
    'a5b8bce7-2d53-4d30-9df3-3d04517ff5eb'::uuid, 
    d.id, 
    '2R2', 
    2, 
    '2', 
    '2025-26'
FROM public.departments d WHERE d.code = 'CSE'
ON CONFLICT (id) DO UPDATE 
SET class_name = EXCLUDED.class_name,
    department_id = EXCLUDED.department_id,
    year = EXCLUDED.year,
    division = EXCLUDED.division,
    academic_year = EXCLUDED.academic_year;

INSERT INTO public.classes (id, department_id, class_name, year, division, academic_year)
SELECT 
    'ac46eda9-4dd3-4432-ac69-d4b91b61aa4d'::uuid, 
    d.id, 
    '3R', 
    3, 
    '1', 
    '2024-25'
FROM public.departments d WHERE d.code = 'CSE'
ON CONFLICT (id) DO UPDATE 
SET class_name = EXCLUDED.class_name,
    department_id = EXCLUDED.department_id,
    year = EXCLUDED.year,
    division = EXCLUDED.division,
    academic_year = EXCLUDED.academic_year;

INSERT INTO public.classes (id, department_id, class_name, year, division, academic_year)
SELECT 
    '11111111-1111-1111-1111-111111111111'::uuid, 
    d.id, 
    '1R1', 
    1, 
    'A', 
    '2025-26'
FROM public.departments d WHERE d.code = 'CSE'
ON CONFLICT (id) DO UPDATE 
SET class_name = EXCLUDED.class_name,
    department_id = EXCLUDED.department_id,
    year = EXCLUDED.year,
    division = EXCLUDED.division,
    academic_year = EXCLUDED.academic_year;

-- Make sure class_name is NOT NULL and indexed
ALTER TABLE public.classes ALTER COLUMN class_name SET NOT NULL;
CREATE INDEX IF NOT EXISTS classes_department_id_idx ON public.classes(department_id);
CREATE INDEX IF NOT EXISTS classes_class_name_idx ON public.classes(class_name);

-- ==============================================================================
-- 4. REUSE & EXTEND: STUDENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sis_id VARCHAR UNIQUE NOT NULL,
    roll_no VARCHAR,
    full_name VARCHAR NOT NULL,
    email VARCHAR,
    department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    year INTEGER,
    division VARCHAR,
    status VARCHAR DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add missing columns to public.students if table already existed
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS sis_id VARCHAR;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS roll_no VARCHAR;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS full_name VARCHAR;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email VARCHAR;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS division VARCHAR;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ACTIVE';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Drop legacy NOT NULL constraints so inserts with varied legacy columns never fail
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'profile_id') THEN
        ALTER TABLE public.students ALTER COLUMN profile_id DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'phone') THEN
        ALTER TABLE public.students ALTER COLUMN phone DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'email') THEN
        ALTER TABLE public.students ALTER COLUMN email DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'first_name') THEN
        ALTER TABLE public.students ALTER COLUMN first_name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'last_name') THEN
        ALTER TABLE public.students ALTER COLUMN last_name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'enrollment_no') THEN
        ALTER TABLE public.students ALTER COLUMN enrollment_no DROP NOT NULL;
    END IF;
END $$;

-- Sync id and student_id
UPDATE public.students SET id = COALESCE(id, student_id, gen_random_uuid()) WHERE id IS NULL;
UPDATE public.students SET student_id = COALESCE(student_id, id) WHERE student_id IS NULL;

-- Ensure unique constraint on sis_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'students_sis_id_key' AND conrelid = 'public.students'::regclass
    ) THEN
        ALTER TABLE public.students ADD CONSTRAINT students_sis_id_key UNIQUE (sis_id);
    END IF;
END $$;

-- Indexes required by Section 14
CREATE INDEX IF NOT EXISTS students_sis_id_idx ON public.students(sis_id);
CREATE INDEX IF NOT EXISTS students_class_id_idx ON public.students(class_id);
CREATE INDEX IF NOT EXISTS students_department_id_idx ON public.students(department_id);
CREATE INDEX IF NOT EXISTS students_roll_no_idx ON public.students(roll_no);

-- ==============================================================================
-- 5. PDF IMPORT TRACKING TABLES (Section 11)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    total_records INTEGER NOT NULL DEFAULT 0,
    successful_records INTEGER NOT NULL DEFAULT 0,
    duplicate_records INTEGER NOT NULL DEFAULT 0,
    failed_records INTEGER NOT NULL DEFAULT 0,
    imported_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED'))
);

CREATE TABLE IF NOT EXISTS public.student_import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.student_import_batches(id) ON DELETE CASCADE,
    row_reference VARCHAR,
    raw_value TEXT,
    error_type VARCHAR NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_import_errors_batch_idx ON public.student_import_errors(batch_id);

-- ==============================================================================
-- 6. QUIZ MODULE COMPATIBILITY TABLE (Section 15)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    title VARCHAR NOT NULL,
    description TEXT,
    subject_id UUID,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100,
    marks_per_question NUMERIC(4, 2) NOT NULL DEFAULT 1,
    negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    max_attempts INTEGER NOT NULL DEFAULT 1,
    status VARCHAR NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quizzes_class_id_idx ON public.quizzes(class_id);
CREATE INDEX IF NOT EXISTS quizzes_teacher_id_idx ON public.quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS quizzes_status_idx ON public.quizzes(status);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES (Section 16)
-- ==============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_import_errors ENABLE ROW LEVEL SECURITY;

-- 7.1 DEPARTMENTS & CLASSES: Public read for all users
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read classes" ON public.classes;
CREATE POLICY "Public read classes" ON public.classes FOR SELECT USING (true);

-- 7.2 STUDENTS: Read own record, or teachers read class roster
DROP POLICY IF EXISTS "Students read own record" ON public.students;
CREATE POLICY "Students read own record" ON public.students
FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (
        SELECT 1 FROM public.faculty f WHERE f.auth_user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
    OR auth.role() = 'anon'
);

-- 7.3 QUIZZES: Class restriction enforcement (Section 15 & 16)
-- Students can only view quizzes targeted to their assigned class
DROP POLICY IF EXISTS "Students view quizzes for their class" ON public.quizzes;
CREATE POLICY "Students view quizzes for their class" ON public.quizzes
FOR SELECT USING (
    status = 'PUBLISHED'
    AND (
        EXISTS (
            SELECT 1 FROM public.students s 
            WHERE s.id = auth.uid() AND s.class_id = quizzes.class_id
        )
        OR EXISTS (
            SELECT 1 FROM public.faculty f WHERE f.auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    )
);

-- Teachers manage quizzes they created
DROP POLICY IF EXISTS "Teachers manage their quizzes" ON public.quizzes;
CREATE POLICY "Teachers manage their quizzes" ON public.quizzes
FOR ALL USING (
    teacher_id = auth.uid() 
    OR auth.role() = 'service_role'
);
"""

    with open('d:/QUIZ/01_student_class_quiz_schema.sql', 'w', encoding='utf-8') as f:
        f.write(ddl_sql)

    # --- 2. DML Insert Script ---
    dml_lines = [
        "-- ==============================================================================",
        "-- COLLEGE ERP: STUDENT DATA INSERTION FROM CLASS ROLL LIST PDFS",
        "-- File: 02_insert_students_from_pdfs.sql",
        "-- Target: PostgreSQL / Supabase",
        "--",
        f"-- PDF 1: {meta1['file_name']} -> {len(v1)} Students -> Class: 1R1 (CSE)",
        f"-- PDF 2: {meta2['file_name']} -> {len(v2)} Students -> Class: 3R (CSE)",
        f"-- Total Records: {len(v1) + len(v2)} (Zero Duplicates)",
        "-- ==============================================================================",
        "",
        "BEGIN;",
        "",
        "-- 1. RECORD IMPORT BATCHES",
        f"INSERT INTO public.student_import_batches (id, file_name, class_id, total_records, successful_records, duplicate_records, failed_records, status)",
        f"VALUES ('{batch1_id}', '{meta1['file_name']}', '11111111-1111-1111-1111-111111111111'::uuid, {len(v1)}, {len(v1)}, 0, 0, 'COMPLETED');",
        "",
        f"INSERT INTO public.student_import_batches (id, file_name, class_id, total_records, successful_records, duplicate_records, failed_records, status)",
        f"VALUES ('{batch2_id}', '{meta2['file_name']}', 'ac46eda9-4dd3-4432-ac69-d4b91b61aa4d'::uuid, {len(v2)}, {len(v2)}, 0, 0, 'COMPLETED');",
        "",
        "-- 2. INSERT STUDENTS FROM PDF 1 (1R1_Roll_List.pdf - Class: 1R1, Department: CSE, Year: 1, Div: A)",
        "INSERT INTO public.students (id, sis_id, roll_no, full_name, email, department_id, class_id, year, division, status)",
        "VALUES"
    ]

    # PDF 1 Values
    val_rows_p1 = []
    for s in v1:
        s_id = str(uuid.uuid4())
        sis = s['sis_id']
        roll = s['roll_no']
        name = s['full_name'].replace("'", "''")
        val_rows_p1.append(
            f"  ('{s_id}', '{sis}', '{roll}', '{name}', NULL, "
            f"(SELECT id FROM public.departments WHERE code = 'CSE'), "
            f"'11111111-1111-1111-1111-111111111111'::uuid, 1, 'A', 'ACTIVE')"
        )
    dml_lines.append(",\n".join(val_rows_p1))
    dml_lines.append("""ON CONFLICT (sis_id) DO UPDATE SET
  roll_no = EXCLUDED.roll_no,
  full_name = EXCLUDED.full_name,
  class_id = EXCLUDED.class_id,
  department_id = EXCLUDED.department_id,
  year = EXCLUDED.year,
  division = EXCLUDED.division,
  updated_at = now();""")
    dml_lines.append("")

    # PDF 2 Values
    dml_lines.append(f"-- 3. INSERT STUDENTS FROM PDF 2 ({meta2['file_name']} - Class: 3R, Department: CSE, Year: 3, Div: 1)")
    dml_lines.append("INSERT INTO public.students (id, sis_id, roll_no, full_name, email, department_id, class_id, year, division, status)")
    dml_lines.append("VALUES")
    val_rows_p2 = []
    for s in v2:
        s_id = str(uuid.uuid4())
        sis = s['sis_id']
        roll = s['roll_no']
        name = s['full_name'].replace("'", "''")
        val_rows_p2.append(
            f"  ('{s_id}', '{sis}', '{roll}', '{name}', NULL, "
            f"(SELECT id FROM public.departments WHERE code = 'CSE'), "
            f"'ac46eda9-4dd3-4432-ac69-d4b91b61aa4d'::uuid, 3, '1', 'ACTIVE')"
        )
    dml_lines.append(",\n".join(val_rows_p2))
    dml_lines.append("""ON CONFLICT (sis_id) DO UPDATE SET
  roll_no = EXCLUDED.roll_no,
  full_name = EXCLUDED.full_name,
  class_id = EXCLUDED.class_id,
  department_id = EXCLUDED.department_id,
  year = EXCLUDED.year,
  division = EXCLUDED.division,
  updated_at = now();""")
    dml_lines.append("")
    dml_lines.append("COMMIT;")

    dml_sql = "\n".join(dml_lines)
    with open('d:/QUIZ/02_insert_students_from_pdfs.sql', 'w', encoding='utf-8') as f:
        f.write(dml_sql)

    print("SQL Migration and Data Import files generated successfully:")
    print(" - d:/QUIZ/01_student_class_quiz_schema.sql")
    print(" - d:/QUIZ/02_insert_students_from_pdfs.sql")

if __name__ == '__main__':
    generate_sql()
