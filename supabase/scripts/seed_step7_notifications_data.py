import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
import urllib.request
import urllib.error
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def main():
    token = get_supabase_token()
    print("Acquired Supabase token successfully.")

    # 1. Seed Templates
    templates = [
        ("quiz_created", "quiz", "New Quiz Available: {{quiz_title}}", "A new online assessment '{{quiz_title}}' has been posted for your class. Duration: {{duration}} mins.", "high"),
        ("quiz_deadline", "quiz", "Quiz Deadline Approaching: {{quiz_title}}", "The deadline to submit quiz '{{quiz_title}}' is in 1 hour.", "high"),
        ("quiz_result_published", "quiz", "Quiz Results Published: {{quiz_title}}", "Results for quiz '{{quiz_title}}' have been reviewed and published.", "normal"),
        ("result_published", "result", "Semester {{semester}} Results Published", "Official academic examination results for Semester {{semester}} are now published.", "high"),
        ("attendance_shortage", "attendance", "Attendance Alert: {{percentage}}% in {{subject_name}}", "Your attendance in {{subject_name}} is {{percentage}}%, below the required 75% eligibility threshold.", "high"),
        ("fee_invoice_created", "fee", "Fee Invoice Generated (AY {{academic_year}})", "Your college fee invoice for AY {{academic_year}} is now ready. Total payable: Rs. {{amount}}.", "normal"),
        ("fee_payment_success", "payment", "Fee Payment Received: Rs. {{amount}}", "Your online payment of Rs. {{amount}} was processed successfully. Receipt #{{receipt_no}} is available.", "normal"),
        ("fee_payment_failed", "payment", "Payment Transaction Failed", "Your transaction of Rs. {{amount}} could not be completed. Please check your bank and try again.", "high"),
        ("timetable_changed", "timetable", "Lecture Schedule Change: {{subject_name}}", "Tomorrow's {{subject_name}} lecture has been rescheduled to {{new_time}} in Room {{room}}.", "normal"),
        ("admin_announcement", "announcement", "Notice: {{title}}", "{{message}}", "normal"),
        ("emergency_alert", "emergency", "EMERGENCY: {{title}}", "{{message}}", "urgent")
    ]

    template_rows = []
    for k, t, title, msg, p in templates:
        escaped_title = title.replace("'", "''")
        escaped_msg = msg.replace("'", "''")
        template_rows.append(f"('{k}', '{t}', '{escaped_title}', '{escaped_msg}', '{p}', true)")

    sql_templates = """
    INSERT INTO public.notification_templates (template_key, notification_type, title_template, message_template, default_priority, enabled)
    VALUES 
    """ + ",\n".join(template_rows) + """
    ON CONFLICT (template_key) DO UPDATE SET
        title_template = EXCLUDED.title_template,
        message_template = EXCLUDED.message_template,
        default_priority = EXCLUDED.default_priority,
        updated_at = NOW();
    """

    print("Seeding notification templates...")
    run_query(sql_templates, token)
    print("Templates seeded successfully!")

    # 2. Get student 308637 specifically
    students_res = json.loads(run_query("SELECT id, student_code, full_name, class_id, class_name FROM public.students WHERE student_code = '308637';", token))
    if not students_res:
        students_res = json.loads(run_query("SELECT id, student_code, full_name, class_id, class_name FROM public.students LIMIT 1;", token))
    shivam = students_res[0]
    shivam_id = shivam['id']
    print(f"Targeting student {shivam['student_code']} ({shivam['full_name']}) id={shivam_id}")

    # 3. Seed Seed Notifications via create_targeted_notification
    seed_sql = f"""
    DO $$
    DECLARE
        v_sid UUID := '{shivam_id}';
        v_nid UUID;
    BEGIN
        -- 1. Urgent College Emergency/Announcements
        v_nid := public.create_targeted_notification(
            p_notification_type := 'emergency',
            p_title := 'Campus Advisory: Scheduled Maintenance on Campus Servers',
            p_message := 'SSGMCE Campus ERP maintenance window is scheduled for tonight 11:30 PM to 1:00 AM. Services will remain active in read-only mode.',
            p_priority := 'urgent',
            p_target_type := 'college',
            p_action_url := '/student/announcements'
        );

        -- 2. Semester Results Published
        v_nid := public.create_targeted_notification(
            p_notification_type := 'result',
            p_title := 'Semester 5 Results Published',
            p_message := 'Official academic results for Semester 5 (Winter 2025) are now published. Your SGPA: 9.25, CGPA: 8.87. Download marksheet in D-Wallet.',
            p_priority := 'high',
            p_target_type := 'user',
            p_target_id := v_sid::text,
            p_action_url := '/student/results?semester=5',
            p_entity_type := 'academic_result'
        );

        -- 3. Quiz notification
        v_nid := public.create_targeted_notification(
            p_notification_type := 'quiz',
            p_title := 'New Quiz Available: Data Structures & Algorithms Lab',
            p_message := 'Unit Test Assessment on Binary Trees & Graph Traversal has been assigned. Duration: 45 Mins, Total Marks: 25. Complete by Friday 5:00 PM.',
            p_priority := 'high',
            p_target_type := 'user',
            p_target_id := v_sid::text,
            p_action_url := '/student/quiz',
            p_entity_type := 'quiz'
        );

        -- 4. Attendance Alert
        v_nid := public.create_targeted_notification(
            p_notification_type := 'attendance',
            p_title := 'Attendance Update: 88.4% Cumulative Attendance',
            p_message := 'Your overall attendance is in the Excellent category (>75%). Eligibility criteria for Semester End Examinations (ESE) is satisfied.',
            p_priority := 'normal',
            p_target_type := 'user',
            p_target_id := v_sid::text,
            p_action_url := '/student/attendance',
            p_entity_type := 'attendance'
        );

        -- 5. Fee Payment Success
        v_nid := public.create_targeted_notification(
            p_notification_type := 'payment',
            p_title := 'Fee Payment Verified: Rs. 45,000 Received',
            p_message := 'Payment receipt #REC-2025-001 has been generated and digitally verified. Balance pending: Rs. 13,500.',
            p_priority := 'normal',
            p_target_type := 'user',
            p_target_id := v_sid::text,
            p_action_url := '/student/fees',
            p_entity_type := 'fee_receipt'
        );

        -- 6. Document & Certificate Wallet Alert
        v_nid := public.create_targeted_notification(
            p_notification_type := 'certificate',
            p_title := 'Dean Merit List Certificate Issued',
            p_message := 'Dean Academic Honor Roll Certificate (Code: SSGMCE-ACAD-308637) has been cryptographically issued to your Digital Wallet.',
            p_priority := 'normal',
            p_target_type := 'user',
            p_target_id := v_sid::text,
            p_action_url := '/student/dwallet',
            p_entity_type := 'certificate'
        );

        -- 7. Broadcast Announcement for all Students
        v_nid := public.create_targeted_notification(
            p_notification_type := 'announcement',
            p_title := 'Annual Technical Symposium: TechFest 2026 Registration Open',
            p_message := 'Registrations for Code-A-Thon, WebCraft, and Robotics are now open. Visit the student council desk or register online.',
            p_priority := 'normal',
            p_target_type := 'role',
            p_target_id := 'student',
            p_action_url := '/student/announcements'
        );

        -- Seed Preferences for student
        INSERT INTO public.notification_preferences (user_id, notification_type, in_app_enabled, email_enabled, push_enabled)
        VALUES 
            (v_sid, 'announcement', true, false, true),
            (v_sid, 'academic', true, true, true),
            (v_sid, 'attendance', true, true, true),
            (v_sid, 'quiz', true, true, true),
            (v_sid, 'result', true, true, true),
            (v_sid, 'fee', true, false, true),
            (v_sid, 'emergency', true, true, true)
        ON CONFLICT (user_id, notification_type) DO NOTHING;
    END $$;
    """

    print("Seeding targeted notifications and preferences...")
    run_query(seed_sql, token)
    print("Seed complete!")

    # Verify counts
    cnt = json.loads(run_query(f"SELECT COUNT(*) as cnt FROM public.notification_recipients WHERE recipient_id = '{shivam_id}';", token))
    print(f"Total notifications delivered to student {shivam['student_code']}:", cnt[0]['cnt'])

if __name__ == '__main__':
    main()
