-- ====================================================================
-- SSGMCE Teacher Dashboard ERP - Row Level Security (RLS) Policies
-- Migration: 20250101000001_rls_policies.sql
-- ====================================================================

-- Enable RLS on core tables
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 1. Faculty table: Authenticated users can view all faculty, only self can edit
CREATE POLICY "Faculty can view all faculty"
  ON faculty FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Faculty can update their own profile"
  ON faculty FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- 2. Attendance sessions: Faculty can see and manage sessions
CREATE POLICY "Faculty can view their own sessions"
  ON attendance_sessions FOR SELECT
  TO authenticated
  USING (faculty_id IN (SELECT id FROM faculty WHERE auth_user_id = auth.uid()));

CREATE POLICY "Faculty can create sessions"
  ON attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (faculty_id IN (SELECT id FROM faculty WHERE auth_user_id = auth.uid()));

CREATE POLICY "Faculty can update their sessions"
  ON attendance_sessions FOR UPDATE
  TO authenticated
  USING (faculty_id IN (SELECT id FROM faculty WHERE auth_user_id = auth.uid()));

-- 3. Attendance records: Managed via session ownership
CREATE POLICY "Faculty can view and mark attendance records"
  ON attendance_records FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM attendance_sessions 
      WHERE faculty_id IN (SELECT id FROM faculty WHERE auth_user_id = auth.uid())
    )
  );

-- 4. Results: Faculty can upload and modify their results
CREATE POLICY "Faculty can view and manage assessment results"
  ON results FOR ALL
  TO authenticated
  USING (true);

-- 5. Notifications: Recipients can view and update their notifications
CREATE POLICY "Faculty can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    recipient_faculty_id IS NULL OR 
    recipient_faculty_id IN (SELECT id FROM faculty WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Faculty can mark notifications read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_faculty_id IS NULL OR 
    recipient_faculty_id IN (SELECT id FROM faculty WHERE auth_user_id = auth.uid())
  );

-- 6. Students: Authenticated faculty can view student lists
CREATE POLICY "Faculty can view all students"
  ON students FOR SELECT
  TO authenticated
  USING (true);
