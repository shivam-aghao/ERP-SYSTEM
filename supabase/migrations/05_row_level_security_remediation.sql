-- ====================================================================
-- SSGMCE COLLEGE ERP — COMPLETE ROW LEVEL SECURITY (RLS) REMEDIATION
-- Instituted: Shri Sant Gajanan Maharaj College of Engineering, Shegaon
-- File: supabase/migrations/05_row_level_security_remediation.sql
-- ====================================================================

-- ====================================================================
-- 1. ENSURE RLS IS ENABLED ON ALL 57 PUBLIC TABLES
-- ====================================================================
ALTER TABLE public.academic_result_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_result_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_publication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_backlogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 2. DROP UNRESTRICTED LEGACY POLICIES (USING(true) TO public)
-- ====================================================================
DROP POLICY IF EXISTS students_all_policy ON public.students;
DROP POLICY IF EXISTS sdoc_all_policy ON public.student_documents;
DROP POLICY IF EXISTS scert_all_policy ON public.student_certificates;
DROP POLICY IF EXISTS attendance_sessions_all_policy ON public.attendance_sessions;
DROP POLICY IF EXISTS attendance_records_all_policy ON public.attendance_records;
DROP POLICY IF EXISTS student_attendance_subjects_all_policy ON public.student_attendance_subjects;
DROP POLICY IF EXISTS quizzes_all_policy ON public.quizzes;
DROP POLICY IF EXISTS quiz_questions_all_policy ON public.quiz_questions;
DROP POLICY IF EXISTS question_options_all_policy ON public.question_options;
DROP POLICY IF EXISTS quiz_attempts_all_policy ON public.quiz_attempts;
DROP POLICY IF EXISTS quiz_results_all_policy ON public.quiz_results;
DROP POLICY IF EXISTS student_answers_all_policy ON public.student_answers;
DROP POLICY IF EXISTS student_answer_options_all_policy ON public.student_answer_options;
DROP POLICY IF EXISTS result_change_logs_all_policy ON public.result_change_logs;
DROP POLICY IF EXISTS result_publication_logs_all_policy ON public.result_publication_logs;
DROP POLICY IF EXISTS sar_all_policy ON public.student_academic_records;
DROP POLICY IF EXISTS ssr_all_policy ON public.student_subject_results;
DROP POLICY IF EXISTS sb_all_policy ON public.student_backlogs;
DROP POLICY IF EXISTS arp_all_policy ON public.academic_result_publications;
DROP POLICY IF EXISTS arcl_all_policy ON public.academic_result_change_logs;
DROP POLICY IF EXISTS sfa_all_policy ON public.student_fee_accounts;
DROP POLICY IF EXISTS fi_all_policy ON public.fee_invoices;
DROP POLICY IF EXISTS fii_all_policy ON public.fee_invoice_items;
DROP POLICY IF EXISTS fp_all_policy ON public.fee_payments;
DROP POLICY IF EXISTS fr_all_policy ON public.fee_receipts;
DROP POLICY IF EXISTS fref_all_policy ON public.fee_refunds;
DROP POLICY IF EXISTS ssch_all_policy ON public.student_scholarships;
DROP POLICY IF EXISTS "Public read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public read notification recipients" ON public.notification_recipients;
DROP POLICY IF EXISTS "Public insert notification recipients" ON public.notification_recipients;
DROP POLICY IF EXISTS "Public update notification recipients" ON public.notification_recipients;
DROP POLICY IF EXISTS "Public manage notification delivery logs" ON public.notification_delivery_logs;
DROP POLICY IF EXISTS "Public read notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Public manage notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Public read notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Allow public read access on timetable_entries" ON public.timetable_entries;
DROP POLICY IF EXISTS "Allow public insert on timetable_entries" ON public.timetable_entries;
DROP POLICY IF EXISTS "Allow public update on timetable_entries" ON public.timetable_entries;
DROP POLICY IF EXISTS classes_all_policy ON public.classes;
DROP POLICY IF EXISTS subjects_all_policy ON public.subjects;
DROP POLICY IF EXISTS departments_all_policy ON public.departments;
DROP POLICY IF EXISTS teachers_all_policy ON public.teachers;
DROP POLICY IF EXISTS p_fca_read_all ON public.faculty_class_assignments;
DROP POLICY IF EXISTS p_fsa_read_all ON public.faculty_subject_assignments;
DROP POLICY IF EXISTS p_fdoc_read_all ON public.faculty_documents;
DROP POLICY IF EXISTS p_flr_read_all ON public.faculty_leave_requests;
DROP POLICY IF EXISTS p_flr_write ON public.faculty_leave_requests;
DROP POLICY IF EXISTS p_audit_read_all ON public.admin_audit_logs;
DROP POLICY IF EXISTS p_audit_insert_all ON public.admin_audit_logs;
DROP POLICY IF EXISTS p_roles_read_all ON public.roles;
DROP POLICY IF EXISTS p_perms_read_all ON public.permissions;
DROP POLICY IF EXISTS p_user_roles_read_all ON public.user_roles;

-- ====================================================================
-- 3. REMEDIATED POLICIES: STUDENT DOMAIN
-- ====================================================================

-- 3.1 students table
CREATE POLICY student_select_policy ON public.students
FOR SELECT TO authenticated
USING (
    id = public.current_student_id()
    OR public.is_teacher_assigned_to_class(class_id)
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
    OR public.is_accountant()
);

CREATE POLICY student_update_self_policy ON public.students
FOR UPDATE TO authenticated
USING (
    id = public.current_student_id()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    id = public.current_student_id()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_admin_insert_policy ON public.students
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY student_admin_delete_policy ON public.students
FOR DELETE TO authenticated
USING (public.is_admin_or_superadmin());


-- 3.2 student_documents table
CREATE POLICY student_documents_select_policy ON public.student_documents
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
    OR public.is_accountant()
);

CREATE POLICY student_documents_insert_policy ON public.student_documents
FOR INSERT TO authenticated
WITH CHECK (
    student_id = public.current_student_id()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_documents_update_policy ON public.student_documents
FOR UPDATE TO authenticated
USING (
    (student_id = public.current_student_id() AND (status = 'pending' OR NOT verified))
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    (student_id = public.current_student_id() AND (status = 'pending' OR NOT verified))
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_documents_delete_policy ON public.student_documents
FOR DELETE TO authenticated
USING (
    (student_id = public.current_student_id() AND (status = 'pending' OR NOT verified))
    OR public.is_admin_or_superadmin()
);



-- 3.3 student_certificates table
CREATE POLICY student_certificates_select_policy ON public.student_certificates
FOR SELECT TO public
USING (
    student_id = public.current_student_id()
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
    OR verification_code IS NOT NULL -- Allow public QR code validation
);

CREATE POLICY student_certificates_manage_policy ON public.student_certificates
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin() OR public.is_hod())
WITH CHECK (public.is_admin_or_superadmin() OR public.is_hod());


-- ====================================================================
-- 4. REMEDIATED POLICIES: ATTENDANCE DOMAIN
-- ====================================================================

-- 4.1 attendance_sessions table
CREATE POLICY attendance_sessions_select_policy ON public.attendance_sessions
FOR SELECT TO authenticated
USING (
    class_id = public.current_student_class_id()
    OR teacher_id = public.current_teacher_id()
    OR public.is_teacher_assigned_to_class(class_id)
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY attendance_sessions_insert_policy ON public.attendance_sessions
FOR INSERT TO authenticated
WITH CHECK (
    (teacher_id = public.current_teacher_id() AND public.is_teacher_assigned_to_class(class_id))
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY attendance_sessions_update_policy ON public.attendance_sessions
FOR UPDATE TO authenticated
USING (
    (teacher_id = public.current_teacher_id() AND status = 'draft')
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    (teacher_id = public.current_teacher_id() AND status = 'draft')
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY attendance_sessions_delete_policy ON public.attendance_sessions
FOR DELETE TO authenticated
USING (
    (teacher_id = public.current_teacher_id() AND status = 'draft')
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);


-- 4.2 attendance_records table
CREATE POLICY attendance_records_select_policy ON public.attendance_records
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR EXISTS (
        SELECT 1 FROM public.attendance_sessions ses
        WHERE ses.id = session_id 
          AND (ses.teacher_id = public.current_teacher_id() OR public.is_teacher_assigned_to_class(ses.class_id))
    )
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY attendance_records_insert_policy ON public.attendance_records
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions ses
        WHERE ses.id = session_id 
          AND ses.teacher_id = public.current_teacher_id()
          AND ses.status = 'draft'
    )
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY attendance_records_update_policy ON public.attendance_records
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions ses
        WHERE ses.id = session_id 
          AND ses.teacher_id = public.current_teacher_id()
          AND ses.status = 'draft'
    )
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions ses
        WHERE ses.id = session_id 
          AND ses.teacher_id = public.current_teacher_id()
          AND ses.status = 'draft'
    )
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY attendance_records_delete_policy ON public.attendance_records
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions ses
        WHERE ses.id = session_id 
          AND ses.teacher_id = public.current_teacher_id()
          AND ses.status = 'draft'
    )
    OR public.is_admin_or_superadmin()
);


-- 4.3 student_attendance_subjects table
CREATE POLICY student_attendance_subjects_select_policy ON public.student_attendance_subjects
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_teacher()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_attendance_subjects_manage_policy ON public.student_attendance_subjects
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin());


-- ====================================================================
-- 5. REMEDIATED POLICIES: QUIZZES & QUESTION BANK
-- ====================================================================

-- 5.1 quizzes table
CREATE POLICY quizzes_select_policy ON public.quizzes
FOR SELECT TO authenticated
USING (
    (class_id = public.current_student_class_id() AND status IN ('published', 'active', 'completed'))
    OR teacher_id = public.current_teacher_id()
    OR public.is_teacher_assigned_to_class(class_id)
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY quizzes_insert_policy ON public.quizzes
FOR INSERT TO authenticated
WITH CHECK (
    teacher_id = public.current_teacher_id()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY quizzes_update_policy ON public.quizzes
FOR UPDATE TO authenticated
USING (
    teacher_id = public.current_teacher_id()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    teacher_id = public.current_teacher_id()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY quizzes_delete_policy ON public.quizzes
FOR DELETE TO authenticated
USING (
    (teacher_id = public.current_teacher_id() AND NOT EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.quiz_id = id))
    OR public.is_admin_or_superadmin()
);


-- 5.2 quiz_questions table
CREATE POLICY quiz_questions_select_policy ON public.quiz_questions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = quiz_id
          AND (
            (q.class_id = public.current_student_class_id() AND q.status IN ('published', 'active', 'completed'))
            OR q.teacher_id = public.current_teacher_id()
            OR public.is_teacher_assigned_to_class(q.class_id)
            OR public.is_admin_or_superadmin()
          )
    )
);

CREATE POLICY quiz_questions_manage_policy ON public.quiz_questions
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = quiz_id
          AND (q.teacher_id = public.current_teacher_id() OR public.is_admin_or_superadmin())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = quiz_id
          AND (q.teacher_id = public.current_teacher_id() OR public.is_admin_or_superadmin())
    )
);


-- 5.3 question_options table
CREATE POLICY question_options_select_policy ON public.question_options
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.quizzes q ON qq.quiz_id = q.id
        WHERE qq.id = question_id
          AND (
            (q.class_id = public.current_student_class_id() AND q.status IN ('published', 'active', 'completed'))
            OR q.teacher_id = public.current_teacher_id()
            OR public.is_admin_or_superadmin()
          )
    )
);

CREATE POLICY question_options_manage_policy ON public.question_options
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.quizzes q ON qq.quiz_id = q.id
        WHERE qq.id = question_id
          AND (q.teacher_id = public.current_teacher_id() OR public.is_admin_or_superadmin())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.quizzes q ON qq.quiz_id = q.id
        WHERE qq.id = question_id
          AND (q.teacher_id = public.current_teacher_id() OR public.is_admin_or_superadmin())
    )
);


-- 5.4 question_bank table
CREATE POLICY question_bank_select_policy ON public.question_bank
FOR SELECT TO authenticated
USING (public.is_teacher() OR public.is_admin_or_superadmin());

CREATE POLICY question_bank_manage_policy ON public.question_bank
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_admin_or_superadmin());


-- 5.5 quiz_attempts table
CREATE POLICY quiz_attempts_select_policy ON public.quiz_attempts
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = quiz_id AND (q.teacher_id = public.current_teacher_id() OR public.is_teacher_assigned_to_class(q.class_id))
    )
    OR public.is_admin_or_superadmin()
);

CREATE POLICY quiz_attempts_insert_policy ON public.quiz_attempts
FOR INSERT TO authenticated
WITH CHECK (
    student_id = public.current_student_id()
    AND EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = quiz_id 
          AND q.class_id = public.current_student_class_id()
          AND q.status = 'active'
    )
);

CREATE POLICY quiz_attempts_update_policy ON public.quiz_attempts
FOR UPDATE TO authenticated
USING (
    (student_id = public.current_student_id() AND status = 'in_progress')
    OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = public.current_teacher_id())
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    (student_id = public.current_student_id() AND status IN ('in_progress', 'submitted'))
    OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = public.current_teacher_id())
    OR public.is_admin_or_superadmin()
);

CREATE POLICY quiz_attempts_delete_policy ON public.quiz_attempts
FOR DELETE TO authenticated
USING (public.is_admin_or_superadmin());


-- 5.6 quiz_attempt_answers / student_answers / student_answer_options
CREATE POLICY quiz_attempt_answers_select_policy ON public.quiz_attempt_answers
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id::text = attempt_id::text AND qa.student_id = public.current_student_id())
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY quiz_attempt_answers_manage_policy ON public.quiz_attempt_answers
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id::text = attempt_id::text AND qa.student_id = public.current_student_id() AND qa.status = 'in_progress')
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id::text = attempt_id::text AND qa.student_id = public.current_student_id() AND qa.status = 'in_progress')
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_answers_select_policy ON public.student_answers
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_id AND qa.student_id = public.current_student_id())
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_answers_manage_policy ON public.student_answers
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_id AND qa.student_id = public.current_student_id() AND qa.status = 'in_progress')
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_id AND qa.student_id = public.current_student_id() AND qa.status = 'in_progress')
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_answer_options_select_policy ON public.student_answer_options
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.student_answers sa
        JOIN public.quiz_attempts qa ON sa.attempt_id = qa.id
        WHERE sa.id = student_answer_id AND qa.student_id = public.current_student_id()
    )
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_answer_options_manage_policy ON public.student_answer_options
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.student_answers sa
        JOIN public.quiz_attempts qa ON sa.attempt_id = qa.id
        WHERE sa.id = student_answer_id AND qa.student_id = public.current_student_id() AND qa.status = 'in_progress'
    )
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.student_answers sa
        JOIN public.quiz_attempts qa ON sa.attempt_id = qa.id
        WHERE sa.id = student_answer_id AND qa.student_id = public.current_student_id() AND qa.status = 'in_progress'
    )
    OR public.is_teacher()
    OR public.is_admin_or_superadmin()
);


-- 5.7 quiz_security_events table
CREATE POLICY quiz_security_events_insert_policy ON public.quiz_security_events
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id::text = attempt_id::text AND qa.student_id = public.current_student_id())
    OR public.is_admin_or_superadmin()
);

CREATE POLICY quiz_security_events_select_policy ON public.quiz_security_events
FOR SELECT TO authenticated
USING (public.is_teacher() OR public.is_admin_or_superadmin());


-- 5.8 quiz_results & result logs
CREATE POLICY quiz_results_select_policy ON public.quiz_results
FOR SELECT TO authenticated
USING (
    (student_id = public.current_student_id() AND published = true)
    OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = public.current_teacher_id())
    OR public.is_admin_or_superadmin()
);

CREATE POLICY quiz_results_manage_policy ON public.quiz_results
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.teacher_id = public.current_teacher_id() OR public.is_admin_or_superadmin()))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.teacher_id = public.current_teacher_id() OR public.is_admin_or_superadmin()))
);

CREATE POLICY result_change_logs_policy ON public.result_change_logs
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_admin_or_superadmin());

CREATE POLICY result_publication_logs_policy ON public.result_publication_logs
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_admin_or_superadmin());


-- ====================================================================
-- 6. REMEDIATED POLICIES: ACADEMIC MARKS & SEMESTER RESULTS
-- ====================================================================

-- 6.1 student_academic_records table
CREATE POLICY student_academic_records_select_policy ON public.student_academic_records
FOR SELECT TO authenticated
USING (
    (student_id = public.current_student_id() AND result_published = true)
    OR public.is_teacher()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_academic_records_manage_policy ON public.student_academic_records
FOR ALL TO authenticated
USING (public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_hod() OR public.is_admin_or_superadmin());


-- 6.2 student_subject_results table
CREATE POLICY student_subject_results_select_policy ON public.student_subject_results
FOR SELECT TO authenticated
USING (
    (student_id = public.current_student_id() AND EXISTS (
        SELECT 1 FROM public.student_academic_records ar 
        WHERE ar.id = academic_record_id AND ar.result_published = true
    ))
    OR public.is_teacher_assigned_to_subject(subject_id)
    OR public.is_teacher()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_subject_results_manage_policy ON public.student_subject_results
FOR ALL TO authenticated
USING (
    public.is_teacher_assigned_to_subject(subject_id)
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    public.is_teacher_assigned_to_subject(subject_id)
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);


-- 6.3 student_backlogs table
CREATE POLICY student_backlogs_select_policy ON public.student_backlogs
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_teacher()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_backlogs_manage_policy ON public.student_backlogs
FOR ALL TO authenticated
USING (public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_hod() OR public.is_admin_or_superadmin());


-- 6.4 academic_result_publications & academic_result_change_logs
CREATE POLICY arp_policy ON public.academic_result_publications
FOR ALL TO authenticated
USING (public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_hod() OR public.is_admin_or_superadmin());

CREATE POLICY arcl_policy ON public.academic_result_change_logs
FOR ALL TO authenticated
USING (public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_hod() OR public.is_admin_or_superadmin());


-- ====================================================================
-- 7. REMEDIATED POLICIES: STUDENT FEES & FINANCIAL WALLET
-- ====================================================================

-- 7.1 student_fee_accounts table
CREATE POLICY student_fee_accounts_select_policy ON public.student_fee_accounts
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
    OR public.is_hod()
);

CREATE POLICY student_fee_accounts_manage_policy ON public.student_fee_accounts
FOR ALL TO authenticated
USING (public.is_accountant() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_accountant() OR public.is_admin_or_superadmin());


-- 7.2 fee_invoices & fee_invoice_items
CREATE POLICY fee_invoices_select_policy ON public.fee_invoices
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY fee_invoices_manage_policy ON public.fee_invoices
FOR ALL TO authenticated
USING (public.is_accountant() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_accountant() OR public.is_admin_or_superadmin());

CREATE POLICY fee_invoice_items_select_policy ON public.fee_invoice_items
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.fee_invoices fi WHERE fi.id = invoice_id AND fi.student_id = public.current_student_id())
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY fee_invoice_items_manage_policy ON public.fee_invoice_items
FOR ALL TO authenticated
USING (public.is_accountant() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_accountant() OR public.is_admin_or_superadmin());


-- 7.3 fee_payments table
CREATE POLICY fee_payments_select_policy ON public.fee_payments
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY fee_payments_insert_policy ON public.fee_payments
FOR INSERT TO authenticated
WITH CHECK (
    student_id = public.current_student_id()
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY fee_payments_manage_policy ON public.fee_payments
FOR UPDATE TO authenticated
USING (public.is_accountant() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_accountant() OR public.is_admin_or_superadmin());


-- 7.4 fee_receipts & fee_refunds & scholarships
CREATE POLICY fee_receipts_select_policy ON public.fee_receipts
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY fee_receipts_manage_policy ON public.fee_receipts
FOR ALL TO authenticated
USING (public.is_accountant() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_accountant() OR public.is_admin_or_superadmin());

CREATE POLICY fee_refunds_policy ON public.fee_refunds
FOR ALL TO authenticated
USING (
    (student_id = public.current_student_id())
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    (student_id = public.current_student_id())
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY student_scholarships_policy ON public.student_scholarships
FOR ALL TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_accountant()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    public.is_accountant()
    OR public.is_admin_or_superadmin()
);


-- ====================================================================
-- 8. REMEDIATED POLICIES: NOTIFICATIONS & REAL-TIME ALERTS
-- ====================================================================

-- 8.1 notifications table
CREATE POLICY notifications_select_policy ON public.notifications
FOR SELECT TO authenticated
USING (true); -- Authenticated users can view campus-wide notifications

CREATE POLICY notifications_manage_policy ON public.notifications
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_hod() OR public.is_accountant() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_hod() OR public.is_accountant() OR public.is_admin_or_superadmin());


-- 8.2 notification_recipients table
CREATE POLICY notification_recipients_select_policy ON public.notification_recipients
FOR SELECT TO authenticated
USING (
    recipient_id = public.current_student_id()
    OR recipient_id = public.current_teacher_id()
    OR recipient_id = public.current_admin_id()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY notification_recipients_insert_policy ON public.notification_recipients
FOR INSERT TO authenticated
WITH CHECK (
    public.is_teacher() 
    OR public.is_hod() 
    OR public.is_accountant() 
    OR public.is_admin_or_superadmin()
);

CREATE POLICY notification_recipients_update_policy ON public.notification_recipients
FOR UPDATE TO authenticated
USING (
    recipient_id = public.current_student_id()
    OR recipient_id = public.current_teacher_id()
    OR recipient_id = public.current_admin_id()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    recipient_id = public.current_student_id()
    OR recipient_id = public.current_teacher_id()
    OR recipient_id = public.current_admin_id()
    OR public.is_admin_or_superadmin()
);


-- 8.3 notification preferences / logs / templates / targets
CREATE POLICY notification_preferences_policy ON public.notification_preferences
FOR ALL TO authenticated
USING (
    user_id = public.current_student_id()
    OR user_id = public.current_teacher_id()
    OR user_id = public.current_admin_id()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    user_id = public.current_student_id()
    OR user_id = public.current_teacher_id()
    OR user_id = public.current_admin_id()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY notification_delivery_logs_policy ON public.notification_delivery_logs
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin() OR public.is_teacher())
WITH CHECK (public.is_admin_or_superadmin() OR public.is_teacher());

CREATE POLICY notification_templates_policy ON public.notification_templates
FOR SELECT TO authenticated
USING (true);

CREATE POLICY notification_templates_manage_policy ON public.notification_templates
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY notification_targets_policy ON public.notification_targets
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin() OR public.is_hod() OR public.is_teacher())
WITH CHECK (public.is_admin_or_superadmin() OR public.is_hod() OR public.is_teacher());

CREATE POLICY notification_audit_logs_policy ON public.notification_audit_logs
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());


-- ====================================================================
-- 9. REMEDIATED POLICIES: TIMETABLE & CORE CATALOG
-- ====================================================================

-- 9.1 timetable_entries & assessments
CREATE POLICY timetable_entries_select_policy ON public.timetable_entries
FOR SELECT TO authenticated
USING (true);

CREATE POLICY timetable_entries_manage_policy ON public.timetable_entries
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin());

CREATE POLICY timetable_assessments_select_policy ON public.timetable_assessments
FOR SELECT TO authenticated
USING (true);

CREATE POLICY timetable_assessments_manage_policy ON public.timetable_assessments
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin());


-- 9.2 classes, subjects, departments, curriculum, academic periods
CREATE POLICY classes_select_policy ON public.classes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY classes_manage_policy ON public.classes
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin() OR public.is_hod())
WITH CHECK (public.is_admin_or_superadmin() OR public.is_hod());

CREATE POLICY subjects_select_policy ON public.subjects
FOR SELECT TO authenticated
USING (true);

CREATE POLICY subjects_manage_policy ON public.subjects
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin() OR public.is_hod())
WITH CHECK (public.is_admin_or_superadmin() OR public.is_hod());

CREATE POLICY departments_select_policy ON public.departments
FOR SELECT TO authenticated
USING (true);

CREATE POLICY departments_manage_policy ON public.departments
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY academic_years_select_policy ON public.academic_years
FOR SELECT TO authenticated
USING (true);

CREATE POLICY academic_years_manage_policy ON public.academic_years
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY academic_semesters_select_policy ON public.academic_semesters
FOR SELECT TO authenticated
USING (true);

CREATE POLICY academic_semesters_manage_policy ON public.academic_semesters
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY curriculum_units_select_policy ON public.curriculum_units
FOR SELECT TO authenticated
USING (true);

CREATE POLICY curriculum_units_manage_policy ON public.curriculum_units
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin());

CREATE POLICY subject_syllabus_select_policy ON public.subject_syllabus
FOR SELECT TO authenticated
USING (true);

CREATE POLICY subject_syllabus_manage_policy ON public.subject_syllabus
FOR ALL TO authenticated
USING (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin())
WITH CHECK (public.is_teacher() OR public.is_hod() OR public.is_admin_or_superadmin());


-- ====================================================================
-- 10. REMEDIATED POLICIES: FACULTY, LEAVE & SYSTEM ADMINISTRATION
-- ====================================================================

-- 10.1 teachers table
CREATE POLICY teachers_select_policy ON public.teachers
FOR SELECT TO authenticated
USING (true);

CREATE POLICY teachers_update_self_policy ON public.teachers
FOR UPDATE TO authenticated
USING (
    id = public.current_teacher_id()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    id = public.current_teacher_id()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY teachers_admin_manage_policy ON public.teachers
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());


-- 10.2 faculty assignments & documents
CREATE POLICY faculty_class_assignments_select_policy ON public.faculty_class_assignments
FOR SELECT TO authenticated
USING (true);

CREATE POLICY faculty_class_assignments_manage_policy ON public.faculty_class_assignments
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin() OR public.is_hod())
WITH CHECK (public.is_admin_or_superadmin() OR public.is_hod());

CREATE POLICY faculty_subject_assignments_select_policy ON public.faculty_subject_assignments
FOR SELECT TO authenticated
USING (true);

CREATE POLICY faculty_subject_assignments_manage_policy ON public.faculty_subject_assignments
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin() OR public.is_hod())
WITH CHECK (public.is_admin_or_superadmin() OR public.is_hod());

CREATE POLICY faculty_documents_select_policy ON public.faculty_documents
FOR SELECT TO authenticated
USING (
    faculty_id = public.current_teacher_id()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY faculty_documents_manage_policy ON public.faculty_documents
FOR ALL TO authenticated
USING (
    faculty_id = public.current_teacher_id()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    faculty_id = public.current_teacher_id()
    OR public.is_admin_or_superadmin()
);


-- 10.3 faculty_leave_requests table
CREATE POLICY faculty_leave_requests_select_policy ON public.faculty_leave_requests
FOR SELECT TO authenticated
USING (
    faculty_id = public.current_teacher_id()
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY faculty_leave_requests_insert_policy ON public.faculty_leave_requests
FOR INSERT TO authenticated
WITH CHECK (
    faculty_id = public.current_teacher_id()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY faculty_leave_requests_update_policy ON public.faculty_leave_requests
FOR UPDATE TO authenticated
USING (
    (faculty_id = public.current_teacher_id() AND status = 'pending')
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
)
WITH CHECK (
    (faculty_id = public.current_teacher_id() AND status = 'pending')
    OR public.is_hod()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY faculty_leave_requests_delete_policy ON public.faculty_leave_requests
FOR DELETE TO authenticated
USING (
    (faculty_id = public.current_teacher_id() AND status = 'pending')
    OR public.is_admin_or_superadmin()
);


-- 10.4 admins & audit logs
CREATE POLICY admins_select_policy ON public.admins
FOR SELECT TO authenticated
USING (public.is_admin_or_superadmin());

CREATE POLICY admins_manage_policy ON public.admins
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY admin_audit_logs_select_policy ON public.admin_audit_logs
FOR SELECT TO authenticated
USING (public.is_admin_or_superadmin());

CREATE POLICY admin_audit_logs_insert_policy ON public.admin_audit_logs
FOR INSERT TO authenticated
WITH CHECK (true); -- Privileged backend actions can log audit entries


-- 10.5 roles, permissions, user_roles, role_permissions
CREATE POLICY roles_select_policy ON public.roles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY roles_manage_policy ON public.roles
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY permissions_select_policy ON public.permissions
FOR SELECT TO authenticated
USING (true);

CREATE POLICY permissions_manage_policy ON public.permissions
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY user_roles_select_policy ON public.user_roles
FOR SELECT TO authenticated
USING (
    user_id = public.current_student_id()
    OR user_id = public.current_teacher_id()
    OR user_id = public.current_admin_id()
    OR public.is_admin_or_superadmin()
);

CREATE POLICY user_roles_manage_policy ON public.user_roles
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

CREATE POLICY role_permissions_select_policy ON public.role_permissions
FOR SELECT TO authenticated
USING (true);

CREATE POLICY role_permissions_manage_policy ON public.role_permissions
FOR ALL TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());
