-- ==============================================================================
-- SSGMCE SHEGAON - STUDENT MODULE INTEGRATION FOR YOUR EXISTING SCHEMA
-- Script: student_module_for_existing_schema.sql
-- ==============================================================================
-- Designed specifically for your Supabase project which already contains:
--   - profiles
--   - syllabus_subjects, syllabus_units, syllabus_faculty, syllabus_documents, syllabus_curriculum_meta
--   - teacher_class_cards
--   - login_activity
--
-- This script safely and non-destructively:
--   1. Enhances 'profiles' with student ERP columns (roll_no, prn, cgpa, etc.)
--   2. Adds 'student_attendance' for student-level attendance tracking
--   3. Adds 'student_timetables' for student daily period schedule
--   4. Adds 'student_notifications' for announcements & alerts
--   5. Seeds student Shivam Sanjay Aghao (308637)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. EXTEND YOUR EXISTING 'profiles' TABLE WITH STUDENT FIELDS
-- Safe with 'ADD COLUMN IF NOT EXISTS' - will NOT break existing rows or columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_no INT DEFAULT 21;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_code TEXT DEFAULT '308637';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prn TEXT DEFAULT '202401088219';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Computer Science & Engineering';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_code TEXT DEFAULT 'CSE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT 'TY B.E. Computer Science and Engineering-A';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'A';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester INT DEFAULT 4;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2025-26';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+91 94221 88219';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT '2004-08-15';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT 'O+ve';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indian';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'OBC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS caste TEXT DEFAULT 'Kunbi';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT DEFAULT '+91 98230 41092';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permanent_address TEXT DEFAULT 'Plot 14, Gajanan Colony, Buldhana Road, Shegaon';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Buldhana';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '444203';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS father_name TEXT DEFAULT 'Mr. Sanjay Aghao';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mother_name TEXT DEFAULT 'Mrs. Sunita Aghao';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculty_mentor TEXT DEFAULT 'Dr. Rohan Deshmukh (HOD, CSE)';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admission_quota TEXT DEFAULT 'MHT-CET State Merit (Autonomous CAP)';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hostel_status TEXT DEFAULT 'Day Scholar';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2) DEFAULT 8.64;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sgpa NUMERIC(4,2) DEFAULT 8.84;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS attendance_rate NUMERIC(5,2) DEFAULT 82.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earned_credits INT DEFAULT 86;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_credits INT DEFAULT 160;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_standing TEXT DEFAULT 'Active Student (Autonomous)';

-- 3. STUDENT ATTENDANCE TABLE (For Student Portal Attendance View)
CREATE TABLE IF NOT EXISTS public.student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL DEFAULT '308637',
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT 'TH', -- TH, PR, TUT
  present_periods INT NOT NULL DEFAULT 0,
  total_periods INT NOT NULL DEFAULT 0,
  faculty_name TEXT,
  classroom TEXT DEFAULT 'LH-204',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. STUDENT TIMETABLES TABLE (For Student Schedule)
CREATE TABLE IF NOT EXISTS public.student_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL DEFAULT '308637',
  day_of_week TEXT NOT NULL,
  period_no INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'Theory',
  room TEXT NOT NULL DEFAULT 'LH-204',
  faculty_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. STUDENT NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT DEFAULT '308637',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  source TEXT NOT NULL DEFAULT 'Examination Cell',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ENABLE ROW LEVEL SECURITY & PERMISSIVE POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read student attendance" ON public.student_attendance;
CREATE POLICY "Public read student attendance" ON public.student_attendance FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read student timetables" ON public.student_timetables;
CREATE POLICY "Public read student timetables" ON public.student_timetables FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read student notifications" ON public.student_notifications;
CREATE POLICY "Public read student notifications" ON public.student_notifications FOR SELECT USING (true);

-- 7. SEED DEMO STUDENT PROFILE (SHIVAM SANJAY AGHAO - 308637)
INSERT INTO public.profiles (
  id, full_name, email, role, roll_no, student_code, prn,
  department, department_code, class_name, division, semester, academic_year,
  phone, date_of_birth, gender, blood_group, nationality, category, caste,
  emergency_contact, permanent_address, district, state, pincode,
  father_name, mother_name, faculty_mentor, admission_quota, hostel_status,
  cgpa, sgpa, attendance_rate, earned_credits, total_credits, academic_standing
)
VALUES (
  '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  'Shivam Sanjay Aghao',
  'shivam.aghao@ssgmce.ac.in',
  'student',
  21,
  '308637',
  '202401088219',
  'Computer Science & Engineering',
  'CSE',
  'TY B.E. Computer Science and Engineering-A',
  'A',
  4,
  '2025-26',
  '+91 94221 88219',
  '2004-08-15',
  'Male',
  'O+ve',
  'Indian',
  'OBC',
  'Kunbi',
  '+91 98230 41092',
  'Plot 14, Gajanan Colony, Buldhana Road, Shegaon',
  'Buldhana',
  'Maharashtra',
  '444203',
  'Mr. Sanjay Aghao',
  'Mrs. Sunita Aghao',
  'Dr. Rohan Deshmukh (HOD, CSE)',
  'MHT-CET State Merit (Autonomous CAP)',
  'Day Scholar',
  8.64,
  8.84,
  82.00,
  86,
  160,
  'Active Student (Autonomous)'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  student_code = EXCLUDED.student_code,
  prn = EXCLUDED.prn,
  cgpa = EXCLUDED.cgpa,
  attendance_rate = EXCLUDED.attendance_rate;

-- 8. SEED STUDENT ATTENDANCE RECORDS (If empty)
INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS220PC', 'Database Management Systems', 'TH', 28, 32, 'Dr. Rohan Deshmukh', 'LH-112'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE student_code = '308637');

INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS221PC', 'Compiler Design', 'TH', 22, 28, 'Prof. Priya Patil', 'LH-301'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE subject_code = '5CS221PC');

INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS223PE', 'Data Science & Statistics', 'TH', 19, 24, 'Prof. Rajesh Sharma', 'LH-204'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE subject_code = '5CS223PE');

INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS227MD', 'Computer Networks', 'TH', 18, 25, 'Prof. A. S. Manekar', 'LH-206'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE subject_code = '5CS227MD');

INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS228LB', 'Advanced Java Programming Lab', 'PR', 14, 16, 'Prof. K. N. Somwanshi', 'Lab-3'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE subject_code = '5CS228LB');

-- 9. SEED STUDENT TIMETABLE (Monday)
INSERT INTO public.student_timetables (student_code, day_of_week, period_no, start_time, end_time, subject_code, subject_name, session_type, room, faculty_name)
SELECT '308637', 'Monday', 1, '10:00:00', '11:00:00', '5CS220PC', 'Database Management Systems', 'Theory', 'LH-112', 'Dr. Rohan Deshmukh'
WHERE NOT EXISTS (SELECT 1 FROM public.student_timetables WHERE student_code = '308637' AND day_of_week = 'Monday' AND period_no = 1);

INSERT INTO public.student_timetables (student_code, day_of_week, period_no, start_time, end_time, subject_code, subject_name, session_type, room, faculty_name)
SELECT '308637', 'Monday', 2, '11:00:00', '12:00:00', '5CS221PC', 'Compiler Design', 'Theory', 'LH-301', 'Prof. Priya Patil'
WHERE NOT EXISTS (SELECT 1 FROM public.student_timetables WHERE student_code = '308637' AND day_of_week = 'Monday' AND period_no = 2);

INSERT INTO public.student_timetables (student_code, day_of_week, period_no, start_time, end_time, subject_code, subject_name, session_type, room, faculty_name)
SELECT '308637', 'Monday', 3, '12:30:00', '13:30:00', '5CS223PE', 'Data Science & Statistics', 'Theory', 'LH-204', 'Prof. Rajesh Sharma'
WHERE NOT EXISTS (SELECT 1 FROM public.student_timetables WHERE student_code = '308637' AND day_of_week = 'Monday' AND period_no = 3);

INSERT INTO public.student_timetables (student_code, day_of_week, period_no, start_time, end_time, subject_code, subject_name, session_type, room, faculty_name)
SELECT '308637', 'Monday', 4, '14:00:00', '16:00:00', '5CS228LB', 'Advanced Java Programming Lab', 'Practical', 'Lab-3', 'Prof. K. N. Somwanshi'
WHERE NOT EXISTS (SELECT 1 FROM public.student_timetables WHERE student_code = '308637' AND day_of_week = 'Monday' AND period_no = 4);

-- 10. SEED NOTIFICATIONS
INSERT INTO public.student_notifications (student_code, title, message, severity, source)
SELECT '308637', 'Mid-Semester Examination Schedule Released', 'Mid-Semester Exam commences from 15th April 2026. Hall tickets available in Examination cell.', 'info', 'Examination Cell'
WHERE NOT EXISTS (SELECT 1 FROM public.student_notifications WHERE student_code = '308637');

INSERT INTO public.student_notifications (student_code, title, message, severity, source)
SELECT '308637', 'Computer Networks Attendance Advisory', 'Your attendance in Computer Networks is at 72%. Attend next 2 lectures to exceed 75%.', 'warning', 'Academic Cell'
WHERE NOT EXISTS (SELECT 1 FROM public.student_notifications WHERE title LIKE '%Computer Networks Attendance%');

SELECT 'Student module successfully configured on your existing Supabase schema!' AS status;
