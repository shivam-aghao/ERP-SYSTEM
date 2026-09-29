-- ==============================================================================
-- SSGMCE SHEGAON - TEACHER ATTENDANCE ERP SYSTEM
-- Migration: 0001_init.sql
-- Database Schema, Indexes, View, Triggers, and Row-Level Security (RLS) Policies
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. CORE ENTITY TABLES
-- ==============================================================================

-- 3.1 DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g. 'CSE', 'ETC', 'MECH'
  name TEXT NOT NULL,        -- e.g. 'Computer Science & Engineering'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 CLASSES (DIVISIONS)
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,         -- e.g. 'SY-CSE-A', 'FY-CSE-A'
  academic_year TEXT NOT NULL DEFAULT '2024-25',
  division TEXT,              -- e.g. 'A', 'B'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(department_id, name)
);

-- 3.3 SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,         -- e.g. '3CS205MD', 'CS302'
  name TEXT NOT NULL,         -- e.g. 'Database Management', 'Data Structures'
  type TEXT NOT NULL DEFAULT 'THEORY' CHECK (type IN ('THEORY', 'LAB', 'PRACTICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(department_id, code)
);

-- 3.4 TEACHERS (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  emp_code TEXT NOT NULL UNIQUE, -- e.g. 'EMP-CSE-1042'
  designation TEXT NOT NULL DEFAULT 'Associate Professor',
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 CLASS CARDS (Deck Configuration per Teacher)
CREATE TABLE IF NOT EXISTS public.class_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, subject_id)
);

-- 3.6 STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  roll_no INT NOT NULL,
  student_code TEXT NOT NULL UNIQUE, -- e.g. Admission No. '308979' or PRN
  full_name TEXT NOT NULL,
  is_provisional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, roll_no)
);

-- 3.7 ATTENDANCE SESSIONS (Date-wise & Period-wise parent submission)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_card_id UUID REFERENCES public.class_cards(id) ON DELETE SET NULL,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  attendance_date DATE NOT NULL,
  period INT NOT NULL,
  time_slot TEXT,
  topic_taught TEXT,
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, subject_id, attendance_date, period)
);

-- 3.8 ATTENDANCE RECORDS (Student-wise marked status per session)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- 3.9 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_classes_department ON public.classes(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_department ON public.subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_no);
CREATE INDEX IF NOT EXISTS idx_class_cards_teacher ON public.class_cards(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class ON public.attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON public.attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_teacher ON public.notifications(teacher_id, is_read);

-- ==============================================================================
-- 5. AUTO-UPDATE TIMESTAMP TRIGGERS
-- ==============================================================================
CREATE OR REPLACE TRIGGER trg_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_class_cards_updated_at BEFORE UPDATE ON public.class_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_attendance_sessions_updated_at BEFORE UPDATE ON public.attendance_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 6. AGGREGATE POSTGRES VIEW: student_attendance_summary
-- Powers the "Previous 10 Lecture Attendance" column & stats in the Roster
-- ==============================================================================
CREATE OR REPLACE VIEW public.student_attendance_summary AS
SELECT
  s.id AS student_id,
  s.roll_no,
  s.student_code,
  s.full_name,
  s.class_id,
  sub.id AS subject_id,
  COUNT(rec.id) AS total_sessions,
  COUNT(rec.id) FILTER (WHERE rec.status = 'PRESENT') AS present_count,
  COUNT(rec.id) FILTER (WHERE rec.status = 'ABSENT') AS absent_count,
  ROUND(
    COALESCE(
      (COUNT(rec.id) FILTER (WHERE rec.status = 'PRESENT')::NUMERIC / NULLIF(COUNT(rec.id), 0)) * 100,
      0
    ),
    2
  ) AS attendance_percentage,
  COALESCE(
    (
      SELECT json_agg(h.status ORDER BY h.attendance_date ASC, h.period ASC)
      FROM (
        SELECT r2.status, s2.attendance_date, s2.period
        FROM public.attendance_records r2
        JOIN public.attendance_sessions s2 ON r2.session_id = s2.id
        WHERE r2.student_id = s.id AND s2.subject_id = sub.id AND s2.status = 'SUBMITTED'
        ORDER BY s2.attendance_date DESC, s2.period DESC
        LIMIT 10
      ) h
    ),
    '[]'::json
  ) AS recent_history
FROM public.students s
CROSS JOIN public.subjects sub
LEFT JOIN public.attendance_sessions sess ON sess.class_id = s.class_id AND sess.subject_id = sub.id AND sess.status = 'SUBMITTED'
LEFT JOIN public.attendance_records rec ON rec.session_id = sess.id AND rec.student_id = s.id
GROUP BY s.id, s.roll_no, s.student_code, s.full_name, s.class_id, sub.id;

-- ==============================================================================
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7.1 DEPARTMENTS (Read-only for all authenticated & anon)
CREATE POLICY "Public read departments" ON public.departments
  FOR SELECT TO authenticated, anon USING (true);

-- 7.2 CLASSES (Read-only for all authenticated & anon)
CREATE POLICY "Public read classes" ON public.classes
  FOR SELECT TO authenticated, anon USING (true);

-- 7.3 SUBJECTS (Read-only for all authenticated & anon)
CREATE POLICY "Public read subjects" ON public.subjects
  FOR SELECT TO authenticated, anon USING (true);

-- 7.4 TEACHERS
CREATE POLICY "Teachers can read their own profile" ON public.teachers
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Teachers can update their own profile" ON public.teachers
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Public read teacher metadata" ON public.teachers
  FOR SELECT TO anon USING (true);

-- 7.5 CLASS CARDS (Teachers manage only their own cards)
CREATE POLICY "Teachers manage their class cards" ON public.class_cards
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 7.6 STUDENTS
-- Teachers can SELECT students only for classes they hold a class card for
CREATE POLICY "Teachers view students in assigned classes" ON public.students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_cards
      WHERE class_cards.teacher_id = auth.uid()
        AND class_cards.class_id = students.class_id
    )
  );

-- Student Portal: Read-only access by student_code / roll
CREATE POLICY "Student portal read students" ON public.students
  FOR SELECT TO anon
  USING (true);

-- 7.7 ATTENDANCE SESSIONS
CREATE POLICY "Teachers manage attendance sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Student portal view submitted sessions" ON public.attendance_sessions
  FOR SELECT TO anon
  USING (status = 'SUBMITTED');

-- 7.8 ATTENDANCE RECORDS (Inherits session access)
CREATE POLICY "Teachers manage attendance records" ON public.attendance_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE attendance_sessions.id = attendance_records.session_id
        AND attendance_sessions.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE attendance_sessions.id = attendance_records.session_id
        AND attendance_sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Student portal read attendance records" ON public.attendance_records
  FOR SELECT TO anon
  USING (true);

-- 7.9 NOTIFICATIONS
CREATE POLICY "Teachers manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- ==============================================================================
-- 8. AUTH TRIGGER: Auto-create teacher record on signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.teachers (id, full_name, emp_code, designation, department_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Prof. Rajesh Sharma'),
    COALESCE(NEW.raw_user_meta_data->>'emp_code', 'EMP-CSE-1042'),
    COALESCE(NEW.raw_user_meta_data->>'designation', 'Associate Professor'),
    (SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_teacher();

-- ==============================================================================
-- 9. REALTIME REPLICATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
