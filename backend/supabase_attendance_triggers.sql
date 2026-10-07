-- ==============================================================================
-- Supabase Trigger: Automatically Sync New Marked Records to Subject Aggregates
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_sync_attendance_record_to_subject()
RETURNS TRIGGER AS $$
DECLARE
    v_subject_code VARCHAR;
    v_student_code VARCHAR;
BEGIN
    -- 1. Resolve subject_code from attendance_sessions
    SELECT subject_code INTO v_subject_code
    FROM public.attendance_sessions
    WHERE id = NEW.session_id;

    -- 2. Resolve student_code from students table if missing
    IF NEW.student_code IS NULL AND NEW.student_id IS NOT NULL THEN
        SELECT student_code INTO v_student_code
        FROM public.students
        WHERE id = NEW.student_id;
        NEW.student_code := v_student_code;
    ELSE
        v_student_code := NEW.student_code;
    END IF;

    -- 3. Update student_attendance_subjects
    IF v_subject_code IS NOT NULL AND (v_student_code IS NOT NULL OR NEW.student_id IS NOT NULL) THEN
        UPDATE public.student_attendance_subjects
        SET 
            total_periods = total_periods + 1,
            present_periods = CASE 
                WHEN NEW.is_present = TRUE OR UPPER(NEW.status) = 'PRESENT' THEN present_periods + 1 
                ELSE present_periods 
            END,
            updated_at = NOW()
        WHERE (student_code = v_student_code OR student_id = NEW.student_id)
          AND (subject_code = v_subject_code OR subject_name ILIKE '%' || v_subject_code || '%');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_record_to_subject ON public.attendance_records;
CREATE TRIGGER trg_sync_record_to_subject
    BEFORE INSERT ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_attendance_record_to_subject();

