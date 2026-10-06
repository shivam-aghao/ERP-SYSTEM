CREATE VIEW "public"."v_recent_attendance" AS  SELECT id,
    session_code AS id_display,
    session_date,
    to_char((session_date)::timestamp with time zone, 'DD Mon YYYY'::text) AS date_formatted,
    department_code,
    class_name,
    subject_code,
    subject_name,
    present_count,
    total_students,
    attendance_rate,
    status,
    created_at,
    teacher_id
   FROM public.attendance_sessions ses
  ORDER BY created_at DESC;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_recent_attendance" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_recent_attendance" TO "service_role";

REVOKE ALL ON TABLE "public"."v_recent_attendance" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_recent_attendance" TO "postgres";
