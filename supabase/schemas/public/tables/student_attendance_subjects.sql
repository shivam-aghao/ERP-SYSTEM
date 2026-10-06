CREATE TABLE "public"."student_attendance_subjects" (
  "id"              character varying(36)    NOT NULL,
  "student_code"    character varying(20),
  "academic_year"   character varying(20),
  "semester"        character varying(20),
  "subject_name"    character varying(150)   NOT NULL,
  "subject_code"    character varying(50)    NOT NULL,
  "subject_type"    character varying(10),
  "type_name"       character varying(20),
  "present_periods" integer,
  "total_periods"   integer,
  "faculty_name"    character varying(100),
  "classroom"       character varying(50),
  "created_at"      timestamp with time zone,
  CONSTRAINT "student_attendance_subjects_pkey" PRIMARY KEY (id)
);

CREATE INDEX ix_student_attendance_subjects_student_code ON public.student_attendance_subjects USING btree (student_code);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_attendance_subjects" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_attendance_subjects" TO "service_role";

REVOKE ALL ON TABLE "public"."student_attendance_subjects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_attendance_subjects" TO "postgres";
