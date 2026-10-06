CREATE TABLE "public"."student_attendance" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "student_code"    text                     NOT NULL DEFAULT '308637'::text,
  "subject_code"    text                     NOT NULL,
  "subject_name"    text                     NOT NULL,
  "subject_type"    text                     NOT NULL DEFAULT 'TH'::text,
  "present_periods" integer                  NOT NULL DEFAULT 0,
  "total_periods"   integer                  NOT NULL DEFAULT 0,
  "faculty_name"    text,
  "classroom"       text                     DEFAULT 'LH-204'::text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "student_attendance_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."student_attendance"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read student attendance" ON "public"."student_attendance"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_attendance" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_attendance" TO "service_role";

REVOKE ALL ON TABLE "public"."student_attendance" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_attendance" TO "postgres";
