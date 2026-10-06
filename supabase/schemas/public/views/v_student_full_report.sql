CREATE VIEW "public"."v_student_full_report" AS  SELECT s.id,
    s.roll_no,
    s.student_code,
    s.enrollment_no,
    s.name,
    s.department_code,
    s.class_name,
    s.is_provisional,
    count(ar.id) FILTER (WHERE ((ar.status)::text = 'PRESENT'::text)) AS total_attended,
    count(ar.id) AS total_conducted,
        CASE
            WHEN (count(ar.id) > 0) THEN round((((count(ar.id) FILTER (WHERE ((ar.status)::text = 'PRESENT'::text)))::numeric / (count(ar.id))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS overall_attendance_rate
   FROM (public.students s
     LEFT JOIN public.attendance_records ar ON ((ar.student_id = s.id)))
  GROUP BY s.id;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_student_full_report" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_student_full_report" TO "service_role";

REVOKE ALL ON TABLE "public"."v_student_full_report" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."v_student_full_report" TO "postgres";
