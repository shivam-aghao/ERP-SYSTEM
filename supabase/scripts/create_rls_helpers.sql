-- ====================================================================
-- SSGMCE COLLEGE ERP — RLS SECURITY DEFINER HELPER FUNCTIONS
-- ====================================================================

-- 1. Get Student ID for currently authenticated session
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT s.id
  FROM public.students s
  WHERE (auth.uid() IS NOT NULL AND s.id = auth.uid())
     OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(s.email) = LOWER(auth.jwt() ->> 'email'))
     OR (auth.jwt() -> 'user_metadata' ->> 'user_id' IS NOT NULL AND s.student_code = (auth.jwt() -> 'user_metadata' ->> 'user_id'))
     OR (auth.jwt() ->> 'email' IS NOT NULL AND s.student_code = split_part(auth.jwt() ->> 'email', '@', 1))
  LIMIT 1;
$$;

-- 2. Get Student Code for currently authenticated session
CREATE OR REPLACE FUNCTION public.current_student_code()
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT s.student_code
  FROM public.students s
  WHERE s.id = public.current_student_id()
  LIMIT 1;
$$;

-- 3. Get Student Class ID for currently authenticated session
CREATE OR REPLACE FUNCTION public.current_student_class_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT s.class_id
  FROM public.students s
  WHERE s.id = public.current_student_id()
  LIMIT 1;
$$;

-- 4. Get Teacher ID for currently authenticated session
CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT t.id
  FROM public.teachers t
  WHERE (auth.uid() IS NOT NULL AND t.id = auth.uid())
     OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
     OR (auth.jwt() -> 'user_metadata' ->> 'user_id' IS NOT NULL AND t.emp_code = (auth.jwt() -> 'user_metadata' ->> 'user_id'))
     OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(t.email) = LOWER(replace(split_part(auth.jwt() ->> 'email', '@', 1), '.', '') || '@ssgmce.ac.in'))
  LIMIT 1;
$$;

-- 5. Get Admin ID for currently authenticated session
CREATE OR REPLACE FUNCTION public.current_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT a.id
  FROM public.admins a
  WHERE (auth.uid() IS NOT NULL AND a.id = auth.uid())
     OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(a.email) = LOWER(auth.jwt() ->> 'email'))
     OR (auth.jwt() -> 'user_metadata' ->> 'user_id' IS NOT NULL AND LOWER(a.username) = LOWER(auth.jwt() -> 'user_metadata' ->> 'user_id'))
     OR (LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('admin', 'super_admin') AND LOWER(a.username) = 'admin')
  LIMIT 1;
$$;

-- 6. Check if current user is Admin or Super Admin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE (auth.uid() IS NOT NULL AND a.id = auth.uid())
       OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(a.email) = LOWER(auth.jwt() ->> 'email'))
       OR (auth.jwt() -> 'user_metadata' ->> 'user_id' IS NOT NULL AND LOWER(a.username) = LOWER(auth.jwt() -> 'user_metadata' ->> 'user_id'))
  ) OR (
    LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('admin', 'super_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE (ur.user_id = auth.uid() OR ur.user_id = public.current_teacher_id() OR ur.user_id = public.current_admin_id())
      AND ur.status = 'active'
      AND LOWER(r.name) IN ('admin', 'super_admin')
  );
$$;

-- 7. Check if current user is HOD
CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_admin_or_superadmin() OR (
    LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'hod'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE (ur.user_id = auth.uid() OR ur.user_id = public.current_teacher_id())
      AND ur.status = 'active'
      AND LOWER(r.name) = 'hod'
  );
$$;

-- 8. Check if current user is Accountant
CREATE OR REPLACE FUNCTION public.is_accountant()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_admin_or_superadmin() OR (
    LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'accountant'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE (ur.user_id = auth.uid() OR ur.user_id = public.current_teacher_id() OR ur.user_id = public.current_admin_id())
      AND ur.status = 'active'
      AND LOWER(r.name) = 'accountant'
  );
$$;

-- 9. Check if current user is Teacher/Faculty
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_admin_or_superadmin() OR public.is_hod() OR (
    public.current_teacher_id() IS NOT NULL
  ) OR (
    LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('teacher', 'faculty')
  );
$$;

-- 10. Check if current user is Student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.current_student_id() IS NOT NULL 
     OR LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'student';
$$;

-- 11. Check if Teacher is assigned to a specific class
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_admin_or_superadmin() OR public.is_hod() OR EXISTS (
    SELECT 1 FROM public.faculty_class_assignments fca
    WHERE fca.faculty_id = public.current_teacher_id()
      AND fca.class_id = p_class_id
      AND fca.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.faculty_subject_assignments fsa
    WHERE fsa.faculty_id = public.current_teacher_id()
      AND fsa.class_id = p_class_id
      AND fsa.status = 'active'
  );
$$;

-- 12. Check if Teacher is assigned to a specific subject
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_subject(p_subject_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_admin_or_superadmin() OR public.is_hod() OR EXISTS (
    SELECT 1 FROM public.faculty_subject_assignments fsa
    WHERE fsa.faculty_id = public.current_teacher_id()
      AND fsa.subject_id = p_subject_id
      AND fsa.status = 'active'
  );
$$;

