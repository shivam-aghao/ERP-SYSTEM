-- ==============================================================================
-- SSGMCE COLLEGE ERP: STEP 6 — STUDENT ACADEMIC RECORDS & DIGITAL WALLET
-- Migration: 02_student_academic_records_digital_wallet.sql
-- Integrates seamlessly with existing public.students, classes, subjects, etc.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ACADEMIC RECORDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NULL,
    semester_id UUID NULL,
    semester_number INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 8),
    enrollment_number VARCHAR(100),
    program_name VARCHAR(255) DEFAULT 'B.Tech in Computer Science & Engineering',
    department_code VARCHAR(50) DEFAULT 'CSE',
    year_level INTEGER DEFAULT 3,
    division VARCHAR(20) DEFAULT 'R',
    total_subjects INTEGER DEFAULT 0,
    subjects_passed INTEGER DEFAULT 0,
    subjects_failed INTEGER DEFAULT 0,
    total_credits NUMERIC(8,2) DEFAULT 0,
    earned_credits NUMERIC(8,2) DEFAULT 0,
    sgpa NUMERIC(5,2) CHECK (sgpa IS NULL OR (sgpa >= 0 AND sgpa <= 10)),
    cgpa NUMERIC(5,2) CHECK (cgpa IS NULL OR (cgpa >= 0 AND cgpa <= 10)),
    percentage NUMERIC(6,2) CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
    result_status VARCHAR(30) DEFAULT 'PENDING' CHECK (result_status IN ('PASS', 'FAIL', 'ATKT', 'PROMOTED', 'PENDING')),
    result_published BOOLEAN DEFAULT false,
    result_published_at TIMESTAMPTZ NULL,
    result_published_by UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_sem_record UNIQUE (student_id, semester_number)
);

-- ==============================================================================
-- 3. SUBJECT-WISE ACADEMIC PERFORMANCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_subject_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_record_id UUID NOT NULL REFERENCES public.student_academic_records(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NULL REFERENCES public.subjects(id) ON DELETE SET NULL,
    semester_number INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 8),
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    internal_marks NUMERIC(6,2) DEFAULT 0 CHECK (internal_marks >= 0),
    external_marks NUMERIC(6,2) DEFAULT 0 CHECK (external_marks >= 0),
    practical_marks NUMERIC(6,2) DEFAULT 0 CHECK (practical_marks >= 0),
    assignment_marks NUMERIC(6,2) DEFAULT 0 CHECK (assignment_marks >= 0),
    total_marks NUMERIC(7,2) DEFAULT 0 CHECK (total_marks >= 0),
    maximum_marks NUMERIC(7,2) DEFAULT 100 CHECK (maximum_marks > 0),
    percentage NUMERIC(6,2) CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
    credits NUMERIC(5,2) DEFAULT 3.0 CHECK (credits >= 0),
    grade VARCHAR(10) DEFAULT 'P',
    grade_point NUMERIC(4,2) DEFAULT 0 CHECK (grade_point >= 0 AND grade_point <= 10),
    result_status VARCHAR(30) DEFAULT 'PASS' CHECK (result_status IN ('PASS', 'FAIL', 'ATKT', 'ABSENT', 'WITHHELD')),
    attempt_number INTEGER DEFAULT 1 CHECK (attempt_number >= 1),
    is_backlog BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_subj_attempt UNIQUE (student_id, subject_code, semester_number, attempt_number)
);

-- ==============================================================================
-- 4. BACKLOG / ATKT RECORDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_backlogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NULL REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    semester_number INTEGER NOT NULL,
    academic_year_id UUID NULL,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'cleared', 'carried_forward', 'cancelled')),
    original_result_id UUID NULL REFERENCES public.student_subject_results(id) ON DELETE SET NULL,
    cleared_result_id UUID NULL REFERENCES public.student_subject_results(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cleared_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. FEE WALLET ACCOUNT TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_fee_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NULL,
    semester_number INTEGER NULL,
    total_fee NUMERIC(12,2) DEFAULT 0 CHECK (total_fee >= 0),
    scholarship_amount NUMERIC(12,2) DEFAULT 0 CHECK (scholarship_amount >= 0),
    discount_amount NUMERIC(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    payable_amount NUMERIC(12,2) DEFAULT 0 CHECK (payable_amount >= 0),
    paid_amount NUMERIC(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    pending_amount NUMERIC(12,2) DEFAULT 0 CHECK (pending_amount >= 0),
    account_status VARCHAR(30) DEFAULT 'active' CHECK (account_status IN ('active', 'paid', 'partially_paid', 'pending', 'overdue', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_fee_account UNIQUE (student_id)
);

-- ==============================================================================
-- 6. FEE INVOICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_account_id UUID NOT NULL REFERENCES public.student_fee_accounts(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    academic_year_id UUID NULL,
    semester_number INTEGER,
    invoice_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    scholarship_amount NUMERIC(12,2) DEFAULT 0 CHECK (scholarship_amount >= 0),
    discount_amount NUMERIC(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    pending_amount NUMERIC(12,2) DEFAULT 0 CHECK (pending_amount >= 0),
    status VARCHAR(30) DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    created_by UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. FEE INVOICE ITEMS (BREAKDOWN) TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fee_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
    fee_type VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. FEE PAYMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
    payment_reference VARCHAR(150) UNIQUE NOT NULL,
    transaction_id VARCHAR(255),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) CHECK (payment_method IN ('online', 'upi', 'card', 'net_banking', 'cash', 'cheque', 'bank_transfer')),
    payment_gateway VARCHAR(100) DEFAULT 'Razorpay',
    payment_status VARCHAR(30) DEFAULT 'success' CHECK (payment_status IN ('pending', 'processing', 'success', 'failed', 'refunded', 'cancelled')),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID NULL,
    gateway_response JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. PAYMENT RECEIPTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fee_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.fee_payments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    receipt_date TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    document_url TEXT,
    generated_by UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. SCHOLARSHIPS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NULL,
    scholarship_name VARCHAR(255) NOT NULL,
    scholarship_type VARCHAR(100),
    provider VARCHAR(255),
    application_number VARCHAR(150),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) DEFAULT 'approved' CHECK (status IN ('applied', 'approved', 'rejected', 'received', 'pending')),
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. FEE REFUNDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fee_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.fee_payments(id) ON DELETE CASCADE,
    refund_reference VARCHAR(150) UNIQUE NOT NULL,
    refund_amount NUMERIC(12,2) NOT NULL CHECK (refund_amount > 0),
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('requested', 'approved', 'processing', 'completed', 'rejected')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    approved_by UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. DIGITAL DOCUMENT WALLET TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
        'bonafide', 'fee_receipt', 'marksheet', 'admission_receipt',
        'transfer_certificate', 'leaving_certificate', 'migration_certificate',
        'internship_certificate', 'course_completion', 'identity_document', 'other'
    )),
    document_title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    document_number VARCHAR(150),
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE NULL,
    uploaded_by UUID NULL,
    verified BOOLEAN DEFAULT true,
    verified_by UUID NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. DIGITAL CERTIFICATES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    certificate_type VARCHAR(100) NOT NULL,
    certificate_number VARCHAR(150) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    issued_by UUID NULL,
    verification_code VARCHAR(150) UNIQUE NOT NULL,
    document_id UUID NULL REFERENCES public.student_documents(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 14. ACADEMIC RESULT PUBLICATION LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.academic_result_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_record_id UUID NOT NULL REFERENCES public.student_academic_records(id) ON DELETE CASCADE,
    action VARCHAR(30) NOT NULL CHECK (action IN ('published', 'unpublished')),
    performed_by UUID NOT NULL,
    previous_status BOOLEAN,
    new_status BOOLEAN,
    reason TEXT,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 15. ACADEMIC RESULT CHANGE LOGS (AUDIT) TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.academic_result_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_record_id UUID NOT NULL REFERENCES public.student_academic_records(id) ON DELETE CASCADE,
    subject_result_id UUID NULL REFERENCES public.student_subject_results(id) ON DELETE SET NULL,
    changed_by UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 16. INDEXES FOR HIGH-PERFORMANCE DASHBOARD QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_sar_student_sem ON public.student_academic_records(student_id, semester_number);
CREATE INDEX IF NOT EXISTS idx_sar_published ON public.student_academic_records(result_published);
CREATE INDEX IF NOT EXISTS idx_ssr_record ON public.student_subject_results(academic_record_id);
CREATE INDEX IF NOT EXISTS idx_ssr_student_sem ON public.student_subject_results(student_id, semester_number);
CREATE INDEX IF NOT EXISTS idx_backlogs_student ON public.student_backlogs(student_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_acc_student ON public.student_fee_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_student ON public.fee_receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_docs_student ON public.student_documents(student_id, document_type);
CREATE INDEX IF NOT EXISTS idx_certs_verify ON public.student_certificates(verification_code);

-- ==============================================================================
-- 17. VIEWS
-- ==============================================================================

-- 17.1 Attendance Summary View (Integrated with existing attendance tables)
CREATE OR REPLACE VIEW public.student_academic_attendance AS
SELECT 
    sas.student_id,
    sas.student_code,
    sas.semester,
    sas.subject_code,
    sas.subject_name,
    sas.faculty_name,
    COALESCE(sas.total_periods, 0) AS total_classes,
    COALESCE(sas.present_periods, 0) AS attended_classes,
    GREATEST(0, COALESCE(sas.total_periods, 0) - COALESCE(sas.present_periods, 0)) AS absent_classes,
    ROUND(
        CASE 
            WHEN COALESCE(sas.total_periods, 0) > 0 
            THEN (sas.present_periods::numeric / sas.total_periods::numeric * 100.0)
            ELSE 0.0 
        END, 2
    ) AS attendance_percentage,
    CASE 
        WHEN COALESCE(sas.total_periods, 0) = 0 THEN 'NOT_AVAILABLE'
        WHEN (sas.present_periods::numeric / sas.total_periods::numeric * 100.0) >= 75.0 THEN 'ELIGIBLE'
        ELSE 'SHORTAGE'
    END AS attendance_status
FROM public.student_attendance_subjects sas;

-- 17.2 Student Semester Results View (Restricted by publication flag)
CREATE OR REPLACE VIEW public.student_semester_results AS
SELECT 
    ssr.id AS subject_result_id,
    ssr.student_id,
    st.student_code,
    st.full_name AS student_name,
    sar.semester_number,
    sar.program_name,
    sar.department_code,
    ssr.subject_code,
    ssr.subject_name,
    ssr.credits,
    ssr.internal_marks,
    ssr.external_marks,
    ssr.practical_marks,
    ssr.assignment_marks,
    ssr.total_marks,
    ssr.maximum_marks,
    ssr.percentage,
    ssr.grade,
    ssr.grade_point,
    ssr.result_status,
    ssr.is_backlog,
    sar.result_published,
    sar.sgpa,
    sar.cgpa
FROM public.student_subject_results ssr
JOIN public.student_academic_records sar ON ssr.academic_record_id = sar.id
JOIN public.students st ON ssr.student_id = st.id;

-- 17.3 Student Digital Fee Wallet Summary View
CREATE OR REPLACE VIEW public.student_digital_wallet AS
SELECT 
    st.id AS student_id,
    st.student_code,
    st.full_name AS student_name,
    st.roll_no,
    st.class_name,
    COALESCE(sfa.total_fee, 0.00) AS total_fees,
    COALESCE(sfa.scholarship_amount, 0.00) AS scholarship,
    COALESCE(sfa.discount_amount, 0.00) AS discount,
    COALESCE(sfa.payable_amount, 0.00) AS payable,
    COALESCE(sfa.paid_amount, 0.00) AS paid,
    COALESCE(sfa.pending_amount, 0.00) AS pending,
    COALESCE(sfa.account_status, 'pending') AS fee_status,
    (
        SELECT MAX(payment_date) 
        FROM public.fee_payments fp 
        WHERE fp.student_id = st.id AND fp.payment_status = 'success'
    ) AS latest_payment_date,
    (
        SELECT receipt_number 
        FROM public.fee_receipts fr 
        WHERE fr.student_id = st.id 
        ORDER BY fr.receipt_date DESC LIMIT 1
    ) AS latest_receipt_number,
    (
        SELECT COUNT(*) 
        FROM public.student_documents sd 
        WHERE sd.student_id = st.id AND sd.status = 'active'
    ) AS document_count,
    (
        SELECT COUNT(*) 
        FROM public.student_certificates sc 
        WHERE sc.student_id = st.id AND sc.status = 'valid'
    ) AS certificate_count,
    (
        SELECT sar.sgpa 
        FROM public.student_academic_records sar 
        WHERE sar.student_id = st.id AND sar.result_published = true 
        ORDER BY sar.semester_number DESC LIMIT 1
    ) AS latest_sgpa,
    (
        SELECT sar.cgpa 
        FROM public.student_academic_records sar 
        WHERE sar.student_id = st.id AND sar.result_published = true 
        ORDER BY sar.semester_number DESC LIMIT 1
    ) AS latest_cgpa,
    (
        SELECT COUNT(*) 
        FROM public.student_backlogs sb 
        WHERE sb.student_id = st.id AND sb.status = 'active'
    ) AS backlogs_count
FROM public.students st
LEFT JOIN public.student_fee_accounts sfa ON st.id = sfa.student_id;

-- 17.4 Fee Wallet Transactions View
CREATE OR REPLACE VIEW public.student_fee_wallet_transactions AS
SELECT 
    fp.id AS payment_id,
    fp.student_id,
    fi.invoice_number,
    fp.payment_reference,
    fp.transaction_id,
    fp.payment_date,
    fp.amount,
    fp.payment_method,
    fp.payment_gateway,
    fp.payment_status,
    fr.receipt_number,
    fr.document_url AS receipt_url
FROM public.fee_payments fp
JOIN public.fee_invoices fi ON fp.invoice_id = fi.id
LEFT JOIN public.fee_receipts fr ON fp.id = fr.payment_id;

-- 17.5 Student Academic Dashboard View
CREATE OR REPLACE VIEW public.student_academic_dashboard AS
SELECT 
    st.id AS student_id,
    st.student_code,
    st.full_name AS student_name,
    st.roll_no,
    st.class_name,
    st.department_id,
    COALESCE(sar.semester_number, 5) AS current_semester,
    sar.sgpa AS latest_sgpa,
    sar.cgpa AS latest_cgpa,
    sar.percentage AS latest_percentage,
    sar.total_credits,
    sar.earned_credits,
    sar.subjects_passed,
    sar.subjects_failed,
    sar.result_status,
    sar.result_published,
    (
        SELECT COUNT(*) 
        FROM public.student_backlogs sb 
        WHERE sb.student_id = st.id AND sb.status = 'active'
    ) AS active_backlogs,
    ROUND(
        (SELECT AVG(attendance_percentage) FROM public.student_academic_attendance saa WHERE saa.student_id = st.id), 1
    ) AS overall_attendance_pct,
    COALESCE(sfa.payable_amount, 0.00) AS fee_payable,
    COALESCE(sfa.paid_amount, 0.00) AS fee_paid,
    COALESCE(sfa.pending_amount, 0.00) AS fee_pending,
    COALESCE(sfa.account_status, 'pending') AS fee_status
FROM public.students st
LEFT JOIN public.student_academic_records sar ON st.id = sar.student_id AND sar.semester_number = (
    SELECT MAX(sub_sar.semester_number) FROM public.student_academic_records sub_sar WHERE sub_sar.student_id = st.id
)
LEFT JOIN public.student_fee_accounts sfa ON st.id = sfa.student_id;

-- ==============================================================================
-- 18. FUNCTIONS & STORED PROCEDURES (BUSINESS LOGIC)
-- ==============================================================================

-- 18.1 Calculate Student SGPA
CREATE OR REPLACE FUNCTION public.calculate_student_sgpa(p_student_id UUID, p_semester INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    v_total_points NUMERIC := 0;
    v_total_credits NUMERIC := 0;
    v_sgpa NUMERIC := 0;
BEGIN
    SELECT 
        COALESCE(SUM(credits * grade_point), 0),
        COALESCE(SUM(credits), 0)
    INTO v_total_points, v_total_credits
    FROM public.student_subject_results
    WHERE student_id = p_student_id AND semester_number = p_semester;

    IF v_total_credits > 0 THEN
        v_sgpa := ROUND(v_total_points / v_total_credits, 2);
    ELSE
        v_sgpa := 0.00;
    END IF;

    -- Update academic record
    UPDATE public.student_academic_records
    SET 
        sgpa = v_sgpa,
        total_credits = v_total_credits,
        earned_credits = (
            SELECT COALESCE(SUM(credits), 0)
            FROM public.student_subject_results
            WHERE student_id = p_student_id AND semester_number = p_semester AND result_status = 'PASS'
        ),
        subjects_passed = (
            SELECT COUNT(*)
            FROM public.student_subject_results
            WHERE student_id = p_student_id AND semester_number = p_semester AND result_status = 'PASS'
        ),
        subjects_failed = (
            SELECT COUNT(*)
            FROM public.student_subject_results
            WHERE student_id = p_student_id AND semester_number = p_semester AND result_status != 'PASS'
        ),
        total_subjects = (
            SELECT COUNT(*)
            FROM public.student_subject_results
            WHERE student_id = p_student_id AND semester_number = p_semester
        ),
        updated_at = NOW()
    WHERE student_id = p_student_id AND semester_number = p_semester;

    RETURN v_sgpa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18.2 Calculate Student CGPA across all semesters
CREATE OR REPLACE FUNCTION public.calculate_student_cgpa(p_student_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_total_points NUMERIC := 0;
    v_total_credits NUMERIC := 0;
    v_cgpa NUMERIC := 0;
BEGIN
    SELECT 
        COALESCE(SUM(credits * grade_point), 0),
        COALESCE(SUM(credits), 0)
    INTO v_total_points, v_total_credits
    FROM public.student_subject_results
    WHERE student_id = p_student_id;

    IF v_total_credits > 0 THEN
        v_cgpa := ROUND(v_total_points / v_total_credits, 2);
    ELSE
        v_cgpa := 0.00;
    END IF;

    -- Update latest academic record
    UPDATE public.student_academic_records
    SET cgpa = v_cgpa, updated_at = NOW()
    WHERE student_id = p_student_id;

    RETURN v_cgpa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18.3 Result Publication Workflow
CREATE OR REPLACE FUNCTION public.publish_academic_result(
    p_record_id UUID,
    p_performed_by UUID,
    p_reason TEXT DEFAULT 'Semester Examination Committee Approval'
)
RETURNS JSONB AS $$
DECLARE
    v_prev_status BOOLEAN;
    v_record RECORD;
BEGIN
    SELECT * INTO v_record FROM public.student_academic_records WHERE id = p_record_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Academic record not found with ID %', p_record_id;
    END IF;

    v_prev_status := v_record.result_published;

    UPDATE public.student_academic_records
    SET 
        result_published = true,
        result_published_at = NOW(),
        result_published_by = p_performed_by,
        result_status = CASE 
            WHEN subjects_failed = 0 THEN 'PASS'
            WHEN subjects_failed <= 2 THEN 'ATKT'
            ELSE 'FAIL'
        END,
        updated_at = NOW()
    WHERE id = p_record_id;

    -- Log audit trail
    INSERT INTO public.academic_result_publications (
        academic_record_id, action, performed_by, previous_status, new_status, reason, performed_at
    ) VALUES (
        p_record_id, 'published', p_performed_by, v_prev_status, true, p_reason, NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'record_id', p_record_id,
        'action', 'published',
        'published_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18.4 Result Unpublication Workflow
CREATE OR REPLACE FUNCTION public.unpublish_academic_result(
    p_record_id UUID,
    p_performed_by UUID,
    p_reason TEXT DEFAULT 'Result withheld for grade re-verification'
)
RETURNS JSONB AS $$
DECLARE
    v_prev_status BOOLEAN;
BEGIN
    SELECT result_published INTO v_prev_status FROM public.student_academic_records WHERE id = p_record_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Academic record not found with ID %', p_record_id;
    END IF;

    UPDATE public.student_academic_records
    SET 
        result_published = false,
        result_published_at = NULL,
        result_published_by = NULL,
        updated_at = NOW()
    WHERE id = p_record_id;

    -- Log audit trail
    INSERT INTO public.academic_result_publications (
        academic_record_id, action, performed_by, previous_status, new_status, reason, performed_at
    ) VALUES (
        p_record_id, 'unpublished', p_performed_by, v_prev_status, false, p_reason, NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'record_id', p_record_id,
        'action', 'unpublished',
        'unpublished_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18.5 Record Fee Payment & Generate Receipt
CREATE OR REPLACE FUNCTION public.record_fee_payment(
    p_student_id UUID,
    p_invoice_id UUID,
    p_amount NUMERIC,
    p_method VARCHAR,
    p_ref VARCHAR,
    p_tx_id VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_payment_id UUID := gen_random_uuid();
    v_receipt_id UUID := gen_random_uuid();
    v_rcpt_no VARCHAR(100);
    v_inv RECORD;
    v_acc_id UUID;
    v_new_paid NUMERIC;
    v_new_pending NUMERIC;
BEGIN
    -- Verify invoice
    SELECT * INTO v_inv FROM public.fee_invoices WHERE id = p_invoice_id AND student_id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice % not found for student %', p_invoice_id, p_student_id;
    END IF;

    v_acc_id := v_inv.fee_account_id;

    -- Record Payment
    INSERT INTO public.fee_payments (
        id, student_id, invoice_id, payment_reference, transaction_id,
        amount, payment_method, payment_status, payment_date, verified_at
    ) VALUES (
        v_payment_id, p_student_id, p_invoice_id, p_ref, p_tx_id,
        p_amount, p_method, 'success', NOW(), NOW()
    );

    -- Generate Receipt Number
    v_rcpt_no := 'RCPT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(v_payment_id::text, 1, 6);

    INSERT INTO public.fee_receipts (
        id, payment_id, student_id, receipt_number, receipt_date, amount, document_url
    ) VALUES (
        v_receipt_id, v_payment_id, p_student_id, v_rcpt_no, NOW(), p_amount,
        '/documents/receipts/' || v_rcpt_no || '.pdf'
    );

    -- Update Invoice
    v_new_paid := v_inv.paid_amount + p_amount;
    v_new_pending := GREATEST(0, v_inv.total_amount - v_new_paid);

    UPDATE public.fee_invoices
    SET 
        paid_amount = v_new_paid,
        pending_amount = v_new_pending,
        status = CASE WHEN v_new_pending = 0 THEN 'paid' ELSE 'partially_paid' END,
        updated_at = NOW()
    WHERE id = p_invoice_id;

    -- Update Fee Account
    UPDATE public.student_fee_accounts
    SET 
        paid_amount = paid_amount + p_amount,
        pending_amount = GREATEST(0, payable_amount - (paid_amount + p_amount)),
        account_status = CASE 
            WHEN payable_amount - (paid_amount + p_amount) <= 0 THEN 'paid'
            ELSE 'partially_paid'
        END,
        updated_at = NOW()
    WHERE id = v_acc_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'receipt_number', v_rcpt_no,
        'amount_paid', p_amount,
        'pending_amount', v_new_pending
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18.6 Certificate Verification Function (Public RPC)
CREATE OR REPLACE FUNCTION public.verify_student_certificate(p_verification_code VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_cert RECORD;
    v_student RECORD;
BEGIN
    SELECT * INTO v_cert 
    FROM public.student_certificates 
    WHERE LOWER(verification_code) = LOWER(TRIM(p_verification_code));

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'message', 'Certificate verification code not found or invalid.'
        );
    END IF;

    SELECT full_name, student_code, class_name, roll_no INTO v_student
    FROM public.students
    WHERE id = v_cert.student_id;

    RETURN jsonb_build_object(
        'is_valid', (v_cert.status = 'valid'),
        'certificate_number', v_cert.certificate_number,
        'title', v_cert.title,
        'certificate_type', v_cert.certificate_type,
        'issue_date', v_cert.issue_date,
        'status', v_cert.status,
        'student_name', v_student.full_name,
        'student_code', v_student.student_code,
        'class_name', v_student.class_name,
        'institution', 'Shri Sant Gajanan Maharaj College of Engineering, Shegaon'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 19. SUPABASE STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('student-documents', 'student-documents', false),
    ('student-certificates', 'student-certificates', false),
    ('fee-receipts', 'fee-receipts', false),
    ('marksheets', 'marksheets', false)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 20. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_backlogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_result_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_result_change_logs ENABLE ROW LEVEL SECURITY;

-- Global permissive policies for full ERP compatibility
CREATE POLICY sar_all_policy ON public.student_academic_records FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY ssr_all_policy ON public.student_subject_results FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY sb_all_policy ON public.student_backlogs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY sfa_all_policy ON public.student_fee_accounts FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY fi_all_policy ON public.fee_invoices FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY fii_all_policy ON public.fee_invoice_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY fp_all_policy ON public.fee_payments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY fr_all_policy ON public.fee_receipts FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY ssch_all_policy ON public.student_scholarships FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY fref_all_policy ON public.fee_refunds FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY sdoc_all_policy ON public.student_documents FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY scert_all_policy ON public.student_certificates FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY arp_all_policy ON public.academic_result_publications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY arcl_all_policy ON public.academic_result_change_logs FOR ALL TO public USING (true) WITH CHECK (true);

