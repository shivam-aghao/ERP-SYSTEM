-- ==============================================================================
-- SSGMCE SHEGAON - AUTONOMOUS STUDENT ERP MODULE
-- Script: clean_student_module.sql
-- ==============================================================================
-- 100% Independent & Self-Contained.
-- Does NOT touch or modify your existing 'profiles' or faculty tables.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DEDICATED STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no INT NOT NULL DEFAULT 21,
  student_code TEXT NOT NULL UNIQUE DEFAULT '308637',
  prn TEXT NOT NULL UNIQUE DEFAULT '202401088219',
  full_name TEXT NOT NULL DEFAULT 'Shivam Sanjay Aghao',
  email TEXT NOT NULL DEFAULT 'shivam.aghao@ssgmce.ac.in',
  department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
  department_code TEXT NOT NULL DEFAULT 'CSE',
  class_name TEXT NOT NULL DEFAULT 'TY B.E. Computer Science and Engineering-A',
  division TEXT NOT NULL DEFAULT 'A',
  semester INT NOT NULL DEFAULT 4,
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  phone TEXT DEFAULT '+91 94221 88219',
  date_of_birth DATE DEFAULT '2004-08-15',
  gender TEXT DEFAULT 'Male',
  blood_group TEXT DEFAULT 'O+ve',
  nationality TEXT DEFAULT 'Indian',
  category TEXT DEFAULT 'OBC',
  caste TEXT DEFAULT 'Kunbi',
  emergency_contact TEXT DEFAULT '+91 98230 41092',
  permanent_address TEXT DEFAULT 'Plot 14, Gajanan Colony, Buldhana Road, Shegaon',
  district TEXT DEFAULT 'Buldhana',
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT DEFAULT '444203',
  father_name TEXT DEFAULT 'Mr. Sanjay Aghao',
  mother_name TEXT DEFAULT 'Mrs. Sunita Aghao',
  faculty_mentor TEXT DEFAULT 'Dr. Rohan Deshmukh (HOD, CSE)',
  admission_quota TEXT DEFAULT 'MHT-CET State Merit (Autonomous CAP)',
  hostel_status TEXT DEFAULT 'Day Scholar',
  cgpa NUMERIC(4,2) DEFAULT 8.64,
  sgpa NUMERIC(4,2) DEFAULT 8.84,
  attendance_rate NUMERIC(5,2) DEFAULT 82.00,
  earned_credits INT DEFAULT 86,
  total_credits INT DEFAULT 160,
  academic_standing TEXT DEFAULT 'Active Student (Autonomous)',
  avatar_url TEXT DEFAULT 'images/logo.png',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STUDENT ATTENDANCE TABLE
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

-- 4. STUDENT TIMETABLES TABLE
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

-- 6. ENABLE ROW LEVEL SECURITY & OPEN POLICIES
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read student profiles" ON public.student_profiles;
CREATE POLICY "Public read student profiles" ON public.student_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update own profile" ON public.student_profiles;
CREATE POLICY "Public update own profile" ON public.student_profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read student attendance" ON public.student_attendance;
CREATE POLICY "Public read student attendance" ON public.student_attendance FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read student timetables" ON public.student_timetables;
CREATE POLICY "Public read student timetables" ON public.student_timetables FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read student notifications" ON public.student_notifications;
CREATE POLICY "Public read student notifications" ON public.student_notifications FOR SELECT USING (true);

-- 7. SEED STUDENT SHIVAM AGHAO (308637)
INSERT INTO public.student_profiles (
  roll_no, student_code, prn, full_name, email,
  department, department_code, class_name, division, semester, academic_year,
  phone, date_of_birth, gender, blood_group, nationality, category, caste,
  emergency_contact, permanent_address, district, state, pincode,
  father_name, mother_name, faculty_mentor, admission_quota, hostel_status,
  cgpa, sgpa, attendance_rate, earned_credits, total_credits, academic_standing
)
VALUES (
  21, '308637', '202401088219', 'Shivam Sanjay Aghao', 'shivam.aghao@ssgmce.ac.in',
  'Computer Science & Engineering', 'CSE', 'TY B.E. Computer Science and Engineering-A', 'A', 4, '2025-26',
  '+91 94221 88219', '2004-08-15', 'Male', 'O+ve', 'Indian', 'OBC', 'Kunbi',
  '+91 98230 41092', 'Plot 14, Gajanan Colony, Buldhana Road, Shegaon', 'Buldhana', 'Maharashtra', '444203',
  'Mr. Sanjay Aghao', 'Mrs. Sunita Aghao', 'Dr. Rohan Deshmukh (HOD, CSE)',
  'MHT-CET State Merit (Autonomous CAP)', 'Day Scholar',
  8.64, 8.84, 82.00, 86, 160, 'Active Student (Autonomous)'
)
ON CONFLICT (student_code) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  prn = EXCLUDED.prn,
  cgpa = EXCLUDED.cgpa,
  attendance_rate = EXCLUDED.attendance_rate;

-- 8. SEED ATTENDANCE PERIODS
INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS220PC', 'Database Management Systems', 'TH', 28, 32, 'Dr. Rohan Deshmukh', 'LH-112'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE student_code = '308637' AND subject_code = '5CS220PC');

INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS221PC', 'Compiler Design', 'TH', 22, 28, 'Prof. Priya Patil', 'LH-301'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE student_code = '308637' AND subject_code = '5CS221PC');

INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS223PE', 'Data Science & Statistics', 'TH', 19, 24, 'Prof. Rajesh Sharma', 'LH-204'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE student_code = '308637' AND subject_code = '5CS223PE');

INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS227MD', 'Computer Networks', 'TH', 18, 25, 'Prof. A. S. Manekar', 'LH-206'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE student_code = '308637' AND subject_code = '5CS227MD');

INSERT INTO public.student_attendance (student_code, subject_code, subject_name, subject_type, present_periods, total_periods, faculty_name, classroom)
SELECT '308637', '5CS228LB', 'Advanced Java Programming Lab', 'PR', 14, 16, 'Prof. K. N. Somwanshi', 'Lab-3'
WHERE NOT EXISTS (SELECT 1 FROM public.student_attendance WHERE student_code = '308637' AND subject_code = '5CS228LB');

-- 9. SEED TIMETABLE PERIODS
INSERT INTO public.student_timetables (student_code, day_of_week, period_no, start_time, end_time, subject_code, subject_name, session_type, room, faculty_name)
SELECT '308637', 'Monday', 1, '10:00:00', '11:00:00', '5CS220PC', 'Database Management Systems', 'Theory', 'LH-112', 'Dr. Rohan Deshmukh'
WHERE NOT EXISTS (SELECT 1 FROM public.student_timetables WHERE student_code = '308637' AND day_of_week = 'Monday' AND period_no = 1);

INSERT INTO public.student_timetables (student_code, day_of_week, period_no, start_time, end_time, subject_code, subject_name, session_type, room, faculty_name)
SELECT '308637', 'Monday', 2, '11:00:00', '12:00:00', '5CS221PC', 'Compiler Design', 'Theory', 'LH-301', 'Prof. Priya Patil'
WHERE NOT EXISTS (SELECT 1 FROM public.student_timetables WHERE student_code = '308637' AND day_of_week = 'Monday' AND period_no = 2);

-- 10. SEED NOTIFICATIONS
INSERT INTO public.student_notifications (student_code, title, message, severity, source)
SELECT '308637', 'Mid-Semester Examination Schedule Released', 'Mid-Semester Exam commences from 15th April 2026. Hall tickets available in Examination cell.', 'info', 'Examination Cell'
WHERE NOT EXISTS (SELECT 1 FROM public.student_notifications WHERE student_code = '308637');

SELECT 'Student ERP tables created and seeded successfully!' AS status;
