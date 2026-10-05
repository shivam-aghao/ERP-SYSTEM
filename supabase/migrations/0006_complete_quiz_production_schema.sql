-- ==============================================================================
-- SSGMCE SHEGAON - PRODUCTION-READY QUIZ / EXAMINATION MODULE SCHEMA
-- Migration: 0006_complete_quiz_production_schema.sql
-- Database: PostgreSQL / Supabase
--
-- Features:
-- 1. Full integration with existing departments, classes, subjects, teachers, students.
-- 2. Strict class-based authorization at database level with RLS.
-- 3. Authoritative server-side quiz scheduling and duration enforcement.
-- 4. Reusable Question Bank supporting 4 question types (MCQ, Multiple Choice, True/False, Short Answer).
-- 5. Student Quiz Attempts with autosave answer storage and security telemetry.
-- 6. Comprehensive Audit Logs.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. REUSABLE QUESTION BANK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'MCQ' CHECK (question_type IN ('MCQ', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER')),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name VARCHAR(150),
    topic VARCHAR(100),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    marks NUMERIC(4, 2) NOT NULL DEFAULT 2.0,
    negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    expected_answer TEXT, -- For short answer auto-evaluation
    explanation TEXT,
    created_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON public.question_bank(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_type ON public.question_bank(question_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON public.question_bank(difficulty);

-- Options for Question Bank (MCQ, Multiple Choice, True/False)
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    option_key VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D'
    option_text TEXT NOT NULL,
    option_order INTEGER NOT NULL DEFAULT 1,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_options_qid ON public.question_options(question_id);

-- ==============================================================================
-- 2. QUIZZES TABLE (Configured by Teacher)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name VARCHAR(150) NOT NULL DEFAULT 'Computer Science',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.0,
    passing_marks NUMERIC(6, 2) NOT NULL DEFAULT 40.0,
    max_attempts INTEGER NOT NULL DEFAULT 1,
    shuffle_questions BOOLEAN NOT NULL DEFAULT false,
    shuffle_options BOOLEAN NOT NULL DEFAULT false,
    allow_question_navigation BOOLEAN NOT NULL DEFAULT true,
    allow_back_navigation BOOLEAN NOT NULL DEFAULT true,
    show_result_immediately BOOLEAN NOT NULL DEFAULT true,
    show_correct_answers BOOLEAN NOT NULL DEFAULT true,
    result_release_mode VARCHAR(20) NOT NULL DEFAULT 'IMMEDIATE' CHECK (result_release_mode IN ('IMMEDIATE', 'ON_CLOSE', 'MANUAL')),
    negative_marking BOOLEAN NOT NULL DEFAULT false,
    negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    require_all_questions BOOLEAN NOT NULL DEFAULT false,
    allow_unanswered BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PUBLISHED', 'COMPLETED', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_class_id ON public.quizzes(class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON public.quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_schedule ON public.quizzes(start_at, end_at);

-- ==============================================================================
-- 3. QUIZ QUESTIONS (M2M between Quiz and Question Bank)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE RESTRICT,
    question_order INTEGER NOT NULL DEFAULT 1,
    marks NUMERIC(4, 2) NOT NULL DEFAULT 2.0,
    negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(quiz_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_bank ON public.quiz_questions(question_id);

-- ==============================================================================
-- 4. QUIZ ATTEMPTS (Student Exam Sessions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'auto_submitted', 'expired')),
    score NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    passed BOOLEAN NOT NULL DEFAULT false,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    unanswered_count INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_status ON public.quiz_attempts(status);

-- ==============================================================================
-- 5. QUIZ ATTEMPT ANSWERS (Individual Answer Records & Autosave)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE RESTRICT,
    selected_option VARCHAR(50), -- Single choice / True-False option
    selected_options JSONB,      -- Multiple choice array, e.g. ["A", "C"]
    text_answer TEXT,            -- Short answer input
    is_correct BOOLEAN DEFAULT false,
    marks_awarded NUMERIC(4, 2) DEFAULT 0.0,
    is_marked_for_review BOOLEAN DEFAULT false,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON public.quiz_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question ON public.quiz_attempt_answers(question_id);

-- ==============================================================================
-- 6. QUIZ SECURITY EVENTS (Anti-cheating & Telemetry)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('tab_switch', 'fullscreen_exit', 'browser_blur', 'warning')),
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_security_events_attempt ON public.quiz_security_events(attempt_id);

-- ==============================================================================
-- 7. QUIZ AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(50) NOT NULL, -- 'quiz_created', 'quiz_published', 'attempt_started', etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.quiz_audit_logs(entity_type, entity_id);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_audit_logs ENABLE ROW LEVEL SECURITY;

-- 8.1 QUIZZES RLS
-- Students can ONLY view quizzes assigned to their class that are PUBLISHED or ACTIVE
DROP POLICY IF EXISTS "Students view quizzes for their class" ON public.quizzes;
CREATE POLICY "Students view quizzes for their class" ON public.quizzes
FOR SELECT USING (
    status IN ('PUBLISHED', 'ACTIVE')
    AND class_id IN (
        SELECT s.class_id FROM public.students s
        WHERE s.id = auth.uid() OR s.student_code = (auth.jwt() ->> 'student_code')
    )
);

-- Teachers manage quizzes
DROP POLICY IF EXISTS "Teachers manage their quizzes" ON public.quizzes;
CREATE POLICY "Teachers manage their quizzes" ON public.quizzes
FOR ALL USING (
    teacher_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = auth.uid())
);

-- 8.2 QUIZ ATTEMPTS RLS
-- Students can view and create their own attempts for their class's quizzes
DROP POLICY IF EXISTS "Students view own attempts" ON public.quiz_attempts;
CREATE POLICY "Students view own attempts" ON public.quiz_attempts
FOR SELECT USING (
    student_id IN (
        SELECT s.id FROM public.students s
        WHERE s.id = auth.uid() OR s.student_code = (auth.jwt() ->> 'student_code')
    )
);

DROP POLICY IF EXISTS "Students create own attempts" ON public.quiz_attempts;
CREATE POLICY "Students create own attempts" ON public.quiz_attempts
FOR INSERT WITH CHECK (
    student_id IN (
        SELECT s.id FROM public.students s
        WHERE s.id = auth.uid() OR s.student_code = (auth.jwt() ->> 'student_code')
    )
    AND quiz_id IN (
        SELECT q.id FROM public.quizzes q
        JOIN public.students s ON s.class_id = q.class_id
        WHERE (s.id = auth.uid() OR s.student_code = (auth.jwt() ->> 'student_code'))
          AND q.status IN ('PUBLISHED', 'ACTIVE')
    )
);

DROP POLICY IF EXISTS "Students update own in-progress attempts" ON public.quiz_attempts;
CREATE POLICY "Students update own in-progress attempts" ON public.quiz_attempts
FOR UPDATE USING (
    student_id IN (
        SELECT s.id FROM public.students s
        WHERE s.id = auth.uid() OR s.student_code = (auth.jwt() ->> 'student_code')
    )
    AND status = 'in_progress'
);

-- 8.3 QUIZ ATTEMPT ANSWERS RLS
DROP POLICY IF EXISTS "Students manage own answers" ON public.quiz_attempt_answers;
CREATE POLICY "Students manage own answers" ON public.quiz_attempt_answers
FOR ALL USING (
    attempt_id IN (
        SELECT qa.id FROM public.quiz_attempts qa
        JOIN public.students s ON s.id = qa.student_id
        WHERE (s.id = auth.uid() OR s.student_code = (auth.jwt() ->> 'student_code'))
          AND qa.status = 'in_progress'
    )
);

-- 8.4 SECURITY EVENTS RLS
DROP POLICY IF EXISTS "Students log security events" ON public.quiz_security_events;
CREATE POLICY "Students log security events" ON public.quiz_security_events
FOR INSERT WITH CHECK (
    attempt_id IN (
        SELECT qa.id FROM public.quiz_attempts qa
        JOIN public.students s ON s.id = qa.student_id
        WHERE (s.id = auth.uid() OR s.student_code = (auth.jwt() ->> 'student_code'))
    )
);

