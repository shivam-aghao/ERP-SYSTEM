-- ====================================================================
-- SSGMCE Teacher Dashboard ERP - Core Schema Migration
-- Migration: 20250101000000_init_schema.sql
-- Description: Creates 13 relational tables with UUIDs, foreign keys, & checks
-- ====================================================================

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'laptop',
  description TEXT,
  head_of_dept TEXT,
  classes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  prefix TEXT DEFAULT 'Prof.',
  title TEXT NOT NULL,
  department_code TEXT NOT NULL REFERENCES departments(code) ON UPDATE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_initials TEXT,
  cabin_location TEXT,
  office_hours TEXT,
  qualification TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Classes Table
CREATE TABLE IF NOT EXISTS classes (
  code TEXT PRIMARY KEY,
  department_code TEXT NOT NULL REFERENCES departments(code) ON UPDATE CASCADE,
  name TEXT NOT NULL,
  semester TEXT NOT NULL,
  students_count INT DEFAULT 0,
  room TEXT,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_code TEXT NOT NULL REFERENCES classes(code) ON DELETE CASCADE ON UPDATE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  credits TEXT DEFAULT '4 Credits',
  icon TEXT DEFAULT 'book-open',
  lecture_time TEXT,
  semester TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no INT NOT NULL,
  roll_formatted TEXT NOT NULL,
  enrollment_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  class_code TEXT NOT NULL REFERENCES classes(code) ON DELETE CASCADE ON UPDATE CASCADE,
  department_code TEXT NOT NULL REFERENCES departments(code) ON UPDATE CASCADE,
  phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_code, roll_no)
);

-- 6. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  class_code TEXT NOT NULL REFERENCES classes(code) ON UPDATE CASCADE,
  subject_code TEXT NOT NULL REFERENCES subjects(code) ON UPDATE CASCADE,
  department_code TEXT NOT NULL REFERENCES departments(code) ON UPDATE CASCADE,
  lecture_date DATE NOT NULL,
  lecture_time TEXT NOT NULL,
  marking_mode TEXT DEFAULT 'swipe',
  total_students INT NOT NULL,
  present_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  attendance_rate NUMERIC(5, 2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  is_draft_saved BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lecture_date, class_code, subject_code, lecture_time)
);

-- 7. Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  roll_no INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_at TIMESTAMPTZ DEFAULT now(),
  marked_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
  remarks TEXT,
  UNIQUE(session_id, student_id)
);

-- 8. Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  slot_index INT NOT NULL CHECK (slot_index BETWEEN 1 AND 6),
  subject_code TEXT REFERENCES subjects(code) ON DELETE CASCADE ON UPDATE CASCADE,
  class_code TEXT REFERENCES classes(code) ON DELETE CASCADE ON UPDATE CASCADE,
  room TEXT,
  is_lab BOOLEAN DEFAULT false,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(faculty_id, day_of_week, slot_index, academic_year)
);

-- 9. Syllabus Progress Table
CREATE TABLE IF NOT EXISTS syllabus_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code TEXT NOT NULL REFERENCES subjects(code) ON DELETE CASCADE ON UPDATE CASCADE,
  class_code TEXT NOT NULL REFERENCES classes(code) ON DELETE CASCADE ON UPDATE CASCADE,
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  unit_number INT NOT NULL,
  unit_name TEXT NOT NULL,
  completion_percent INT DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subject_code, class_code, unit_number)
);

-- 10. Results Table
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL REFERENCES subjects(code) ON DELETE CASCADE ON UPDATE CASCADE,
  assessment_type TEXT NOT NULL,
  marks_obtained NUMERIC(5, 2),
  max_marks NUMERIC(5, 2),
  academic_year TEXT NOT NULL,
  semester TEXT,
  uploaded_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, subject_code, assessment_type, academic_year)
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'bell',
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'activity',
  icon_style TEXT DEFAULT 'blue',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Academic Terms Table
CREATE TABLE IF NOT EXISTS academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,
  semester_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
