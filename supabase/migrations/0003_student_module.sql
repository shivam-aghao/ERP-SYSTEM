-- ==============================================================================
-- SSGMCE SHEGAON - AUTONOMOUS COLLEGE ERP SYSTEM
-- Migration: 0003_student_module.sql
-- Comprehensive Student Module Schema: Profiles, Academic Metrics,
-- Timetables, Curriculum/Syllabus, Documents, Notifications, and Views
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. STUDENT PROFILES (Extends public.students)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  prn TEXT NOT NULL UNIQUE,                       -- Permanent Registration Number (e.g. '202401088219')
  date_of_birth DATE NOT NULL DEFAULT '2004-08-15',
  gender TEXT NOT NULL DEFAULT 'Male' CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group TEXT NOT NULL DEFAULT 'O+ve',
  nationality TEXT NOT NULL DEFAULT 'Indian',
  category TEXT NOT NULL DEFAULT 'OBC' CHECK (category IN ('OPEN', 'OBC', 'SC', 'ST', 'VJNT', 'EWS')),
  caste TEXT DEFAULT 'Kunbi',
  primary_mobile TEXT NOT NULL DEFAULT '+91 94221 88219',
  institutional_email TEXT NOT NULL DEFAULT 'shivam.aghao@ssgmce.ac.in',
  emergency_contact TEXT NOT NULL DEFAULT '+91 98230 41092',
  permanent_address TEXT NOT NULL DEFAULT 'Plot 14, Gajanan Colony, Buldhana Road, Shegaon',
  district TEXT NOT NULL DEFAULT 'Buldhana',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL DEFAULT '444203',
  father_name TEXT NOT NULL DEFAULT 'Mr. Sanjay Aghao',
  mother_name TEXT NOT NULL DEFAULT 'Mrs. Sunita Aghao',
  faculty_mentor TEXT NOT NULL DEFAULT 'Dr. Rohan Deshmukh (HOD, CSE)',
  admission_quota TEXT NOT NULL DEFAULT 'MHT-CET State Merit (Autonomous CAP)',
  hostel_status TEXT NOT NULL DEFAULT 'Day Scholar',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id)
);

-- ==============================================================================
-- 3. STUDENT ACADEMIC METRICS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_academic_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  current_semester INT NOT NULL DEFAULT 4,
  cgpa NUMERIC(4,2) NOT NULL DEFAULT 8.64,
  latest_sgpa NUMERIC(4,2) NOT NULL DEFAULT 8.84,
  sem1_sgpa NUMERIC(4,2) NOT NULL DEFAULT 8.42,
  sem2_sgpa NUMERIC(4,2) NOT NULL DEFAULT 8.58,
  sem3_sgpa NUMERIC(4,2) NOT NULL DEFAULT 8.64,
  overall_attendance_pct NUMERIC(5,2) NOT NULL DEFAULT 82.00,
  earned_credits INT NOT NULL DEFAULT 86,
  total_credits INT NOT NULL DEFAULT 160,
  academic_standing TEXT NOT NULL DEFAULT 'Active Student (Autonomous)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, academic_year, current_semester)
);

-- ==============================================================================
-- 4. STUDENT TIMETABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  period_no INT NOT NULL CHECK (period_no BETWEEN 1 AND 8),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'Theory' CHECK (session_type IN ('Theory', 'Practical', 'Tutorial', 'Seminar')),
  room TEXT NOT NULL DEFAULT 'LH-204',
  faculty_name TEXT NOT NULL,
  batch TEXT NOT NULL DEFAULT 'All',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. CURRICULUM & SYLLABI
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.curriculum_syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  course_type TEXT NOT NULL DEFAULT 'Core' CHECK (course_type IN ('Core', 'PE1', 'PE2', 'OE', 'MD', 'Lab')),
  semester INT NOT NULL DEFAULT 4,
  credits INT NOT NULL DEFAULT 3,
  short_code TEXT NOT NULL,
  faculty_name TEXT NOT NULL,
  faculty_email TEXT,
  syllabus_overview TEXT,
  units JSONB NOT NULL DEFAULT '[]'::jsonb,
  textbooks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. STUDENT DOCUMENTS & CERTIFICATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('id-card', 'grade-cards', 'bonafide', 'library-clearance')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Verified' CHECK (status IN ('Verified', 'Pending', 'Expired')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  issuing_authority TEXT NOT NULL DEFAULT 'Dean (Academics), SSGMCE',
  document_metadata JSONB DEFAULT '{}'::jsonb,
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. STUDENT NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'success', 'error')),
  source TEXT NOT NULL DEFAULT 'Examination Cell',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. UNIFIED AGGREGATE VIEWS FOR STUDENT MODULE
-- ==============================================================================

-- 8.1 VIEW: FULL STUDENT PROFILE
CREATE OR REPLACE VIEW public.view_student_full_profile AS
SELECT
  s.id AS student_id,
  s.student_code,
  s.roll_no,
  s.full_name,
  c.id AS class_id,
  c.name AS class_name,
  c.division,
  c.academic_year AS class_academic_year,
  d.id AS department_id,
  d.code AS department_code,
  d.name AS department_name,
  sp.prn,
  sp.date_of_birth,
  sp.gender,
  sp.blood_group,
  sp.nationality,
  sp.category,
  sp.caste,
  sp.primary_mobile,
  sp.institutional_email,
  sp.emergency_contact,
  sp.permanent_address,
  sp.district,
  sp.state,
  sp.pincode,
  sp.father_name,
  sp.mother_name,
  sp.faculty_mentor,
  sp.admission_quota,
  sp.hostel_status,
  sp.avatar_url,
  sam.current_semester,
  sam.cgpa,
  sam.latest_sgpa,
  sam.sem1_sgpa,
  sam.sem2_sgpa,
  sam.sem3_sgpa,
  sam.overall_attendance_pct,
  sam.earned_credits,
  sam.total_credits,
  sam.academic_standing
FROM public.students s
JOIN public.classes c ON s.class_id = c.id
JOIN public.departments d ON c.department_id = d.id
LEFT JOIN public.student_profiles sp ON s.id = sp.student_id
LEFT JOIN public.student_academic_metrics sam ON s.id = sam.student_id;

-- 8.2 VIEW: STUDENT DASHBOARD OVERVIEW
CREATE OR REPLACE VIEW public.view_student_dashboard_overview AS
SELECT
  v.student_id,
  v.student_code,
  v.roll_no,
  v.full_name,
  v.class_name,
  v.department_name,
  v.current_semester,
  v.cgpa,
  v.latest_sgpa,
  v.overall_attendance_pct,
  v.earned_credits,
  v.total_credits,
  v.academic_standing,
  (
    SELECT json_agg(t.*)
    FROM public.student_timetables t
    WHERE t.class_id = v.class_id
  ) AS timetable_schedule,
  (
    SELECT json_agg(n.*)
    FROM public.student_notifications n
    WHERE n.student_id = v.student_id OR n.student_id IS NULL
  ) AS notifications
FROM public.view_student_full_profile v;

-- ==============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated and anonymous clients (for ERP Student Demo)
CREATE POLICY "Public read student profiles" ON public.student_profiles FOR SELECT USING (true);
CREATE POLICY "Public update own profile" ON public.student_profiles FOR UPDATE USING (true);
CREATE POLICY "Public read academic metrics" ON public.student_academic_metrics FOR SELECT USING (true);
CREATE POLICY "Public read student timetables" ON public.student_timetables FOR SELECT USING (true);
CREATE POLICY "Public read curriculum syllabi" ON public.curriculum_syllabi FOR SELECT USING (true);
CREATE POLICY "Public read student documents" ON public.student_documents FOR SELECT USING (true);
CREATE POLICY "Public read student notifications" ON public.student_notifications FOR SELECT USING (true);

-- ==============================================================================
-- 10. SEED DATA FOR STUDENT SHIVAM AGHAO ('308637')
-- ==============================================================================

-- 10.1 Profile
INSERT INTO public.student_profiles (
  student_id, prn, date_of_birth, gender, blood_group, nationality,
  category, caste, primary_mobile, institutional_email, emergency_contact,
  permanent_address, district, state, pincode, father_name, mother_name,
  faculty_mentor, admission_quota, hostel_status
)
SELECT
  s.id,
  '202401088219',
  '2004-08-15',
  'Male',
  'O+ve',
  'Indian',
  'OBC',
  'Kunbi',
  '+91 94221 88219',
  'shivam.aghao@ssgmce.ac.in',
  '+91 98230 41092',
  'Plot 14, Gajanan Colony, Buldhana Road, Shegaon',
  'Buldhana',
  'Maharashtra',
  '444203',
  'Mr. Sanjay Aghao',
  'Mrs. Sunita Aghao',
  'Dr. Rohan Deshmukh (HOD, CSE)',
  'MHT-CET State Merit (Autonomous CAP)',
  'Day Scholar'
FROM public.students s
WHERE s.student_code = '308637'
ON CONFLICT (student_id) DO UPDATE
SET
  prn = EXCLUDED.prn,
  primary_mobile = EXCLUDED.primary_mobile,
  institutional_email = EXCLUDED.institutional_email;

-- 10.2 Academic Metrics
INSERT INTO public.student_academic_metrics (
  student_id, academic_year, current_semester, cgpa, latest_sgpa,
  sem1_sgpa, sem2_sgpa, sem3_sgpa, overall_attendance_pct,
  earned_credits, total_credits, academic_standing
)
SELECT
  s.id,
  '2025-26',
  4,
  8.64,
  8.84,
  8.42,
  8.58,
  8.64,
  82.00,
  86,
  160,
  'Active Student (Autonomous)'
FROM public.students s
WHERE s.student_code = '308637'
ON CONFLICT (student_id, academic_year, current_semester) DO UPDATE
SET
  cgpa = EXCLUDED.cgpa,
  latest_sgpa = EXCLUDED.latest_sgpa,
  overall_attendance_pct = EXCLUDED.overall_attendance_pct;

-- 10.3 Timetable Periods
INSERT INTO public.student_timetables (
  class_id, day_of_week, period_no, start_time, end_time,
  subject_code, subject_name, session_type, room, faculty_name
)
SELECT
  c.id, 'Monday', 1, '10:00:00', '11:00:00', '5CS220PC', 'Database Management Systems', 'Theory', 'LH-112', 'Dr. Rohan Deshmukh'
FROM public.classes c WHERE c.name = 'SY-CSE-A';

INSERT INTO public.student_timetables (
  class_id, day_of_week, period_no, start_time, end_time,
  subject_code, subject_name, session_type, room, faculty_name
)
SELECT
  c.id, 'Monday', 2, '11:00:00', '12:00:00', '5CS221PC', 'Compiler Design', 'Theory', 'LH-301', 'Prof. Priya Patil'
FROM public.classes c WHERE c.name = 'SY-CSE-A';

INSERT INTO public.student_timetables (
  class_id, day_of_week, period_no, start_time, end_time,
  subject_code, subject_name, session_type, room, faculty_name
)
SELECT
  c.id, 'Monday', 3, '12:30:00', '13:30:00', '5CS223PE', 'Data Science & Statistics', 'Theory', 'LH-204', 'Prof. Rajesh Sharma'
FROM public.classes c WHERE c.name = 'SY-CSE-A';

INSERT INTO public.student_timetables (
  class_id, day_of_week, period_no, start_time, end_time,
  subject_code, subject_name, session_type, room, faculty_name
)
SELECT
  c.id, 'Monday', 4, '14:00:00', '16:00:00', '5CS227LB', 'Advanced Java Programming Lab', 'Practical', 'Lab-3', 'Prof. K. N. Somwanshi'
FROM public.classes c WHERE c.name = 'SY-CSE-A';

-- 10.4 Curriculum Syllabus Subjects
INSERT INTO public.curriculum_syllabi (
  department_id, course_code, course_name, course_type, semester, credits,
  short_code, faculty_name, faculty_email, syllabus_overview, units, textbooks
)
SELECT
  d.id,
  '5CS220PC',
  'Database Management Systems',
  'Core',
  4,
  3,
  'DBMS',
  'Dr. Rohan Deshmukh',
  'rdeshmukh@ssgmce.ac.in',
  'Comprehensive foundation of relational databases, relational algebra, SQL optimization, and transaction ACID properties.',
  '[
    {"unit": 1, "title": "Introduction to Database Concepts & ER Modeling", "hours": 8},
    {"unit": 2, "title": "Relational Model, Schema Architecture & Relational Algebra", "hours": 8},
    {"unit": 3, "title": "Advanced SQL, Views, Triggers & PL/SQL Routines", "hours": 8},
    {"unit": 4, "title": "Normalization (1NF, 2NF, 3NF, BCNF) & Functional Dependencies", "hours": 8},
    {"unit": 5, "title": "Transaction Processing, Concurrency Control & Recovery", "hours": 8}
  ]'::jsonb,
  '[
    {"title": "Database System Concepts (7th Edition)", "author": "Silberschatz, Korth, Sudarshan"},
    {"title": "Fundamentals of Database Systems", "author": "Elmasri and Navathe"}
  ]'::jsonb
FROM public.departments d WHERE d.code = 'CSE'
ON CONFLICT (course_code) DO NOTHING;

INSERT INTO public.curriculum_syllabi (
  department_id, course_code, course_name, course_type, semester, credits,
  short_code, faculty_name, faculty_email, syllabus_overview, units, textbooks
)
SELECT
  d.id,
  '5CS221PC',
  'Compiler Design',
  'Core',
  4,
  4,
  'CD',
  'Prof. Priya Patil',
  'ppatil@ssgmce.ac.in',
  'Lexical analysis, syntax-directed translation, intermediate code generation, and runtime code optimization.',
  '[
    {"unit": 1, "title": "Lexical Analysis & Lex Tools", "hours": 8},
    {"unit": 2, "title": "Syntax Analysis & Top-Down / Bottom-Up Parsers", "hours": 10},
    {"unit": 3, "title": "Syntax-Directed Translation & Type Checking", "hours": 8},
    {"unit": 4, "title": "Intermediate Code Generation (Three-Address Code)", "hours": 8},
    {"unit": 5, "title": "Code Optimization & Code Generation", "hours": 8}
  ]'::jsonb,
  '[
    {"title": "Compilers: Principles, Techniques, and Tools (Dragon Book)", "author": "Aho, Lam, Sethi, Ullman"}
  ]'::jsonb
FROM public.departments d WHERE d.code = 'CSE'
ON CONFLICT (course_code) DO NOTHING;

-- 10.5 Documents
INSERT INTO public.student_documents (
  student_id, document_type, title, status, issue_date, issuing_authority, document_metadata
)
SELECT
  s.id,
  'id-card',
  'Smart RFID Student Identity Card',
  'Verified',
  '2024-08-01',
  'Dean (Students), SSGMCE Shegaon',
  '{"rfid_no": "RFID-88219-CSE", "valid_thru": "2028-06-30"}'::jsonb
FROM public.students s WHERE s.student_code = '308637';

INSERT INTO public.student_documents (
  student_id, document_type, title, status, issue_date, issuing_authority, document_metadata
)
SELECT
  s.id,
  'grade-cards',
  'Autonomous Semester Grade Sheets (Sem I - IV)',
  'Verified',
  '2026-01-15',
  'Controller of Examinations (CoE)',
  '{"cgpa": 8.64, "sgpa_sem4": 8.84, "passed_all": true}'::jsonb
FROM public.students s WHERE s.student_code = '308637';

INSERT INTO public.student_documents (
  student_id, document_type, title, status, issue_date, issuing_authority, document_metadata
)
SELECT
  s.id,
  'bonafide',
  'Institutional Bonafide & Library Clearances',
  'Verified',
  '2026-01-10',
  'Dean (Academics), SSGMCE',
  '{"reference": "SSGMCE/ACAD/2026/BONA-88219", "academic_year": "2025-26"}'::jsonb
FROM public.students s WHERE s.student_code = '308637';

-- 10.6 Notifications
INSERT INTO public.student_notifications (student_id, title, message, severity, source)
SELECT
  s.id,
  'Mid-Semester Examination Schedule',
  'Mid-Semester Exam Schedule released for CSE Sem IV. Examinations begin from 15th April 2026.',
  'error',
  'Examination Cell'
FROM public.students s WHERE s.student_code = '308637';

INSERT INTO public.student_notifications (student_id, title, message, severity, source)
SELECT
  s.id,
  'Computer Networks Attendance Advisory',
  'Your attendance in Computer Networks is at 72%, which is below the mandatory 75% threshold.',
  'warning',
  'Academic Cell'
FROM public.students s WHERE s.student_code = '308637';

INSERT INTO public.student_notifications (student_id, title, message, severity, source)
SELECT
  s.id,
  'Assignment 2 Uploaded',
  'Assignment 2 for Data Structures has been uploaded to the portal by Prof. Rajesh Sharma.',
  'success',
  'CSE Department'
FROM public.students s WHERE s.student_code = '308637';
