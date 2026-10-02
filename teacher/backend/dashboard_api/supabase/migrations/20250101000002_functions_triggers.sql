-- ====================================================================
-- SSGMCE Teacher Dashboard ERP - Functions & Automated Triggers
-- Migration: 20250101000002_functions_triggers.sql
-- ====================================================================

-- Function 1: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to faculty
DROP TRIGGER IF EXISTS trigger_faculty_updated_at ON faculty;
CREATE TRIGGER trigger_faculty_updated_at
BEFORE UPDATE ON faculty
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to attendance_sessions
DROP TRIGGER IF EXISTS trigger_attendance_sessions_updated_at ON attendance_sessions;
CREATE TRIGGER trigger_attendance_sessions_updated_at
BEFORE UPDATE ON attendance_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function 2: Recalculate attendance session metrics upon record modification
CREATE OR REPLACE FUNCTION update_attendance_session_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_session_id UUID;
  v_present_count INT;
  v_absent_count INT;
  v_total INT;
  v_rate NUMERIC(5, 2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_session_id := OLD.session_id;
  ELSE
    v_session_id := NEW.session_id;
  END IF;

  SELECT 
    COUNT(*) FILTER (WHERE status IN ('present', 'late')),
    COUNT(*) FILTER (WHERE status = 'absent'),
    COUNT(*)
  INTO v_present_count, v_absent_count, v_total
  FROM attendance_records
  WHERE session_id = v_session_id;

  IF v_total > 0 THEN
    v_rate := ROUND((v_present_count::NUMERIC / v_total::NUMERIC) * 100, 2);
  ELSE
    v_rate := 0.00;
  END IF;

  UPDATE attendance_sessions
  SET 
    present_count = v_present_count,
    absent_count = v_absent_count,
    attendance_rate = v_rate,
    updated_at = now()
  WHERE id = v_session_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attendance_session_metrics ON attendance_records;
CREATE TRIGGER trigger_update_attendance_session_metrics
AFTER INSERT OR UPDATE OR DELETE ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION update_attendance_session_metrics();
