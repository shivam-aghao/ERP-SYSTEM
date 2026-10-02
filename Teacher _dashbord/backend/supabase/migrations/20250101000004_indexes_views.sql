-- ====================================================================
-- SSGMCE Teacher Dashboard ERP - Indexes & Analytical Views
-- Migration: 20250101000004_indexes_views.sql
-- ====================================================================

-- 1. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_faculty_date ON attendance_sessions(faculty_id, lecture_date);
CREATE INDEX IF NOT EXISTS idx_students_class_roll ON students(class_code, roll_no);
CREATE INDEX IF NOT EXISTS idx_timetable_faculty_day ON timetable(faculty_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_results_student_subject ON results(student_id, subject_code);

-- 2. Analytical View: Faculty Teaching Load & Class Overview
CREATE OR REPLACE VIEW view_faculty_dashboard_kpis AS
SELECT 
  f.id AS faculty_id,
  f.name AS faculty_name,
  f.employee_id,
  COUNT(DISTINCT s.code) AS total_subjects,
  COUNT(DISTINCT s.class_code) AS total_classes,
  COALESCE(ROUND(AVG(att.attendance_rate), 2), 0) AS average_attendance_rate,
  COUNT(DISTINCT att.id) AS total_sessions_conducted
FROM faculty f
LEFT JOIN subjects s ON s.faculty_id = f.id
LEFT JOIN attendance_sessions att ON att.faculty_id = f.id AND att.status = 'submitted'
GROUP BY f.id, f.name, f.employee_id;

-- 3. Analytical View: Student Subject Attendance Summary
CREATE OR REPLACE VIEW view_student_attendance_summary AS
SELECT 
  st.id AS student_id,
  st.roll_formatted,
  st.name AS student_name,
  st.class_code,
  sess.subject_code,
  COUNT(rec.id) AS total_lectures,
  COUNT(rec.id) FILTER (WHERE rec.status IN ('present', 'late')) AS attended_lectures,
  COUNT(rec.id) FILTER (WHERE rec.status = 'absent') AS absent_lectures,
  CASE 
    WHEN COUNT(rec.id) > 0 THEN 
      ROUND((COUNT(rec.id) FILTER (WHERE rec.status IN ('present', 'late'))::NUMERIC / COUNT(rec.id)::NUMERIC) * 100, 2)
    ELSE 0.00 
  END AS attendance_percentage
FROM students st
JOIN attendance_records rec ON rec.student_id = st.id
JOIN attendance_sessions sess ON sess.id = rec.session_id
WHERE sess.status = 'submitted'
GROUP BY st.id, st.roll_formatted, st.name, st.class_code, sess.subject_code;

