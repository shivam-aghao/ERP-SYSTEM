-- ============================================================================
-- SSGMCE COLLEGE ERP — STEP 7: NOTIFICATIONS & REAL-TIME ALERTS
-- Database Migration: 03_notifications_realtime_alerts.sql
-- Production-Ready PostgreSQL Schema for Supabase Cloud
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    sender_id UUID NULL,
    action_url TEXT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id UUID NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    scheduled_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. NOTIFICATION RECIPIENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL,
    delivered_at TIMESTAMPTZ NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL,
    dismissed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notification_recipient UNIQUE (notification_id, recipient_id)
);

-- ----------------------------------------------------------------------------
-- 3. NOTIFICATION TARGETS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('user', 'class', 'division', 'department', 'semester', 'role', 'college')),
    target_id TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. NOTIFICATION PREFERENCES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT false,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_pref_type UNIQUE (user_id, notification_type)
);

-- ----------------------------------------------------------------------------
-- 5. NOTIFICATION DELIVERY LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL,
    channel VARCHAR(30) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'push', 'email')),
    status VARCHAR(30) NOT NULL DEFAULT 'delivered' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'skipped')),
    delivered_at TIMESTAMPTZ NULL DEFAULT NOW(),
    error_message TEXT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. NOTIFICATION TEMPLATES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    default_priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. NOTIFICATION AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NULL,
    action VARCHAR(50) NOT NULL,
    performed_by UUID NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. INDEXES FOR HIGH-THROUGHPUT REAL-TIME ACCESS
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON public.notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_notif_recipients_user ON public.notification_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_notif ON public.notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_read ON public.notification_recipients(read_at);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_created ON public.notification_recipients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_composite ON public.notification_recipients(recipient_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_composite_feed ON public.notification_recipients(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notif_targets_notif ON public.notification_targets(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON public.notification_preferences(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_notif_logs_recipient ON public.notification_delivery_logs(recipient_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATION RECIPIENTS VIEW (FOR RICH QUERIES)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_user_notifications AS
SELECT 
    nr.id AS recipient_record_id,
    nr.recipient_id,
    nr.notification_id,
    n.notification_type,
    n.title,
    n.message,
    n.priority,
    n.sender_id,
    n.action_url,
    n.entity_type,
    n.entity_id,
    n.metadata,
    n.expires_at,
    nr.delivered_at,
    nr.read_at,
    nr.dismissed_at,
    (nr.read_at IS NOT NULL) AS is_read,
    (nr.dismissed_at IS NOT NULL) AS is_dismissed,
    nr.created_at AS received_at,
    n.created_at AS sent_at
FROM public.notification_recipients nr
JOIN public.notifications n ON nr.notification_id = n.id
WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
  AND nr.dismissed_at IS NULL;

-- ----------------------------------------------------------------------------
-- 10. CORE STORED PROCEDURES / RPCS
-- ----------------------------------------------------------------------------

-- Function: create_targeted_notification
CREATE OR REPLACE FUNCTION public.create_targeted_notification(
    p_notification_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_sender_id UUID DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL,
    p_target_type VARCHAR(50) DEFAULT 'user',
    p_target_id TEXT DEFAULT NULL,
    p_entity_type VARCHAR(100) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_count INT := 0;
BEGIN
    -- 1. Create base notification
    INSERT INTO public.notifications (
        notification_type, title, message, priority, sender_id,
        action_url, entity_type, entity_id, metadata, scheduled_at, expires_at
    ) VALUES (
        p_notification_type, p_title, p_message, p_priority, p_sender_id,
        p_action_url, p_entity_type, p_entity_id, p_metadata, p_scheduled_at, p_expires_at
    ) RETURNING id INTO v_notification_id;

    -- 2. Record target
    INSERT INTO public.notification_targets (
        notification_id, target_type, target_id
    ) VALUES (
        v_notification_id, p_target_type, p_target_id
    );

    -- 3. If scheduled in the future, don't fan out to recipients yet
    IF p_scheduled_at IS NOT NULL AND p_scheduled_at > NOW() THEN
        INSERT INTO public.notification_audit_logs (notification_id, action, performed_by, new_value)
        VALUES (v_notification_id, 'scheduled', p_sender_id, jsonb_build_object('scheduled_at', p_scheduled_at, 'target_type', p_target_type));
        RETURN v_notification_id;
    END IF;

    -- 4. Fan out to recipients based on target_type
    IF p_target_type = 'user' THEN
        -- Target by student_code, emp_code, or exact UUID
        INSERT INTO public.notification_recipients (notification_id, recipient_id)
        SELECT v_notification_id, u.id
        FROM (
            SELECT id FROM public.students WHERE id::text = p_target_id OR student_code = p_target_id
            UNION
            SELECT id FROM public.teachers WHERE id::text = p_target_id OR emp_code = p_target_id
            UNION
            SELECT id FROM public.admins WHERE id::text = p_target_id OR username = p_target_id
        ) u
        ON CONFLICT (notification_id, recipient_id) DO NOTHING;

    ELSIF p_target_type = 'class' THEN
        -- All students in class (by class_id or class_name)
        INSERT INTO public.notification_recipients (notification_id, recipient_id)
        SELECT v_notification_id, s.id
        FROM public.students s
        WHERE s.class_id::text = p_target_id 
           OR LOWER(s.class_name) = LOWER(p_target_id)
        ON CONFLICT (notification_id, recipient_id) DO NOTHING;

    ELSIF p_target_type = 'division' THEN
        INSERT INTO public.notification_recipients (notification_id, recipient_id)
        SELECT v_notification_id, s.id
        FROM public.students s
        WHERE LOWER(s.division) = LOWER(p_target_id)
        ON CONFLICT (notification_id, recipient_id) DO NOTHING;

    ELSIF p_target_type = 'department' THEN
        -- All students and teachers in department
        INSERT INTO public.notification_recipients (notification_id, recipient_id)
        SELECT v_notification_id, s.id
        FROM public.students s
        LEFT JOIN public.departments d ON s.department_id = d.id
        WHERE s.department_id::text = p_target_id OR LOWER(d.code) = LOWER(p_target_id)
        UNION
        SELECT v_notification_id, t.id
        FROM public.teachers t
        LEFT JOIN public.departments d ON t.department_id = d.id
        WHERE t.department_id::text = p_target_id OR LOWER(d.code) = LOWER(p_target_id)
        ON CONFLICT (notification_id, recipient_id) DO NOTHING;

    ELSIF p_target_type = 'semester' THEN
        -- Students enrolled in specific semester
        INSERT INTO public.notification_recipients (notification_id, recipient_id)
        SELECT v_notification_id, s.id
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE c.semester = p_target_id::int
        ON CONFLICT (notification_id, recipient_id) DO NOTHING;

    ELSIF p_target_type = 'role' THEN
        IF LOWER(p_target_id) = 'student' THEN
            INSERT INTO public.notification_recipients (notification_id, recipient_id)
            SELECT v_notification_id, s.id FROM public.students s
            ON CONFLICT (notification_id, recipient_id) DO NOTHING;
        ELSIF LOWER(p_target_id) IN ('teacher', 'faculty') THEN
            INSERT INTO public.notification_recipients (notification_id, recipient_id)
            SELECT v_notification_id, t.id FROM public.teachers t
            ON CONFLICT (notification_id, recipient_id) DO NOTHING;
        ELSIF LOWER(p_target_id) = 'admin' THEN
            INSERT INTO public.notification_recipients (notification_id, recipient_id)
            SELECT v_notification_id, a.id FROM public.admins a
            ON CONFLICT (notification_id, recipient_id) DO NOTHING;
        END IF;

    ELSIF p_target_type = 'college' THEN
        -- Broadcast to entire college (all students + teachers + admins)
        INSERT INTO public.notification_recipients (notification_id, recipient_id)
        SELECT v_notification_id, s.id FROM public.students s
        UNION
        SELECT v_notification_id, t.id FROM public.teachers t
        UNION
        SELECT v_notification_id, a.id FROM public.admins a
        ON CONFLICT (notification_id, recipient_id) DO NOTHING;
    END IF;

    -- 5. Audit Log
    GET DIAGNOSTICS v_count = ROW_COUNT;
    INSERT INTO public.notification_audit_logs (notification_id, action, performed_by, new_value)
    VALUES (v_notification_id, 'sent', p_sender_id, jsonb_build_object('recipient_count', v_count, 'priority', p_priority));

    RETURN v_notification_id;
END;
$$;


-- Helper RPC: mark_notification_read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
    p_notification_id UUID,
    p_recipient_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notification_recipients
    SET read_at = NOW()
    WHERE notification_id = p_notification_id 
      AND recipient_id = p_recipient_id
      AND read_at IS NULL;
    RETURN FOUND;
END;
$$;


-- Helper RPC: mark_all_notifications_read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(
    p_recipient_id UUID
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated INT;
BEGIN
    UPDATE public.notification_recipients
    SET read_at = NOW()
    WHERE recipient_id = p_recipient_id
      AND read_at IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$;


-- Helper RPC: dismiss_notification
CREATE OR REPLACE FUNCTION public.dismiss_notification(
    p_notification_id UUID,
    p_recipient_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notification_recipients
    SET dismissed_at = NOW()
    WHERE notification_id = p_notification_id 
      AND recipient_id = p_recipient_id;
    RETURN FOUND;
END;
$$;


-- Helper RPC: get_unread_notification_count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(
    p_recipient_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unread_count INT := 0;
    v_urgent_count INT := 0;
    v_high_count INT := 0;
    v_total_count INT := 0;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE nr.read_at IS NULL),
        COUNT(*) FILTER (WHERE nr.read_at IS NULL AND n.priority = 'urgent'),
        COUNT(*) FILTER (WHERE nr.read_at IS NULL AND n.priority = 'high'),
        COUNT(*)
    INTO v_unread_count, v_urgent_count, v_high_count, v_total_count
    FROM public.notification_recipients nr
    JOIN public.notifications n ON nr.notification_id = n.id
    WHERE nr.recipient_id = p_recipient_id
      AND nr.dismissed_at IS NULL
      AND (n.expires_at IS NULL OR n.expires_at > NOW());

    RETURN jsonb_build_object(
        'unread_count', COALESCE(v_unread_count, 0),
        'urgent_count', COALESCE(v_urgent_count, 0),
        'high_priority_count', COALESCE(v_high_count, 0),
        'total_active', COALESCE(v_total_count, 0)
    );
END;
$$;


-- Function: process_scheduled_notifications
CREATE OR REPLACE FUNCTION public.process_scheduled_notifications()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    v_processed INT := 0;
BEGIN
    FOR r IN 
        SELECT n.id, nt.target_type, nt.target_id
        FROM public.notifications n
        JOIN public.notification_targets nt ON n.id = nt.notification_id
        WHERE n.scheduled_at <= NOW()
          AND NOT EXISTS (
              SELECT 1 FROM public.notification_recipients nr WHERE nr.notification_id = n.id
          )
    LOOP
        -- Fan out
        IF r.target_type = 'college' THEN
            INSERT INTO public.notification_recipients (notification_id, recipient_id)
            SELECT r.id, s.id FROM public.students s
            UNION
            SELECT r.id, t.id FROM public.teachers t
            UNION
            SELECT r.id, a.id FROM public.admins a
            ON CONFLICT DO NOTHING;
        ELSIF r.target_type = 'class' THEN
            INSERT INTO public.notification_recipients (notification_id, recipient_id)
            SELECT r.id, s.id FROM public.students s
            WHERE s.class_id::text = r.target_id OR LOWER(s.class_name) = LOWER(r.target_id)
            ON CONFLICT DO NOTHING;
        END IF;

        INSERT INTO public.notification_audit_logs (notification_id, action, performed_by, new_value)
        VALUES (r.id, 'scheduled_released', NULL, jsonb_build_object('released_at', NOW()));

        v_processed := v_processed + 1;
    END LOOP;

    RETURN v_processed;
END;
$$;


-- Module Integration RPC: create_result_notification
CREATE OR REPLACE FUNCTION public.create_result_notification(
    p_class_id TEXT,
    p_semester INT,
    p_published_by UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notif_id UUID;
    v_title VARCHAR(255);
    v_msg TEXT;
BEGIN
    v_title := format('Semester %s Examination Results Published', p_semester);
    v_msg := format('The official academic results for Semester %s have been published. View your grades, SGPA, and performance breakdown.', p_semester);

    v_notif_id := public.create_targeted_notification(
        p_notification_type := 'result',
        p_title := v_title,
        p_message := v_msg,
        p_priority := 'high',
        p_sender_id := p_published_by,
        p_action_url := format('/student/results?semester=%s', p_semester),
        p_target_type := 'class',
        p_target_id := p_class_id,
        p_entity_type := 'academic_result',
        p_metadata := jsonb_build_object('semester', p_semester, 'class_id', p_class_id)
    );

    RETURN v_notif_id;
END;
$$;


-- Module Integration RPC: create_quiz_notification
CREATE OR REPLACE FUNCTION public.create_quiz_notification(
    p_quiz_id UUID,
    p_class_id TEXT,
    p_title VARCHAR(255),
    p_teacher_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notif_id UUID;
BEGIN
    v_notif_id := public.create_targeted_notification(
        p_notification_type := 'quiz',
        p_title := format('New Assessment Available: %s', p_title),
        p_message := format('A new online assessment "%s" has been assigned to your class. Please review instructions and deadlines.', p_title),
        p_priority := 'high',
        p_sender_id := p_teacher_id,
        p_action_url := format('/student/quiz?id=%s', p_quiz_id),
        p_target_type := 'class',
        p_target_id := p_class_id,
        p_entity_type := 'quiz',
        p_entity_id := p_quiz_id,
        p_metadata := jsonb_build_object('quiz_id', p_quiz_id, 'quiz_title', p_title)
    );
    RETURN v_notif_id;
END;
$$;


-- Module Integration RPC: create_fee_notification
CREATE OR REPLACE FUNCTION public.create_fee_notification(
    p_student_id UUID,
    p_notif_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_action_url TEXT DEFAULT '/student/fees',
    p_priority VARCHAR(20) DEFAULT 'normal'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.create_targeted_notification(
        p_notification_type := p_notif_type,
        p_title := p_title,
        p_message := p_message,
        p_priority := p_priority,
        p_sender_id := NULL,
        p_action_url := p_action_url,
        p_target_type := 'user',
        p_target_id := p_student_id::text,
        p_entity_type := 'fee_account'
    );
END;
$$;


-- Module Integration RPC: create_attendance_notification
CREATE OR REPLACE FUNCTION public.create_attendance_notification(
    p_student_id UUID,
    p_subject_name VARCHAR(255),
    p_percentage NUMERIC
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_priority VARCHAR(20) := 'high';
BEGIN
    IF p_percentage < 65 THEN
        v_priority := 'urgent';
    END IF;

    RETURN public.create_targeted_notification(
        p_notification_type := 'attendance',
        p_title := format('Low Attendance Warning: %s%% in %s', p_percentage, p_subject_name),
        p_message := format('Your attendance in %s is currently %s%%, which is below the mandatory 75%% university eligibility threshold.', p_subject_name, p_percentage),
        p_priority := v_priority,
        p_sender_id := NULL,
        p_action_url := '/student/attendance',
        p_target_type := 'user',
        p_target_id := p_student_id::text,
        p_entity_type := 'attendance_subject',
        p_metadata := jsonb_build_object('subject', p_subject_name, 'percentage', p_percentage)
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) & GRANTS
-- ----------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if any
DROP POLICY IF EXISTS "Public read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public read notification recipients" ON public.notification_recipients;
DROP POLICY IF EXISTS "Public update notification recipients" ON public.notification_recipients;
DROP POLICY IF EXISTS "Public read notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Public update notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Allow all for authenticated and service_role" ON public.notifications;

-- Permissive RLS Policies (allows ERP REST queries & Supabase Realtime)
CREATE POLICY "Public read notifications" ON public.notifications
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Public read notification recipients" ON public.notification_recipients
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Public update notification recipients" ON public.notification_recipients
    FOR UPDATE TO PUBLIC USING (true) WITH CHECK (true);

CREATE POLICY "Public insert notification recipients" ON public.notification_recipients
    FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE POLICY "Public read notification preferences" ON public.notification_preferences
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Public manage notification preferences" ON public.notification_preferences
    FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

CREATE POLICY "Public read notification templates" ON public.notification_templates
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Public manage notification delivery logs" ON public.notification_delivery_logs
    FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

-- Permissions
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notification_recipients TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notification_targets TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notification_preferences TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notification_delivery_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notification_templates TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notification_audit_logs TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 12. SUPABASE REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_recipients;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
