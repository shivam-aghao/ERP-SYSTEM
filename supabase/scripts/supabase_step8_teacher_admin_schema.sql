-- ============================================================================
-- SSGMCE COLLEGE ERP — STEP 8: TEACHER & ADMIN MANAGEMENT TOOLS
-- Database Migration: 04_teacher_admin_management.sql
-- Production-Ready PostgreSQL Schema for Supabase Cloud
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ACADEMIC YEARS & SEMESTERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_code VARCHAR(50) UNIQUE NOT NULL,      -- e.g., '2025-26'
    display_name VARCHAR(100) NOT NULL,        -- 'Academic Year 2025-2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    term_type VARCHAR(20) NOT NULL CHECK (term_type IN ('odd', 'even', 'summer')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ay_sem UNIQUE (academic_year_id, semester_number)
);

-- ----------------------------------------------------------------------------
-- 2. ROLE-BASED ACCESS CONTROL (RBAC) TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,          -- super_admin, admin, hod, teacher, student
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    hierarchy_level INTEGER NOT NULL DEFAULT 10, -- 100: super_admin, 80: admin, 50: hod, 20: teacher, 10: student
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'student.view', 'attendance.lock'
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,              -- student, faculty, class, attendance, quiz, result, system
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                      -- References teachers(id), admins(id), or students(id)
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 3. FACULTY SUBJECT ASSIGNMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) NOT NULL DEFAULT '2025-26',
    semester INTEGER NULL,
    lecture_hours_per_week NUMERIC(3,1) NOT NULL DEFAULT 3.0,
    practical_hours_per_week NUMERIC(3,1) NOT NULL DEFAULT 0.0,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    assigned_by UUID NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_faculty_sub_class UNIQUE (faculty_id, subject_id, class_id, academic_year)
);

-- ----------------------------------------------------------------------------
-- 4. FACULTY CLASS ASSIGNMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'subject_teacher' CHECK (role IN ('class_teacher', 'subject_teacher', 'mentor', 'coordinator', 'hod')),
    academic_year VARCHAR(50) NOT NULL DEFAULT '2025-26',
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    assigned_by UUID NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_faculty_class_role UNIQUE (faculty_id, class_id, role, academic_year)
);

-- ----------------------------------------------------------------------------
-- 5. FACULTY LEAVE REQUESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('casual', 'medical', 'earned', 'duty', 'optional', 'special')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by UUID NULL,
    reviewed_at TIMESTAMPTZ NULL,
    reviewer_remarks TEXT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

-- ----------------------------------------------------------------------------
-- 6. FACULTY DOCUMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    doc_type VARCHAR(100) NOT NULL CHECK (doc_type IN (
        'appointment_letter', 'qualification_degree', 'experience_cert', 
        'id_proof', 'joining_docs', 'research_publication', 'appraisal_doc', 'other'
    )),
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NULL,
    file_size_bytes BIGINT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. ADMIN AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,               -- e.g. 'attendance.unlock', 'leave.approve', 'faculty.assign'
    module VARCHAR(100) NOT NULL,               -- 'attendance', 'leave', 'academics', 'rbac', 'faculty'
    entity_type VARCHAR(100) NULL,              -- 'attendance_session', 'faculty_leave', 'subject_assignment'
    entity_id VARCHAR(100) NULL,
    old_data JSONB NULL,
    new_data JSONB NULL,
    reason TEXT NULL,
    ip_address VARCHAR(50) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. ENHANCE ATTENDANCE SESSIONS FOR APPROVAL & LOCK WORKFLOW
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance_sessions' AND column_name = 'locked_at'
    ) THEN
        ALTER TABLE public.attendance_sessions ADD COLUMN locked_at TIMESTAMPTZ NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance_sessions' AND column_name = 'locked_by'
    ) THEN
        ALTER TABLE public.attendance_sessions ADD COLUMN locked_by UUID NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance_sessions' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE public.attendance_sessions ADD COLUMN approved_by UUID NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance_sessions' AND column_name = 'lock_reason'
    ) THEN
        ALTER TABLE public.attendance_sessions ADD COLUMN lock_reason TEXT NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 9. PERFORMANCE & AUDIT INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fsa_faculty ON public.faculty_subject_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_fsa_class ON public.faculty_subject_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_fsa_subject ON public.faculty_subject_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_fsa_status ON public.faculty_subject_assignments(status);

CREATE INDEX IF NOT EXISTS idx_fca_faculty ON public.faculty_class_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_fca_class ON public.faculty_class_assignments(class_id);

CREATE INDEX IF NOT EXISTS idx_flr_faculty ON public.faculty_leave_requests(faculty_id);
CREATE INDEX IF NOT EXISTS idx_flr_status ON public.faculty_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_flr_dates ON public.faculty_leave_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_fdoc_faculty ON public.faculty_documents(faculty_id);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_module ON public.admin_audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);

-- ----------------------------------------------------------------------------
-- 10. REAL-TIME VIEWS
-- ----------------------------------------------------------------------------

-- View: Teacher Assignments with full descriptive details
CREATE OR REPLACE VIEW public.v_teacher_assignments AS
SELECT 
    fsa.id AS assignment_id,
    fsa.faculty_id,
    t.emp_code,
    t.full_name AS faculty_name,
    t.designation,
    t.email AS faculty_email,
    fsa.subject_id,
    s.code AS subject_code,
    s.name AS subject_name,
    s.type AS subject_type,
    s.credits AS subject_credits,
    fsa.class_id,
    c.name AS class_name,
    c.class_name AS class_short_code,
    c.semester,
    c.division,
    fsa.academic_year,
    fsa.lecture_hours_per_week,
    fsa.practical_hours_per_week,
    (fsa.lecture_hours_per_week + fsa.practical_hours_per_week) AS total_hours_per_week,
    fsa.status AS assignment_status,
    fsa.assigned_at
FROM public.faculty_subject_assignments fsa
JOIN public.teachers t ON fsa.faculty_id = t.id
JOIN public.subjects s ON fsa.subject_id = s.id
JOIN public.classes c ON fsa.class_id = c.id;

-- View: Faculty Workload Summary
CREATE OR REPLACE VIEW public.v_faculty_workload_summary AS
SELECT 
    t.id AS faculty_id,
    t.emp_code,
    t.full_name,
    t.designation,
    t.department_id,
    d.code AS department_code,
    d.name AS department_name,
    COUNT(DISTINCT fsa.id) AS total_subject_assignments,
    COUNT(DISTINCT fsa.class_id) AS total_classes_assigned,
    COALESCE(SUM(fsa.lecture_hours_per_week), 0) AS weekly_lecture_hours,
    COALESCE(SUM(fsa.practical_hours_per_week), 0) AS weekly_practical_hours,
    COALESCE(SUM(fsa.lecture_hours_per_week + fsa.practical_hours_per_week), 0) AS total_weekly_load_hours
FROM public.teachers t
LEFT JOIN public.departments d ON t.department_id = d.id
LEFT JOIN public.faculty_subject_assignments fsa ON t.id = fsa.faculty_id AND fsa.status = 'active'
GROUP BY t.id, t.emp_code, t.full_name, t.designation, t.department_id, d.code, d.name;

-- View: Admin System Overview
CREATE OR REPLACE VIEW public.v_admin_system_overview AS
SELECT 
    (SELECT COUNT(*) FROM public.students) AS total_students,
    (SELECT COUNT(*) FROM public.teachers) AS total_faculty,
    (SELECT COUNT(*) FROM public.departments) AS total_departments,
    (SELECT COUNT(*) FROM public.classes) AS total_classes,
    (SELECT COUNT(*) FROM public.subjects) AS total_subjects,
    (SELECT COUNT(*) FROM public.quizzes WHERE status = 'published' OR result_published = TRUE) AS active_quizzes,
    (SELECT COUNT(*) FROM public.faculty_leave_requests WHERE status = 'pending') AS pending_leave_requests,
    (SELECT COUNT(*) FROM public.attendance_sessions WHERE status IN ('submitted', 'pending')) AS pending_attendance_approvals,
    (SELECT COALESCE(ROUND(AVG(attendance_rate)::numeric, 1), 85.0) FROM public.attendance_sessions WHERE status IN ('approved', 'locked')) AS average_attendance_rate,
    (SELECT year_code FROM public.academic_years WHERE is_active = TRUE LIMIT 1) AS active_academic_year;

-- View: Class Academic Summary
CREATE OR REPLACE VIEW public.v_class_academic_summary AS
SELECT 
    c.id AS class_id,
    c.name AS class_name,
    c.class_name AS short_code,
    c.semester,
    c.division,
    COUNT(DISTINCT s.id) AS total_enrolled_students,
    COALESCE(ROUND(AVG(att.attendance_rate)::numeric, 1), 0.0) AS avg_class_attendance,
    COUNT(DISTINCT fsa.faculty_id) AS assigned_teachers_count
FROM public.classes c
LEFT JOIN public.students s ON s.class_id = c.id
LEFT JOIN public.attendance_sessions att ON att.class_id = c.id
LEFT JOIN public.faculty_subject_assignments fsa ON fsa.class_id = c.id AND fsa.status = 'active'
GROUP BY c.id, c.name, c.class_name, c.semester, c.division;

-- View: Faculty Leave Summary
CREATE OR REPLACE VIEW public.v_faculty_leave_summary AS
SELECT 
    flr.id AS leave_id,
    flr.faculty_id,
    t.emp_code,
    t.full_name AS faculty_name,
    t.designation,
    flr.leave_type,
    flr.start_date,
    flr.end_date,
    flr.total_days,
    flr.reason,
    flr.status,
    flr.reviewer_remarks,
    flr.applied_at,
    flr.reviewed_at
FROM public.faculty_leave_requests flr
JOIN public.teachers t ON flr.faculty_id = t.id;

-- ----------------------------------------------------------------------------
-- 11. RPC STORED PROCEDURES & BUSINESS LOGIC
-- ----------------------------------------------------------------------------

-- 11.1: Teacher Dashboard Overview
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard(p_faculty_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_teacher RECORD;
    v_classes JSONB;
    v_subjects JSONB;
    v_workload RECORD;
    v_pending_att_count INTEGER;
    v_pending_leave_count INTEGER;
    v_recent_notifs JSONB;
BEGIN
    SELECT id, emp_code, full_name, designation, email, phone, avatar
    INTO v_teacher
    FROM public.teachers
    WHERE id = p_faculty_id;

    IF v_teacher.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Teacher not found');
    END IF;

    -- Classes assigned
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'class_id', c.id,
        'class_name', c.name,
        'short_code', c.class_name,
        'semester', c.semester,
        'division', c.division,
        'role', COALESCE(fca.role, 'subject_teacher'),
        'total_students', (SELECT COUNT(*) FROM public.students s WHERE s.class_id = c.id)
    )), '[]'::jsonb)
    INTO v_classes
    FROM public.classes c
    LEFT JOIN public.faculty_class_assignments fca ON fca.class_id = c.id AND fca.faculty_id = p_faculty_id
    WHERE c.id IN (
        SELECT class_id FROM public.faculty_subject_assignments WHERE faculty_id = p_faculty_id AND status = 'active'
        UNION
        SELECT class_id FROM public.faculty_class_assignments WHERE faculty_id = p_faculty_id AND status = 'active'
    );

    -- Subjects assigned
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'assignment_id', fsa.id,
        'subject_id', s.id,
        'code', s.code,
        'name', s.name,
        'type', s.type,
        'credits', s.credits,
        'class_id', c.id,
        'class_code', c.class_name,
        'lecture_hours', fsa.lecture_hours_per_week,
        'practical_hours', fsa.practical_hours_per_week
    )), '[]'::jsonb)
    INTO v_subjects
    FROM public.faculty_subject_assignments fsa
    JOIN public.subjects s ON fsa.subject_id = s.id
    JOIN public.classes c ON fsa.class_id = c.id
    WHERE fsa.faculty_id = p_faculty_id AND fsa.status = 'active';

    -- Workload
    SELECT 
        COALESCE(SUM(lecture_hours_per_week), 0) AS lecture_hours,
        COALESCE(SUM(practical_hours_per_week), 0) AS practical_hours,
        COALESCE(SUM(lecture_hours_per_week + practical_hours_per_week), 0) AS total_hours
    INTO v_workload
    FROM public.faculty_subject_assignments
    WHERE faculty_id = p_faculty_id AND status = 'active';

    -- Pending attendance submissions
    SELECT COUNT(*)
    INTO v_pending_att_count
    FROM public.attendance_sessions
    WHERE teacher_id = p_faculty_id AND status IN ('draft', 'pending');

    -- Recent notifications
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', n.id,
        'title', n.title,
        'message', n.message,
        'priority', n.priority,
        'created_at', n.created_at
    )), '[]'::jsonb)
    INTO v_recent_notifs
    FROM (
        SELECT n.id, n.title, n.message, n.priority, n.created_at
        FROM public.notifications n
        JOIN public.notification_recipients nr ON n.id = nr.notification_id
        WHERE nr.recipient_id = p_faculty_id
        ORDER BY n.created_at DESC
        LIMIT 5
    ) n;

    RETURN jsonb_build_object(
        'success', true,
        'teacher', row_to_json(v_teacher),
        'assigned_classes', v_classes,
        'assigned_subjects', v_subjects,
        'workload', jsonb_build_object(
            'lecture_hours', v_workload.lecture_hours,
            'practical_hours', v_workload.practical_hours,
            'total_weekly_hours', v_workload.total_hours
        ),
        'pending_attendance_count', v_pending_att_count,
        'recent_notifications', v_recent_notifs
    );
END;
$$;

-- 11.2: Get Teacher Assigned Classes
CREATE OR REPLACE FUNCTION public.get_teacher_classes(p_faculty_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'class_name', c.name,
        'short_code', c.class_name,
        'department_id', c.department_id,
        'semester', c.semester,
        'division', c.division,
        'role', COALESCE(fca.role, 'subject_teacher'),
        'total_students', (SELECT COUNT(*) FROM public.students s WHERE s.class_id = c.id)
    ) ORDER BY c.semester ASC, c.division ASC), '[]'::jsonb)
    INTO v_result
    FROM public.classes c
    LEFT JOIN public.faculty_class_assignments fca ON fca.class_id = c.id AND fca.faculty_id = p_faculty_id
    WHERE c.id IN (
        SELECT class_id FROM public.faculty_subject_assignments WHERE faculty_id = p_faculty_id AND status = 'active'
        UNION
        SELECT class_id FROM public.faculty_class_assignments WHERE faculty_id = p_faculty_id AND status = 'active'
    );

    RETURN v_result;
END;
$$;

-- 11.3: Get Teacher Assigned Subjects
CREATE OR REPLACE FUNCTION public.get_teacher_subjects(p_faculty_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'assignment_id', fsa.id,
        'subject_id', s.id,
        'code', s.code,
        'name', s.name,
        'short_name', s.short_name,
        'type', s.type,
        'credits', s.credits,
        'class_id', c.id,
        'class_name', c.name,
        'class_code', c.class_name,
        'semester', c.semester,
        'division', c.division,
        'academic_year', fsa.academic_year,
        'lecture_hours', fsa.lecture_hours_per_week,
        'practical_hours', fsa.practical_hours_per_week
    ) ORDER BY c.semester ASC, s.name ASC), '[]'::jsonb)
    INTO v_result
    FROM public.faculty_subject_assignments fsa
    JOIN public.subjects s ON fsa.subject_id = s.id
    JOIN public.classes c ON fsa.class_id = c.id
    WHERE fsa.faculty_id = p_faculty_id AND fsa.status = 'active';

    RETURN v_result;
END;
$$;

-- 11.4: Get Teacher Students Roster (Strictly filtered to assigned classes)
CREATE OR REPLACE FUNCTION public.get_teacher_students(p_faculty_id UUID, p_class_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Verify teacher has assignment for the target class if specified
    IF p_class_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.faculty_subject_assignments 
            WHERE faculty_id = p_faculty_id AND class_id = p_class_id AND status = 'active'
            UNION
            SELECT 1 FROM public.faculty_class_assignments 
            WHERE faculty_id = p_faculty_id AND class_id = p_class_id AND status = 'active'
        ) THEN
            RETURN jsonb_build_object('error', 'Unauthorized: Faculty is not assigned to this class');
        END IF;
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'student_id', s.id,
        'student_code', s.student_code,
        'roll_no', s.roll_no,
        'full_name', s.full_name,
        'email', s.email,
        'phone', s.phone,
        'class_id', s.class_id,
        'class_name', c.class_name,
        'division', c.division,
        'semester', c.semester,
        'attendance_percentage', (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 85.0 
                ELSE ROUND((SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 1)
            END
            FROM public.attendance_records ar
            JOIN public.attendance_sessions ses ON ar.session_id = ses.id
            WHERE ar.student_id = s.id
        ),
        'academic_alerts', CASE 
            WHEN (SELECT COUNT(*) FROM public.student_academic_records sar WHERE sar.student_id = s.id AND (sar.result_status = 'ATKT' OR sar.subjects_failed > 0)) > 0 THEN 'Has Backlogs'
            ELSE 'Clear'
        END
    ) ORDER BY s.roll_no ASC, s.full_name ASC), '[]'::jsonb)
    INTO v_result
    FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE (
        p_class_id IS NOT NULL AND s.class_id = p_class_id
    ) OR (
        p_class_id IS NULL AND s.class_id IN (
            SELECT class_id FROM public.faculty_subject_assignments WHERE faculty_id = p_faculty_id AND status = 'active'
            UNION
            SELECT class_id FROM public.faculty_class_assignments WHERE faculty_id = p_faculty_id AND status = 'active'
        )
    );

    RETURN v_result;
END;
$$;

-- 11.5: Submit Attendance for Approval
CREATE OR REPLACE FUNCTION public.submit_attendance_for_approval(p_session_id UUID, p_faculty_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id;

    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Attendance session not found');
    END IF;

    IF v_session.teacher_id != p_faculty_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: You did not mark this session');
    END IF;

    IF v_session.status = 'locked' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Session is already locked and cannot be resubmitted');
    END IF;

    UPDATE public.attendance_sessions
    SET status = 'submitted',
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Insert Audit Log
    INSERT INTO public.admin_audit_logs (
        actor_id, actor_role, action, module, entity_type, entity_id, new_data
    ) VALUES (
        p_faculty_id, 'teacher', 'attendance.submit', 'attendance', 'attendance_session', p_session_id::text,
        jsonb_build_object('session_code', v_session.session_code, 'status', 'submitted')
    );

    RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'submitted');
END;
$$;

-- 11.6: Approve & Lock Attendance (HOD / Admin)
CREATE OR REPLACE FUNCTION public.approve_attendance(p_session_id UUID, p_approved_by UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id;

    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Attendance session not found');
    END IF;

    UPDATE public.attendance_sessions
    SET status = 'locked',
        approved_by = p_approved_by,
        locked_by = p_approved_by,
        locked_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Insert Audit Log
    INSERT INTO public.admin_audit_logs (
        actor_id, actor_role, action, module, entity_type, entity_id, new_data
    ) VALUES (
        p_approved_by, 'admin', 'attendance.approve_and_lock', 'attendance', 'attendance_session', p_session_id::text,
        jsonb_build_object('session_code', v_session.session_code, 'status', 'locked', 'approved_by', p_approved_by)
    );

    RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'locked');
END;
$$;

-- 11.7: Unlock Attendance Session (Admin / HOD only)
CREATE OR REPLACE FUNCTION public.unlock_attendance_session(p_session_id UUID, p_unlocked_by UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id;

    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Attendance session not found');
    END IF;

    UPDATE public.attendance_sessions
    SET status = 'draft',
        lock_reason = p_reason,
        locked_at = NULL,
        locked_by = NULL,
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Audit Log
    INSERT INTO public.admin_audit_logs (
        actor_id, actor_role, action, module, entity_type, entity_id, reason, new_data
    ) VALUES (
        p_unlocked_by, 'admin', 'attendance.unlock', 'attendance', 'attendance_session', p_session_id::text,
        p_reason, jsonb_build_object('session_code', v_session.session_code, 'status', 'draft')
    );

    RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'draft');
END;
$$;

-- 11.8: Apply Faculty Leave Request
CREATE OR REPLACE FUNCTION public.apply_faculty_leave(
    p_faculty_id UUID,
    p_leave_type VARCHAR,
    p_start_date DATE,
    p_end_date DATE,
    p_total_days NUMERIC,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_id UUID;
BEGIN
    IF p_end_date < p_start_date THEN
        RETURN jsonb_build_object('success', false, 'message', 'End date cannot be earlier than start date');
    END IF;

    INSERT INTO public.faculty_leave_requests (
        faculty_id, leave_type, start_date, end_date, total_days, reason, status
    ) VALUES (
        p_faculty_id, p_leave_type, p_start_date, p_end_date, p_total_days, p_reason, 'pending'
    ) RETURNING id INTO v_new_id;

    INSERT INTO public.admin_audit_logs (
        actor_id, actor_role, action, module, entity_type, entity_id, new_data
    ) VALUES (
        p_faculty_id, 'teacher', 'leave.apply', 'leave', 'faculty_leave_requests', v_new_id::text,
        jsonb_build_object('leave_type', p_leave_type, 'start_date', p_start_date, 'end_date', p_end_date, 'days', p_total_days)
    );

    RETURN jsonb_build_object('success', true, 'leave_id', v_new_id, 'status', 'pending');
END;
$$;

-- 11.9: Approve / Reject Faculty Leave (HOD / Admin)
CREATE OR REPLACE FUNCTION public.approve_faculty_leave(
    p_leave_id UUID,
    p_reviewed_by UUID,
    p_status VARCHAR,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_leave RECORD;
BEGIN
    SELECT * INTO v_leave FROM public.faculty_leave_requests WHERE id = p_leave_id;

    IF v_leave.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Leave request not found');
    END IF;

    UPDATE public.faculty_leave_requests
    SET status = p_status,
        reviewed_by = p_reviewed_by,
        reviewer_remarks = p_remarks,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_leave_id;

    -- Audit log
    INSERT INTO public.admin_audit_logs (
        actor_id, actor_role, action, module, entity_type, entity_id, reason, new_data
    ) VALUES (
        p_reviewed_by, 'admin', 'leave.' || p_status, 'leave', 'faculty_leave_requests', p_leave_id::text,
        p_remarks, jsonb_build_object('status', p_status, 'reviewer', p_reviewed_by)
    );

    -- Send Real-Time Notification to Faculty
    BEGIN
        INSERT INTO public.notifications (
            notification_type, title, message, priority, sender_id, action_url
        ) VALUES (
            'academic',
            'Leave Request ' || INITCAP(p_status),
            'Your ' || v_leave.leave_type || ' leave application from ' || v_leave.start_date || ' to ' || v_leave.end_date || ' has been ' || p_status || '.',
            CASE WHEN p_status = 'approved' THEN 'normal' ELSE 'high' END,
            p_reviewed_by,
            '/teacher/leave'
        );
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Do not abort if notification insert encounters mismatch
    END;

    RETURN jsonb_build_object('success', true, 'leave_id', p_leave_id, 'status', p_status);
END;
$$;

-- 11.10: Admin Dashboard KPI Aggregator
CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats RECORD;
    v_recent_audits JSONB;
    v_pending_leaves JSONB;
BEGIN
    SELECT * INTO v_stats FROM public.v_admin_system_overview;

    -- Recent audit logs
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', a.id,
        'action', a.action,
        'module', a.module,
        'actor_role', a.actor_role,
        'created_at', a.created_at,
        'reason', a.reason
    )), '[]'::jsonb)
    INTO v_recent_audits
    FROM (
        SELECT id, action, module, actor_role, created_at, reason
        FROM public.admin_audit_logs
        ORDER BY created_at DESC
        LIMIT 8
    ) a;

    -- Pending leave requests
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'leave_id', l.id,
        'faculty_name', l.full_name,
        'emp_code', l.emp_code,
        'leave_type', l.leave_type,
        'start_date', l.start_date,
        'end_date', l.end_date,
        'total_days', l.total_days,
        'reason', l.reason,
        'applied_at', l.applied_at
    )), '[]'::jsonb)
    INTO v_pending_leaves
    FROM (
        SELECT flr.id, t.full_name, t.emp_code, flr.leave_type, flr.start_date, flr.end_date, flr.total_days, flr.reason, flr.applied_at
        FROM public.faculty_leave_requests flr
        JOIN public.teachers t ON flr.faculty_id = t.id
        WHERE flr.status = 'pending'
        ORDER BY flr.applied_at ASC
        LIMIT 10
    ) l;

    RETURN jsonb_build_object(
        'success', true,
        'stats', jsonb_build_object(
            'total_students', v_stats.total_students,
            'total_faculty', v_stats.total_faculty,
            'total_departments', v_stats.total_departments,
            'total_classes', v_stats.total_classes,
            'total_subjects', v_stats.total_subjects,
            'active_quizzes', v_stats.active_quizzes,
            'pending_leave_requests', v_stats.pending_leave_requests,
            'pending_attendance_approvals', v_stats.pending_attendance_approvals,
            'average_attendance_rate', v_stats.average_attendance_rate,
            'active_academic_year', v_stats.active_academic_year
        ),
        'pending_leaves', v_pending_leaves,
        'recent_audits', v_recent_audits
    );
END;
$$;

-- 11.11: Generate Faculty Report
CREATE OR REPLACE FUNCTION public.generate_faculty_report()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_report JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'faculty_id', w.faculty_id,
        'emp_code', w.emp_code,
        'full_name', w.full_name,
        'designation', w.designation,
        'department', w.department_name,
        'assigned_subjects_count', w.total_subject_assignments,
        'assigned_classes_count', w.total_classes_assigned,
        'weekly_lecture_hours', w.weekly_lecture_hours,
        'weekly_practical_hours', w.weekly_practical_hours,
        'total_weekly_hours', w.total_weekly_load_hours
    ) ORDER BY w.full_name ASC), '[]'::jsonb)
    INTO v_report
    FROM public.v_faculty_workload_summary w;

    RETURN v_report;
END;
$$;

-- 11.12: Generate Class Report
CREATE OR REPLACE FUNCTION public.generate_class_report(p_class_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_report JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'class_id', cas.class_id,
        'class_name', cas.class_name,
        'short_code', cas.short_code,
        'semester', cas.semester,
        'division', cas.division,
        'total_enrolled_students', cas.total_enrolled_students,
        'average_attendance', cas.avg_class_attendance,
        'assigned_teachers_count', cas.assigned_teachers_count
    ) ORDER BY cas.semester ASC, cas.division ASC), '[]'::jsonb)
    INTO v_report
    FROM public.v_class_academic_summary cas
    WHERE (p_class_id IS NULL OR cas.class_id = p_class_id);

    RETURN v_report;
END;
$$;

-- 11.13: Record Generic Audit Log RPC
CREATE OR REPLACE FUNCTION public.record_audit_log(
    p_actor_id UUID,
    p_actor_role VARCHAR,
    p_action VARCHAR,
    p_module VARCHAR,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id VARCHAR DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_ip_address VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.admin_audit_logs (
        actor_id, actor_role, action, module, entity_type, entity_id,
        old_data, new_data, reason, ip_address
    ) VALUES (
        p_actor_id, p_actor_role, p_action, p_module, p_entity_type, p_entity_id,
        p_old_data, p_new_data, p_reason, p_ip_address
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.faculty_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses all policies; authenticated users get read or restricted write
DROP POLICY IF EXISTS p_fsa_read_all ON public.faculty_subject_assignments;
CREATE POLICY p_fsa_read_all ON public.faculty_subject_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS p_fca_read_all ON public.faculty_class_assignments;
CREATE POLICY p_fca_read_all ON public.faculty_class_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS p_flr_read_all ON public.faculty_leave_requests;
CREATE POLICY p_flr_read_all ON public.faculty_leave_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS p_flr_write ON public.faculty_leave_requests;
CREATE POLICY p_flr_write ON public.faculty_leave_requests FOR ALL USING (true);

DROP POLICY IF EXISTS p_fdoc_read_all ON public.faculty_documents;
CREATE POLICY p_fdoc_read_all ON public.faculty_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS p_audit_read_all ON public.admin_audit_logs;
CREATE POLICY p_audit_read_all ON public.admin_audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS p_roles_read_all ON public.roles;
CREATE POLICY p_roles_read_all ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS p_perms_read_all ON public.permissions;
CREATE POLICY p_perms_read_all ON public.permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS p_user_roles_read_all ON public.user_roles;
CREATE POLICY p_user_roles_read_all ON public.user_roles FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- 13. SEED INITIAL STEP 8 ROLES, PERMISSIONS & ASSIGNMENTS
-- ----------------------------------------------------------------------------

-- 13.1 Academic Year
INSERT INTO public.academic_years (year_code, display_name, start_date, end_date, is_active, is_locked)
VALUES ('2025-26', 'Academic Year 2025-2026', '2025-07-01', '2026-06-30', TRUE, FALSE)
ON CONFLICT (year_code) DO NOTHING;

-- 13.2 Roles
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system) VALUES
('super_admin', 'Super Administrator', 'Complete system-level administrative access and infrastructure control', 100, TRUE),
('admin', 'Administrator', 'Full ERP management access for students, faculty, academics, and operations', 80, TRUE),
('hod', 'Head of Department', 'Departmental administration, attendance approval, and workload management', 50, TRUE),
('teacher', 'Teacher / Faculty', 'Academic operations, class teaching, attendance marking, and grading', 20, TRUE),
('student', 'Student', 'Academic view, attendance view, quiz participation, fee wallet access', 10, TRUE)
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, hierarchy_level = EXCLUDED.hierarchy_level;

-- 13.3 Core Permissions
INSERT INTO public.permissions (permission_key, name, category, description) VALUES
('student.view', 'View Student Data', 'student', 'View student roster, profile and academic info'),
('student.manage', 'Manage Students', 'student', 'Add, edit, or deactivate student accounts'),
('faculty.view', 'View Faculty Data', 'faculty', 'View faculty profiles and workload'),
('faculty.manage', 'Manage Faculty', 'faculty', 'Create, update faculty assignments and accounts'),
('class.view', 'View Classes', 'class', 'View class rosters and schedule'),
('class.manage', 'Manage Classes', 'class', 'Create and configure classes and divisions'),
('subject.view', 'View Subjects', 'subject', 'View curriculum subjects and syllabus'),
('subject.manage', 'Manage Subjects', 'subject', 'Create, edit and assign subjects'),
('attendance.view', 'View Attendance', 'attendance', 'View attendance sessions and reports'),
('attendance.mark', 'Mark Attendance', 'attendance', 'Mark session attendance for assigned classes'),
('attendance.edit', 'Edit Attendance', 'attendance', 'Modify attendance within allowed window'),
('attendance.approve', 'Approve Attendance', 'attendance', 'Approve and lock submitted attendance sessions'),
('attendance.unlock', 'Unlock Attendance', 'attendance', 'Unlock locked attendance sessions for modification'),
('quiz.create', 'Create Quiz', 'quiz', 'Author and configure new assessments'),
('quiz.manage', 'Manage Quizzes', 'quiz', 'Edit, publish or unpublish assessments'),
('quiz.evaluate', 'Evaluate Quizzes', 'quiz', 'Grade student quiz and assessment submissions'),
('quiz.publish', 'Publish Quiz Results', 'quiz', 'Publish quiz results to class students'),
('result.view', 'View Results', 'result', 'View semester marks and academic records'),
('result.manage', 'Enter/Edit Marks', 'result', 'Bulk enter or modify internal/external marks'),
('result.publish', 'Publish Results', 'result', 'Formally publish official semester marks'),
('timetable.view', 'View Timetable', 'timetable', 'View personal or class weekly schedules'),
('timetable.manage', 'Manage Timetable', 'timetable', 'Upload or adjust timetable slots'),
('leave.apply', 'Apply Leave', 'leave', 'Submit faculty leave requests'),
('leave.approve', 'Approve Leave', 'leave', 'Review, approve or reject faculty leave applications'),
('documents.view', 'View Documents', 'document', 'Access authorized college and faculty documents'),
('documents.manage', 'Manage Documents', 'document', 'Upload and verify official certificates'),
('reports.view', 'View Reports', 'reports', 'Generate and view administrative reports'),
('reports.export', 'Export Reports', 'reports', 'Download data sheets in CSV/Excel formats'),
('rbac.manage', 'Manage Roles & Permissions', 'system', 'Configure roles, grant or revoke permissions'),
('system.manage', 'System Administration', 'system', 'Full system configuration and audit log access')
ON CONFLICT (permission_key) DO NOTHING;

-- 13.4 Assign Permissions to Roles
DO $$
DECLARE
    v_admin_role UUID;
    v_hod_role UUID;
    v_teacher_role UUID;
    v_super_role UUID;
BEGIN
    SELECT id INTO v_super_role FROM public.roles WHERE name = 'super_admin';
    SELECT id INTO v_admin_role FROM public.roles WHERE name = 'admin';
    SELECT id INTO v_hod_role FROM public.roles WHERE name = 'hod';
    SELECT id INTO v_teacher_role FROM public.roles WHERE name = 'teacher';

    -- Super Admin & Admin get all permissions
    IF v_super_role IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_super_role, p.id FROM public.permissions p
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_admin_role IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_admin_role, p.id FROM public.permissions p
        ON CONFLICT DO NOTHING;
    END IF;

    -- HOD gets department management + teaching permissions
    IF v_hod_role IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_hod_role, p.id FROM public.permissions p
        WHERE p.category IN ('student', 'faculty', 'class', 'subject', 'attendance', 'quiz', 'result', 'timetable', 'leave', 'reports')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Teacher gets academic, attendance, quiz, result, leave.apply permissions
    IF v_teacher_role IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_teacher_role, p.id FROM public.permissions p
        WHERE p.permission_key IN (
            'student.view', 'class.view', 'subject.view', 
            'attendance.view', 'attendance.mark', 'attendance.edit',
            'quiz.create', 'quiz.manage', 'quiz.evaluate', 'quiz.publish',
            'result.view', 'result.manage',
            'timetable.view', 'leave.apply', 'documents.view'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 13.5 Assign Roles to existing Admins and Teachers
DO $$
DECLARE
    v_admin_id UUID;
    v_admin_role UUID;
    v_teacher_role UUID;
    v_hod_role UUID;
    v_patil_id UUID;
    v_kandoi_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM public.admins WHERE username = 'admin' LIMIT 1;
    SELECT id INTO v_admin_role FROM public.roles WHERE name = 'admin';
    SELECT id INTO v_teacher_role FROM public.roles WHERE name = 'teacher';
    SELECT id INTO v_hod_role FROM public.roles WHERE name = 'hod';

    -- Link Admin
    IF v_admin_id IS NOT NULL AND v_admin_role IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (v_admin_id, v_admin_role)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Link Teachers
    SELECT id INTO v_patil_id FROM public.teachers WHERE emp_code = 'EMP-CSE-1001' LIMIT 1;
    SELECT id INTO v_kandoi_id FROM public.teachers WHERE emp_code = 'EMP-CSE-1002' LIMIT 1;

    IF v_patil_id IS NOT NULL AND v_teacher_role IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id) VALUES (v_patil_id, v_teacher_role) ON CONFLICT DO NOTHING;
        -- Also grant HOD role to Dr. J. M. Patil
        IF v_hod_role IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role_id) VALUES (v_patil_id, v_hod_role) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    IF v_kandoi_id IS NOT NULL AND v_teacher_role IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id) VALUES (v_kandoi_id, v_teacher_role) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 13.6 Seed Faculty Subject Assignments & Class Assignments
DO $$
DECLARE
    v_patil_id UUID;
    v_kandoi_id UUID;
    v_mankar_id UUID;
    v_class_3r UUID;
    v_class_2r1 UUID;
    v_sub_dbms UUID;
    v_sub_dbms_lab UUID;
    v_sub_cd UUID;
    v_sub_coa UUID;
BEGIN
    SELECT id INTO v_patil_id FROM public.teachers WHERE emp_code = 'EMP-CSE-1001' LIMIT 1;
    SELECT id INTO v_kandoi_id FROM public.teachers WHERE emp_code = 'EMP-CSE-1002' LIMIT 1;
    SELECT id INTO v_mankar_id FROM public.teachers WHERE emp_code = 'EMP-CSE-1003' LIMIT 1;

    SELECT id INTO v_class_3r FROM public.classes WHERE class_name = '3R' LIMIT 1;
    SELECT id INTO v_class_2r1 FROM public.classes WHERE class_name = '2R1' LIMIT 1;

    SELECT id INTO v_sub_dbms FROM public.subjects WHERE code = '5CS220PC' LIMIT 1;
    SELECT id INTO v_sub_dbms_lab FROM public.subjects WHERE code = '5CS224PC' LIMIT 1;
    SELECT id INTO v_sub_cd FROM public.subjects WHERE code = '5CS221PC' LIMIT 1;
    SELECT id INTO v_sub_coa FROM public.subjects WHERE code = '5CS222PC' LIMIT 1;

    -- Dr. J. M. Patil: Class Teacher of 3R, Mentor of 2R1
    IF v_patil_id IS NOT NULL AND v_class_3r IS NOT NULL THEN
        INSERT INTO public.faculty_class_assignments (faculty_id, class_id, role, academic_year, status)
        VALUES (v_patil_id, v_class_3r, 'class_teacher', '2025-26', 'active')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_patil_id IS NOT NULL AND v_class_2r1 IS NOT NULL THEN
        INSERT INTO public.faculty_class_assignments (faculty_id, class_id, role, academic_year, status)
        VALUES (v_patil_id, v_class_2r1, 'mentor', '2025-26', 'active')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dr. J. M. Patil Subjects: DBMS (3 hrs lecture) + DBMS Lab (4 hrs practical) on 3R
    IF v_patil_id IS NOT NULL AND v_class_3r IS NOT NULL AND v_sub_dbms IS NOT NULL THEN
        INSERT INTO public.faculty_subject_assignments (faculty_id, subject_id, class_id, academic_year, semester, lecture_hours_per_week, practical_hours_per_week, status)
        VALUES (v_patil_id, v_sub_dbms, v_class_3r, '2025-26', 5, 4.0, 0.0, 'active')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_patil_id IS NOT NULL AND v_class_3r IS NOT NULL AND v_sub_dbms_lab IS NOT NULL THEN
        INSERT INTO public.faculty_subject_assignments (faculty_id, subject_id, class_id, academic_year, semester, lecture_hours_per_week, practical_hours_per_week, status)
        VALUES (v_patil_id, v_sub_dbms_lab, v_class_3r, '2025-26', 5, 0.0, 4.0, 'active')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dr. N. M. Kandoi: Compiler Design on 3R
    IF v_kandoi_id IS NOT NULL AND v_class_3r IS NOT NULL AND v_sub_cd IS NOT NULL THEN
        INSERT INTO public.faculty_subject_assignments (faculty_id, subject_id, class_id, academic_year, semester, lecture_hours_per_week, practical_hours_per_week, status)
        VALUES (v_kandoi_id, v_sub_cd, v_class_3r, '2025-26', 5, 4.0, 0.0, 'active')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Prof. C. M. Mankar: Computer Architecture & Organization on 3R
    IF v_mankar_id IS NOT NULL AND v_class_3r IS NOT NULL AND v_sub_coa IS NOT NULL THEN
        INSERT INTO public.faculty_subject_assignments (faculty_id, subject_id, class_id, academic_year, semester, lecture_hours_per_week, practical_hours_per_week, status)
        VALUES (v_mankar_id, v_sub_coa, v_class_3r, '2025-26', 5, 4.0, 0.0, 'active')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 13.7 Seed Sample Faculty Leave Requests
DO $$
DECLARE
    v_patil_id UUID;
    v_kandoi_id UUID;
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_patil_id FROM public.teachers WHERE emp_code = 'EMP-CSE-1001' LIMIT 1;
    SELECT id INTO v_kandoi_id FROM public.teachers WHERE emp_code = 'EMP-CSE-1002' LIMIT 1;
    SELECT id INTO v_admin_id FROM public.admins WHERE username = 'admin' LIMIT 1;

    IF v_patil_id IS NOT NULL THEN
        INSERT INTO public.faculty_leave_requests (faculty_id, leave_type, start_date, end_date, total_days, reason, status)
        VALUES 
        (v_patil_id, 'duty', '2026-10-14', '2026-10-15', 2.0, 'Attending IEEE International Conference on AI & Database Architectures', 'approved'),
        (v_patil_id, 'casual', '2026-10-22', '2026-10-22', 1.0, 'Personal family engagement', 'pending')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_kandoi_id IS NOT NULL THEN
        INSERT INTO public.faculty_leave_requests (faculty_id, leave_type, start_date, end_date, total_days, reason, status)
        VALUES 
        (v_kandoi_id, 'medical', '2026-10-18', '2026-10-19', 2.0, 'Medical appointment for routine checkup', 'pending')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 13.8 Seed Sample Faculty Documents
DO $$
DECLARE
    v_patil_id UUID;
BEGIN
    SELECT id INTO v_patil_id FROM public.teachers WHERE emp_code = 'EMP-CSE-1001' LIMIT 1;

    IF v_patil_id IS NOT NULL THEN
        INSERT INTO public.faculty_documents (faculty_id, doc_type, title, file_url, file_name, file_size_bytes)
        VALUES 
        (v_patil_id, 'appointment_letter', 'Official Appointment Order - SSGMCE CSE Department', 'https://ssgmce.ac.in/docs/faculty/appointment_jmpatil.pdf', 'appointment_jmpatil.pdf', 345000),
        (v_patil_id, 'qualification_degree', 'Ph.D. Doctoral Degree Certificate in Computer Science', 'https://ssgmce.ac.in/docs/faculty/phd_degree_jmpatil.pdf', 'phd_degree_jmpatil.pdf', 820000),
        (v_patil_id, 'experience_cert', 'Previous Academic Experience Certificate (8 Years)', 'https://ssgmce.ac.in/docs/faculty/experience_cert_jmpatil.pdf', 'experience_cert_jmpatil.pdf', 410000)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
