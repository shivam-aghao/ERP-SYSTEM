CREATE VIEW "public"."v_student_course_summary" AS  SELECT ar.student_id,
    ses.subject_code AS course_code,
    ses.subject_name AS course_name,
    t.full_name AS teacher_name,
    count(ar.id) AS total_lectures,
    count(ar.id) FILTER (WHERE ((ar.status)::text = 'PRESENT'::text)) AS present_lectures,
        CASE
            WHEN (count(ar.id) > 0) THEN round((((count(ar.id) FILTER (WHERE ((ar.status)::text = 'PRESENT'::text)))::numeric / (count(ar.id))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS percentage
   FROM ((public.attendance_records ar
     JOIN public.attendance_sessions ses ON ((ses.id = ar.session_id)))
     LEFT JOIN public.teachers t ON ((t.id = ses.teacher_id)))
  GROUP BY ar.student_id, ses.subject_code, ses.subject_name, t.full_name;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_student_course_summary" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_student_course_summary" TO "service_role";

REVOKE ALL ON TABLE "public"."v_student_course_summary" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_student_course_summary" TO "postgres";
