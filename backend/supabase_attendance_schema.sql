-- ==============================================================================
-- STEP 4: ATTENDANCE MANAGEMENT SUPABASE SCHEMA MIGRATION & RLS POLICIES
-- ==============================================================================

-- 1. Ensure columns on attendance_sessions
ALTER TABLE public.attendance_sessions 
    ADD COLUMN IF NOT EXISTS time_slot VARCHAR(100) DEFAULT '09:00 - 10:00',
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS attendance_date DATE;

-- Keep attendance_date populated from session_date
UPDATE public.attendance_sessions 
SET attendance_date = session_date 
WHERE attendance_date IS NULL;

-- 2. Ensure columns on attendance_records
ALTER TABLE public.attendance_records
    ADD COLUMN IF NOT EXISTS student_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS marked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 3. Ensure columns on student_attendance_subjects
ALTER TABLE public.student_attendance_subjects
    ADD COLUMN IF NOT EXISTS semester VARCHAR(50) DEFAULT 'V',
    ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2026-2027';

-- 4. Enable RLS with Permissive Policies for anon, authenticated, and service_role
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance_subjects ENABLE ROW LEVEL SECURITY;

-- Drop old policies if any to avoid duplication
DROP POLICY IF EXISTS "attendance_sessions_all_policy" ON public.attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_select" ON public.attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_insert" ON public.attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_update" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Insert sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Read sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Update sessions" ON public.attendance_sessions;

CREATE POLICY "attendance_sessions_all_policy" ON public.attendance_sessions
    FOR ALL
    TO public, anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_records_all_policy" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_records_select" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_records_insert" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_records_update" ON public.attendance_records;
DROP POLICY IF EXISTS "Insert records" ON public.attendance_records;
DROP POLICY IF EXISTS "Read records" ON public.attendance_records;
DROP POLICY IF EXISTS "Update records" ON public.attendance_records;

CREATE POLICY "attendance_records_all_policy" ON public.attendance_records
    FOR ALL
    TO public, anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "student_attendance_subjects_all_policy" ON public.student_attendance_subjects;
CREATE POLICY "student_attendance_subjects_all_policy" ON public.student_attendance_subjects
    FOR ALL
    TO public, anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 5. Grant Permissions
GRANT ALL ON TABLE public.attendance_sessions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.attendance_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.student_attendance_subjects TO anon, authenticated, service_role;

-- 6. Create or Replace View v_recent_attendance
CREATE OR REPLACE VIEW public.v_recent_attendance AS
SELECT 
    ses.id,
    ses.session_code AS id_display,
    ses.session_date,
    to_char(ses.session_date::timestamp with time zone, 'DD Mon YYYY'::text) AS date_formatted,
    ses.department_code,
    ses.class_name,
    ses.subject_code,
    ses.subject_name,
    ses.period_number,
    ses.period,
    ses.time_slot,
    ses.session_type,
    ses.topic_taught,
    ses.present_count,
    ses.absent_count,
    ses.total_students,
    ses.attendance_rate,
    ses.status,
    ses.created_at,
    ses.teacher_id,
    t.full_name AS teacher_name,
    t.emp_code AS teacher_emp_code
FROM public.attendance_sessions ses
LEFT JOIN public.teachers t ON ses.teacher_id = t.id
ORDER BY ses.session_date DESC, ses.created_at DESC;

GRANT ALL ON TABLE public.v_recent_attendance TO anon, authenticated, service_role;

-- 7. Trigger to keep attendance_date and student_code consistent on insertion
CREATE OR REPLACE FUNCTION public.trg_fn_attendance_session_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.attendance_date IS NULL THEN
        NEW.attendance_date := NEW.session_date;
    END IF;
    IF NEW.period IS NULL AND NEW.period_number IS NOT NULL THEN
        NEW.period := NEW.period_number;
    END IF;
    IF NEW.period_number IS NULL AND NEW.period IS NOT NULL THEN
        NEW.period_number := NEW.period;
    END IF;
    IF NEW.session_code IS NULL THEN
        NEW.session_code := 'REC-' || to_char(NEW.session_date, 'YYYYMMDD') || '-' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_session_defaults ON public.attendance_sessions;
CREATE TRIGGER trg_attendance_session_defaults
    BEFORE INSERT ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fn_attendance_session_defaults();

