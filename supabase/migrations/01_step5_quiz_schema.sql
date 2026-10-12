-- ==============================================================================
-- SSGMCE AUTONOMOUS COLLEGE ERP — STEP 5: ASSESSMENT & ONLINE QUIZ PORTAL
-- Complete Production-Grade PostgreSQL / Supabase Cloud Schema
-- Supports Student, Teacher/Faculty, and Admin roles
-- ==============================================================================

-- 1. CLEANUP & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE: quizzes
-- ==============================================================================
DROP TABLE IF EXISTS public.result_change_logs CASCADE;
DROP TABLE IF EXISTS public.result_publication_logs CASCADE;
DROP TABLE IF EXISTS public.quiz_results CASCADE;
DROP TABLE IF EXISTS public.student_answer_options CASCADE;
DROP TABLE IF EXISTS public.student_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;

CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NULL REFERENCES public.subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    total_questions INTEGER DEFAULT 0,
    total_marks NUMERIC(8,2) DEFAULT 0,
    passing_marks NUMERIC(8,2) DEFAULT 0,
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_attempts INTEGER DEFAULT 1,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_options BOOLEAN DEFAULT false,
    negative_marking BOOLEAN DEFAULT false,
    negative_marks_per_question NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'closed', 'archived')),
    result_published BOOLEAN DEFAULT false,
    result_published_at TIMESTAMPTZ NULL,
    result_published_by UUID NULL REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_quiz_duration CHECK (duration_minutes > 0),
    CONSTRAINT chk_quiz_times CHECK (end_time > start_time),
    CONSTRAINT chk_quiz_total_marks CHECK (total_marks >= 0),
    CONSTRAINT chk_quiz_passing_marks CHECK (passing_marks >= 0 AND passing_marks <= total_marks)
);

CREATE INDEX idx_quizzes_teacher ON public.quizzes(teacher_id);
CREATE INDEX idx_quizzes_class ON public.quizzes(class_id);
CREATE INDEX idx_quizzes_subject ON public.quizzes(subject_id);
CREATE INDEX idx_quizzes_status ON public.quizzes(status);
CREATE INDEX idx_quizzes_times ON public.quizzes(start_time, end_time);

-- ==============================================================================
-- 3. TABLE: quiz_questions
-- ==============================================================================
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'short_answer', 'descriptive')),
    marks NUMERIC(6,2) DEFAULT 1.0,
    negative_marks NUMERIC(6,2) DEFAULT 0.0,
    explanation TEXT,
    hint TEXT,
    question_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON public.quiz_questions(quiz_id, question_order);

-- ==============================================================================
-- 4. TABLE: question_options
-- ==============================================================================
CREATE TABLE public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER DEFAULT 1,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_question_options_q ON public.question_options(question_id);
CREATE INDEX idx_question_options_order ON public.question_options(question_id, option_order);

-- ==============================================================================
-- 5. TABLE: quiz_attempts
-- ==============================================================================
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ NULL,
    auto_submitted BOOLEAN DEFAULT false,
    submission_reason VARCHAR(100),
    status VARCHAR(30) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'evaluated', 'cancelled')),
    total_questions INTEGER DEFAULT 0,
    attempted_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    unanswered_questions INTEGER DEFAULT 0,
    raw_marks NUMERIC(8,2) DEFAULT 0.0,
    negative_marks NUMERIC(8,2) DEFAULT 0.0,
    final_marks NUMERIC(8,2) DEFAULT 0.0,
    percentage NUMERIC(6,2) DEFAULT 0.0,
    result_status VARCHAR(20) DEFAULT 'pending' CHECK (result_status IN ('pass', 'fail', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_quiz_student_attempt UNIQUE(quiz_id, student_id, attempt_number)
);

CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_status ON public.quiz_attempts(status);

-- ==============================================================================
-- 6. TABLE: student_answers
-- ==============================================================================
CREATE TABLE public.student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_option_id UUID NULL REFERENCES public.question_options(id) ON DELETE SET NULL,
    answer_text TEXT NULL,
    is_answered BOOLEAN DEFAULT false,
    is_correct BOOLEAN NULL,
    marks_awarded NUMERIC(8,2) DEFAULT 0.0,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ NULL,
    evaluated_by UUID NULL REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_attempt_question UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_student_answers_attempt ON public.student_answers(attempt_id);
CREATE INDEX idx_student_answers_question ON public.student_answers(question_id);

-- ==============================================================================
-- 7. TABLE: student_answer_options (For multiple_choice with multi-select)
-- ==============================================================================
CREATE TABLE public.student_answer_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_answer_id UUID NOT NULL REFERENCES public.student_answers(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_student_answer_option UNIQUE(student_answer_id, option_id)
);

CREATE INDEX idx_student_answer_options_sa ON public.student_answer_options(student_answer_id);

-- ==============================================================================
-- 8. TABLE: quiz_results (Finalized & Publishable Results)
-- ==============================================================================
CREATE TABLE public.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    total_marks NUMERIC(8,2) DEFAULT 0.0,
    marks_obtained NUMERIC(8,2) DEFAULT 0.0,
    percentage NUMERIC(6,2) DEFAULT 0.0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    unanswered_questions INTEGER DEFAULT 0,
    rank INTEGER NULL,
    result_status VARCHAR(20) DEFAULT 'pending' CHECK (result_status IN ('pass', 'fail', 'pending')),
    teacher_remarks TEXT,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_quiz_result_attempt UNIQUE(quiz_id, student_id, attempt_id)
);

CREATE INDEX idx_quiz_results_quiz ON public.quiz_results(quiz_id);
CREATE INDEX idx_quiz_results_student ON public.quiz_results(student_id);
CREATE INDEX idx_quiz_results_published ON public.quiz_results(published);
CREATE INDEX idx_quiz_results_rank ON public.quiz_results(quiz_id, rank);

-- ==============================================================================
-- 9. TABLE: result_publication_logs (Audit Trail for Publish / Unpublish)
-- ==============================================================================
CREATE TABLE public.result_publication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    action VARCHAR(30) NOT NULL CHECK (action IN ('published', 'unpublished')),
    performed_by UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    previous_status BOOLEAN,
    new_status BOOLEAN
);

CREATE INDEX idx_pub_logs_quiz ON public.result_publication_logs(quiz_id);
CREATE INDEX idx_pub_logs_performed ON public.result_publication_logs(performed_at DESC);

-- ==============================================================================
-- 10. TABLE: result_change_logs (Audit Trail for Manual Mark Modifications)
-- ==============================================================================
CREATE TABLE public.result_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES public.quiz_results(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    previous_marks NUMERIC(8,2) NOT NULL,
    new_marks NUMERIC(8,2) NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX idx_change_logs_result ON public.result_change_logs(result_id);
CREATE INDEX idx_change_logs_quiz ON public.result_change_logs(quiz_id);
CREATE INDEX idx_change_logs_student ON public.result_change_logs(student_id);

-- ==============================================================================
-- 11. SECURITY VIEWS (Hide is_correct from Student Queries)
-- ==============================================================================

-- Student Question View (options without is_correct)
CREATE OR REPLACE VIEW public.v_student_quiz_questions AS
SELECT 
    qq.id AS question_id,
    qq.quiz_id,
    qq.question_text,
    qq.question_type,
    qq.marks,
    qq.negative_marks,
    qq.hint,
    qq.question_order,
    qo.id AS option_id,
    qo.option_text,
    qo.option_order
FROM public.quiz_questions qq
LEFT JOIN public.question_options qo ON qq.id = qo.question_id
ORDER BY qq.question_order, qo.option_order;

-- Student Result View (returns marks ONLY IF published)
CREATE OR REPLACE VIEW public.v_student_quiz_results AS
SELECT 
    qr.id AS result_id,
    qr.quiz_id,
    q.title AS quiz_title,
    q.description AS quiz_description,
    q.class_id,
    c.class_name,
    s.code AS subject_code,
    s.name AS subject_name,
    qr.student_id,
    st.student_code,
    st.full_name AS student_name,
    qr.attempt_id,
    CASE WHEN qr.published = true THEN qr.total_marks ELSE NULL END AS total_marks,
    CASE WHEN qr.published = true THEN qr.marks_obtained ELSE NULL END AS marks_obtained,
    CASE WHEN qr.published = true THEN qr.percentage ELSE NULL END AS percentage,
    CASE WHEN qr.published = true THEN qr.correct_answers ELSE NULL END AS correct_answers,
    CASE WHEN qr.published = true THEN qr.wrong_answers ELSE NULL END AS wrong_answers,
    CASE WHEN qr.published = true THEN qr.unanswered_questions ELSE NULL END AS unanswered_questions,
    CASE WHEN qr.published = true THEN qr.rank ELSE NULL END AS rank,
    CASE WHEN qr.published = true THEN qr.result_status ELSE 'PENDING_RELEASE' END AS result_status,
    CASE WHEN qr.published = true THEN qr.teacher_remarks ELSE NULL END AS teacher_remarks,
    qr.published,
    qr.published_at,
    qa.started_at,
    qa.submitted_at
FROM public.quiz_results qr
JOIN public.quizzes q ON qr.quiz_id = q.id
JOIN public.students st ON qr.student_id = st.id
JOIN public.classes c ON q.class_id = c.id
LEFT JOIN public.subjects s ON q.subject_id = s.id
JOIN public.quiz_attempts qa ON qr.attempt_id = qa.id;

-- Complete Class Result Export View (INCLUDES UNATTEMPTED STUDENTS)
CREATE OR REPLACE VIEW public.v_quiz_complete_class_export AS
SELECT 
    q.id AS quiz_id,
    q.title AS quiz_title,
    q.total_marks AS quiz_total_marks,
    q.passing_marks AS quiz_passing_marks,
    q.result_published,
    q.class_id,
    c.class_name,
    st.id AS student_id,
    st.student_code,
    st.roll_no,
    st.full_name AS student_name,
    st.email AS student_email,
    qa.id AS attempt_id,
    CASE 
        WHEN qa.id IS NULL THEN 'NOT_ATTEMPTED'
        ELSE qa.status 
    END AS attempt_status,
    COALESCE(qr.marks_obtained, 0.0) AS marks_obtained,
    COALESCE(qr.percentage, 0.0) AS percentage,
    COALESCE(qr.correct_answers, 0) AS correct_answers,
    COALESCE(qr.wrong_answers, 0) AS wrong_answers,
    COALESCE(qr.unanswered_questions, q.total_questions) AS unanswered_questions,
    qr.rank,
    CASE 
        WHEN qa.id IS NULL THEN 'ABSENT'
        ELSE COALESCE(qr.result_status, 'pending')
    END AS final_status,
    qr.teacher_remarks,
    qa.started_at,
    qa.submitted_at
FROM public.quizzes q
JOIN public.classes c ON q.class_id = c.id
JOIN public.students st ON (st.class_id = q.class_id OR st.class_name = c.class_name)
LEFT JOIN public.quiz_attempts qa ON (qa.quiz_id = q.id AND qa.student_id = st.id AND qa.attempt_number = 1)
LEFT JOIN public.quiz_results qr ON (qr.quiz_id = q.id AND qr.student_id = st.id AND qr.attempt_id = qa.id)
ORDER BY q.id, st.roll_no;

-- ==============================================================================
-- 12. STORED FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 12.1 Auto-evaluation of a Quiz Attempt
CREATE OR REPLACE FUNCTION public.fn_evaluate_quiz_attempt(p_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_quiz RECORD;
    v_attempt RECORD;
    v_q RECORD;
    v_ans RECORD;
    v_correct_opt RECORD;
    v_is_correct BOOLEAN;
    v_marks_awarded NUMERIC(8,2);
    v_correct_count INTEGER := 0;
    v_wrong_count INTEGER := 0;
    v_unanswered_count INTEGER := 0;
    v_raw_marks NUMERIC(8,2) := 0.0;
    v_negative_marks NUMERIC(8,2) := 0.0;
    v_final_marks NUMERIC(8,2) := 0.0;
    v_percentage NUMERIC(6,2) := 0.0;
    v_result_status VARCHAR(20) := 'fail';
BEGIN
    -- Get attempt & quiz info
    SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Attempt not found');
    END IF;

    SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_attempt.quiz_id;

    -- Iterate through each question of the quiz
    FOR v_q IN SELECT * FROM public.quiz_questions WHERE quiz_id = v_quiz.id ORDER BY question_order LOOP
        SELECT * INTO v_ans FROM public.student_answers WHERE attempt_id = p_attempt_id AND question_id = v_q.id;
        
        IF NOT FOUND OR v_ans.is_answered IS FALSE OR (v_ans.selected_option_id IS NULL AND v_ans.answer_text IS NULL) THEN
            -- Unanswered
            v_unanswered_count := v_unanswered_count + 1;
            IF FOUND THEN
                UPDATE public.student_answers SET is_answered = false, is_correct = false, marks_awarded = 0 WHERE id = v_ans.id;
            END IF;
        ELSE
            -- Answered: Single choice / True-False / Multiple Choice
            IF v_q.question_type IN ('single_choice', 'true_false') THEN
                SELECT is_correct INTO v_is_correct FROM public.question_options WHERE id = v_ans.selected_option_id;
                v_is_correct := COALESCE(v_is_correct, false);
                
                IF v_is_correct THEN
                    v_marks_awarded := v_q.marks;
                    v_correct_count := v_correct_count + 1;
                    v_raw_marks := v_raw_marks + v_marks_awarded;
                ELSE
                    v_wrong_count := v_wrong_count + 1;
                    IF v_quiz.negative_marking THEN
                        v_marks_awarded := -1 * COALESCE(v_q.negative_marks, v_quiz.negative_marks_per_question, 0);
                        v_negative_marks := v_negative_marks + ABS(v_marks_awarded);
                    ELSE
                        v_marks_awarded := 0;
                    END IF;
                END IF;

                UPDATE public.student_answers 
                SET is_answered = true, is_correct = v_is_correct, marks_awarded = v_marks_awarded, evaluated_at = NOW()
                WHERE id = v_ans.id;

            ELSIF v_q.question_type = 'multiple_choice' THEN
                -- Multi-select options evaluation
                DECLARE
                    v_total_correct_opts INTEGER;
                    v_selected_correct_opts INTEGER;
                    v_selected_wrong_opts INTEGER;
                BEGIN
                    SELECT COUNT(*) INTO v_total_correct_opts FROM public.question_options WHERE question_id = v_q.id AND is_correct = true;
                    
                    SELECT COUNT(*) INTO v_selected_correct_opts 
                    FROM public.student_answer_options sao
                    JOIN public.question_options qo ON sao.option_id = qo.id
                    WHERE sao.student_answer_id = v_ans.id AND qo.is_correct = true;

                    SELECT COUNT(*) INTO v_selected_wrong_opts 
                    FROM public.student_answer_options sao
                    JOIN public.question_options qo ON sao.option_id = qo.id
                    WHERE sao.student_answer_id = v_ans.id AND qo.is_correct = false;

                    IF v_selected_wrong_opts = 0 AND v_selected_correct_opts = v_total_correct_opts AND v_total_correct_opts > 0 THEN
                        v_is_correct := true;
                        v_marks_awarded := v_q.marks;
                        v_correct_count := v_correct_count + 1;
                        v_raw_marks := v_raw_marks + v_marks_awarded;
                    ELSE
                        v_is_correct := false;
                        v_wrong_count := v_wrong_count + 1;
                        IF v_quiz.negative_marking THEN
                            v_marks_awarded := -1 * COALESCE(v_q.negative_marks, v_quiz.negative_marks_per_question, 0);
                            v_negative_marks := v_negative_marks + ABS(v_marks_awarded);
                        ELSE
                            v_marks_awarded := 0;
                        END IF;
                    END IF;

                    UPDATE public.student_answers 
                    SET is_answered = true, is_correct = v_is_correct, marks_awarded = v_marks_awarded, evaluated_at = NOW()
                    WHERE id = v_ans.id;
                END;
            ELSE
                -- Short answer / descriptive: set pending manual evaluation or auto exact string match
                v_marks_awarded := 0;
                UPDATE public.student_answers SET is_answered = true, evaluated_at = NOW() WHERE id = v_ans.id;
            END IF;
        END IF;
    END LOOP;

    -- Aggregate final marks
    v_final_marks := GREATEST(0.0, v_raw_marks - v_negative_marks);
    IF v_quiz.total_marks > 0 THEN
        v_percentage := ROUND((v_final_marks / v_quiz.total_marks * 100)::numeric, 2);
    ELSE
        v_percentage := 0.0;
    END IF;

    IF v_final_marks >= COALESCE(v_quiz.passing_marks, 0) THEN
        v_result_status := 'pass';
    ELSE
        v_result_status := 'fail';
    END IF;

    -- Update attempt record
    UPDATE public.quiz_attempts
    SET 
        status = 'evaluated',
        total_questions = v_quiz.total_questions,
        attempted_questions = v_correct_count + v_wrong_count,
        correct_answers = v_correct_count,
        wrong_answers = v_wrong_count,
        unanswered_questions = v_unanswered_count,
        raw_marks = v_raw_marks,
        negative_marks = v_negative_marks,
        final_marks = v_final_marks,
        percentage = v_percentage,
        result_status = v_result_status,
        updated_at = NOW()
    WHERE id = p_attempt_id;

    -- Insert or Update finalized quiz_results record
    INSERT INTO public.quiz_results (
        quiz_id, student_id, attempt_id, total_marks, marks_obtained, percentage,
        correct_answers, wrong_answers, unanswered_questions, result_status,
        published, created_at, updated_at
    )
    VALUES (
        v_quiz.id, v_attempt.student_id, p_attempt_id, v_quiz.total_marks, v_final_marks, v_percentage,
        v_correct_count, v_wrong_count, v_unanswered_count, v_result_status,
        v_quiz.result_published, NOW(), NOW()
    )
    ON CONFLICT (quiz_id, student_id, attempt_id) DO UPDATE SET
        total_marks = EXCLUDED.total_marks,
        marks_obtained = EXCLUDED.marks_obtained,
        percentage = EXCLUDED.percentage,
        correct_answers = EXCLUDED.correct_answers,
        wrong_answers = EXCLUDED.wrong_answers,
        unanswered_questions = EXCLUDED.unanswered_questions,
        result_status = EXCLUDED.result_status,
        published = v_quiz.result_published,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'final_marks', v_final_marks,
        'percentage', v_percentage,
        'result_status', v_result_status,
        'correct_answers', v_correct_count,
        'wrong_answers', v_wrong_count,
        'unanswered_questions', v_unanswered_count
    );
END;
$$ LANGUAGE plpgsql;

-- 12.2 Function to Publish Quiz Results
CREATE OR REPLACE FUNCTION public.fn_publish_quiz_results(
    p_quiz_id UUID,
    p_performed_by UUID,
    p_reason TEXT DEFAULT 'Official release of assessment results'
)
RETURNS JSONB AS $$
DECLARE
    v_prev_status BOOLEAN;
BEGIN
    SELECT result_published INTO v_prev_status FROM public.quizzes WHERE id = p_quiz_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Quiz not found');
    END IF;

    -- Update quiz record
    UPDATE public.quizzes 
    SET 
        result_published = true,
        result_published_at = NOW(),
        result_published_by = p_performed_by,
        updated_at = NOW()
    WHERE id = p_quiz_id;

    -- Update all results for this quiz to published
    UPDATE public.quiz_results 
    SET published = true, published_at = NOW(), updated_at = NOW() 
    WHERE quiz_id = p_quiz_id;

    -- Recalculate ranks across students for this quiz
    WITH ranked AS (
        SELECT id, DENSE_RANK() OVER (ORDER BY marks_obtained DESC, percentage DESC) AS rnk
        FROM public.quiz_results
        WHERE quiz_id = p_quiz_id
    )
    UPDATE public.quiz_results qr
    SET rank = ranked.rnk
    FROM ranked
    WHERE qr.id = ranked.id;

    -- Audit log
    INSERT INTO public.result_publication_logs (
        quiz_id, action, performed_by, performed_at, reason, previous_status, new_status
    )
    VALUES (
        p_quiz_id, 'published', p_performed_by, NOW(), p_reason, v_prev_status, true
    );

    RETURN jsonb_build_object('success', true, 'quiz_id', p_quiz_id, 'status', 'published');
END;
$$ LANGUAGE plpgsql;

-- 12.3 Function to Unpublish Quiz Results
CREATE OR REPLACE FUNCTION public.fn_unpublish_quiz_results(
    p_quiz_id UUID,
    p_performed_by UUID,
    p_reason TEXT DEFAULT 'Results withdrawn for verification'
)
RETURNS JSONB AS $$
DECLARE
    v_prev_status BOOLEAN;
BEGIN
    SELECT result_published INTO v_prev_status FROM public.quizzes WHERE id = p_quiz_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Quiz not found');
    END IF;

    UPDATE public.quizzes 
    SET 
        result_published = false,
        updated_at = NOW()
    WHERE id = p_quiz_id;

    UPDATE public.quiz_results 
    SET published = false, updated_at = NOW() 
    WHERE quiz_id = p_quiz_id;

    INSERT INTO public.result_publication_logs (
        quiz_id, action, performed_by, performed_at, reason, previous_status, new_status
    )
    VALUES (
        p_quiz_id, 'unpublished', p_performed_by, NOW(), p_reason, v_prev_status, false
    );

    RETURN jsonb_build_object('success', true, 'quiz_id', p_quiz_id, 'status', 'unpublished');
END;
$$ LANGUAGE plpgsql;

-- 12.4 Function to Manually Modify a Student's Result (With Audit Log)
CREATE OR REPLACE FUNCTION public.fn_modify_student_result(
    p_result_id UUID,
    p_new_marks NUMERIC,
    p_changed_by UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_res RECORD;
    v_quiz RECORD;
    v_new_pct NUMERIC(6,2);
    v_new_status VARCHAR(20);
BEGIN
    SELECT * INTO v_res FROM public.quiz_results WHERE id = p_result_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Result not found');
    END IF;

    SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_res.quiz_id;

    IF p_new_marks > v_res.total_marks THEN
        RETURN jsonb_build_object('success', false, 'message', 'New marks cannot exceed total marks');
    END IF;

    v_new_pct := ROUND((p_new_marks / v_res.total_marks * 100)::numeric, 2);
    IF p_new_marks >= COALESCE(v_quiz.passing_marks, 0) THEN
        v_new_status := 'pass';
    ELSE
        v_new_status := 'fail';
    END IF;

    -- Audit log before update
    INSERT INTO public.result_change_logs (
        result_id, student_id, quiz_id, previous_marks, new_marks,
        previous_status, new_status, changed_by, changed_at, reason
    )
    VALUES (
        p_result_id, v_res.student_id, v_res.quiz_id, v_res.marks_obtained, p_new_marks,
        v_res.result_status, v_new_status, p_changed_by, NOW(), p_reason
    );

    -- Update result
    UPDATE public.quiz_results
    SET 
        marks_obtained = p_new_marks,
        percentage = v_new_pct,
        result_status = v_new_status,
        teacher_remarks = COALESCE(teacher_remarks, '') || ' [Mod: ' || p_reason || ']',
        updated_at = NOW()
    WHERE id = p_result_id;

    -- Recalculate ranks for quiz
    WITH ranked AS (
        SELECT id, DENSE_RANK() OVER (ORDER BY marks_obtained DESC, percentage DESC) AS rnk
        FROM public.quiz_results
        WHERE quiz_id = v_res.quiz_id
    )
    UPDATE public.quiz_results qr
    SET rank = ranked.rnk
    FROM ranked
    WHERE qr.id = ranked.id;

    RETURN jsonb_build_object(
        'success', true,
        'result_id', p_result_id,
        'new_marks', p_new_marks,
        'new_percentage', v_new_pct,
        'new_status', v_new_status
    );
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_publication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_change_logs ENABLE ROW LEVEL SECURITY;

-- Permissive operational policies
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
        'quizzes', 'quiz_questions', 'question_options', 'quiz_attempts',
        'student_answers', 'student_answer_options', 'quiz_results',
        'result_publication_logs', 'result_change_logs'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_all_policy ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY %I_all_policy ON public.%I FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl, tbl);
        EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role, postgres;', tbl);
    END LOOP;
END $$;

