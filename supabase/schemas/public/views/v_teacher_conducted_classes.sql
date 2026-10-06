CREATE VIEW "public"."v_teacher_conducted_classes" AS  SELECT id AS session_id,
    teacher_id,
    session_date AS date,
    period AS time_slot,
    class_name AS class_code,
    subject_name AS course_name,
    subject_code AS course_code,
    topic_taught AS topic,
    present_count,
    total_students,
    attendance_rate,
    status
   FROM public.attendance_sessions ses
  WHERE ((status)::text = 'SUBMITTED'::text);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_teacher_conducted_classes" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_teacher_conducted_classes" TO "service_role";

REVOKE ALL ON TABLE "public"."v_teacher_conducted_classes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_teacher_conducted_classes" TO "postgres";
