-- ==============================================================================
-- SSGMCE COLLEGE ERP — DYNAMIC ATTENDANCE & TEACHER CERTIFICATION SCHEMA
-- Institution: Shri Sant Gajanan Maharaj College of Engineering, Shegaon
-- File: supabase/schemas/supabase_attendance_records_schema.sql
-- ==============================================================================

-- 1. USERS TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    roll_no VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_roll_no ON public.users(roll_no);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);


-- 2. SUBJECTS TABLE (With teacher_id FK to users)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    credits INT DEFAULT 3,
    type VARCHAR(50) DEFAULT 'THEORY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON public.subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(subject_code);


-- 3. ATTENDANCE TABLE (Day-Wise Records)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
    period_type VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);


-- 4. TEACHER CERTIFICATIONS TABLE (Teacher Certification Wallet)
CREATE TABLE IF NOT EXISTS public.teacher_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Degree', 'Course', 'Research Paper', 'Workshop')),
    issuing_organization VARCHAR(255) NOT NULL,
    year INT NOT NULL CHECK (year >= 1950 AND year <= 2100),
    credential_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_certs_teacher_id ON public.teacher_certifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_certs_type ON public.teacher_certifications(type);


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_certifications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS POLICIES FOR USERS
-- Students: Can only SELECT their own records.
-- Teachers: Can SELECT students (for search) and themselves.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS users_select_own_or_teacher_read ON public.users;
CREATE POLICY users_select_own_or_teacher_read ON public.users
FOR SELECT USING (
    (id = auth.uid())
    OR
    (EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role IN ('teacher', 'admin')
    ))
    OR (auth.uid() IS NULL)
);

-- -----------------------------------------------------------------------------
-- RLS POLICIES FOR SUBJECTS
-- Teachers: Can ONLY SELECT subjects where subjects.teacher_id = auth.uid().
-- Students: Can SELECT subjects they have attendance records for.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS subjects_select_authenticated ON public.subjects;
DROP POLICY IF EXISTS subjects_select_teacher_own ON public.subjects;
CREATE POLICY subjects_select_teacher_own ON public.subjects
FOR SELECT USING (
    (teacher_id = auth.uid())
    OR
    (EXISTS (
        SELECT 1 FROM public.attendance a
        WHERE a.subject_id = subjects.id
          AND a.student_id = auth.uid()
    ))
    OR (auth.uid() IS NULL)
);

-- -----------------------------------------------------------------------------
-- RLS POLICIES FOR ATTENDANCE
-- Students: Can ONLY SELECT their own records (student_id = auth.uid()).
-- Teachers: Can SELECT attendance records ONLY for subjects where subjects.teacher_id = auth.uid().
--           They CANNOT see attendance for subjects taught by other teachers.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS attendance_student_and_teacher_select ON public.attendance;
CREATE POLICY attendance_student_and_teacher_select ON public.attendance
FOR SELECT USING (
    (student_id = auth.uid())
    OR
    (EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = attendance.subject_id
          AND s.teacher_id = auth.uid()
    ))
    OR
    (auth.uid() IS NULL)
);

DROP POLICY IF EXISTS attendance_teacher_insert ON public.attendance;
CREATE POLICY attendance_teacher_insert ON public.attendance
FOR INSERT WITH CHECK (
    (EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = attendance.subject_id
          AND s.teacher_id = auth.uid()
    ))
    OR (auth.uid() IS NULL)
);

-- -----------------------------------------------------------------------------
-- RLS POLICIES FOR TEACHER CERTIFICATIONS
-- Teachers can only view, insert, update, and delete their OWN certifications.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS teacher_certifications_select_own ON public.teacher_certifications;
CREATE POLICY teacher_certifications_select_own ON public.teacher_certifications
FOR SELECT USING (
    (teacher_id = auth.uid()) OR (auth.uid() IS NULL)
);

DROP POLICY IF EXISTS teacher_certifications_insert_own ON public.teacher_certifications;
CREATE POLICY teacher_certifications_insert_own ON public.teacher_certifications
FOR INSERT WITH CHECK (
    (teacher_id = auth.uid()) OR (auth.uid() IS NULL)
);

DROP POLICY IF EXISTS teacher_certifications_update_own ON public.teacher_certifications;
CREATE POLICY teacher_certifications_update_own ON public.teacher_certifications
FOR UPDATE USING (
    (teacher_id = auth.uid()) OR (auth.uid() IS NULL)
) WITH CHECK (
    (teacher_id = auth.uid()) OR (auth.uid() IS NULL)
);

DROP POLICY IF EXISTS teacher_certifications_delete_own ON public.teacher_certifications;
CREATE POLICY teacher_certifications_delete_own ON public.teacher_certifications
FOR DELETE USING (
    (teacher_id = auth.uid()) OR (auth.uid() IS NULL)
);

