-- ==============================================================================
-- SSGMCE SHEGAON - QUIZ MODULE FULL DATABASE SCHEMA
-- File: d:\QUIZ\03_quiz_module_complete_schema.sql
-- Conforms to: ERP_Quiz_Module_Complete_Study_Guide.pdf
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. QUIZZES TABLE (Configured by Teacher)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    title VARCHAR NOT NULL,
    description TEXT,
    subject VARCHAR NOT NULL DEFAULT 'Computer Science',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100,
    marks_per_question NUMERIC(4, 2) NOT NULL DEFAULT 1,
    negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0,
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
    max_attempts INTEGER NOT NULL DEFAULT 1,
    status VARCHAR NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quizzes_class_id_idx ON public.quizzes(class_id);
CREATE INDEX IF NOT EXISTS quizzes_status_idx ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS quizzes_teacher_id_idx ON public.quizzes(teacher_id);

-- 2. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR NOT NULL DEFAULT 'MCQ' CHECK (question_type IN ('MCQ', 'SINGLE_CHOICE', 'NUMERICAL')),
    marks NUMERIC(4, 2) NOT NULL DEFAULT 1,
    negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0,
    question_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_questions_quiz_id_idx ON public.quiz_questions(quiz_id);

-- 3. QUESTION OPTIONS TABLE (Never expose is_correct to student before submission!)
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_key VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D'
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS question_options_question_id_idx ON public.question_options(question_id);

-- 4. QUIZ ATTEMPTS TABLE (Student Session)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    time_taken_seconds INTEGER DEFAULT 0,
    score NUMERIC(6, 2) DEFAULT 0,
    accuracy NUMERIC(5, 2) DEFAULT 0, -- percentage
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    total_unanswered INTEGER DEFAULT 0,
    status VARCHAR NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_student_id_idx ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_status_idx ON public.quiz_attempts(status);

-- 5. STUDENT ANSWERS TABLE (Real-time Event Stored As Student Progresses)
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(5), -- 'A', 'B', 'C', 'D' or NULL
    is_correct BOOLEAN DEFAULT false,
    marks_obtained NUMERIC(4, 2) DEFAULT 0,
    question_opened_at TIMESTAMPTZ,
    answered_at TIMESTAMPTZ DEFAULT now(),
    time_taken_seconds NUMERIC(6, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS student_answers_attempt_id_idx ON public.student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS student_answers_question_id_idx ON public.student_answers(question_id);

-- 6. RLS POLICIES FOR QUIZ TABLES
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Quizzes RLS
DROP POLICY IF EXISTS "Anyone can read published quizzes" ON public.quizzes;
CREATE POLICY "Anyone can read published quizzes" ON public.quizzes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert/update quizzes" ON public.quizzes;
CREATE POLICY "Anyone can insert/update quizzes" ON public.quizzes FOR ALL USING (true);

-- Questions RLS
DROP POLICY IF EXISTS "Anyone can read questions" ON public.quiz_questions;
CREATE POLICY "Anyone can read questions" ON public.quiz_questions FOR ALL USING (true);

-- Options RLS
DROP POLICY IF EXISTS "Anyone can read options" ON public.question_options;
CREATE POLICY "Anyone can read options" ON public.question_options FOR ALL USING (true);

-- Attempts RLS
DROP POLICY IF EXISTS "Anyone can manage attempts" ON public.quiz_attempts;
CREATE POLICY "Anyone can manage attempts" ON public.quiz_attempts FOR ALL USING (true);

-- Answers RLS
DROP POLICY IF EXISTS "Anyone can manage answers" ON public.student_answers;
CREATE POLICY "Anyone can manage answers" ON public.student_answers FOR ALL USING (true);
