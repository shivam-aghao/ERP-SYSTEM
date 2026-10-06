CREATE TABLE "public"."student_timetables" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "student_code" text                     NOT NULL DEFAULT '308637'::text,
  "day_of_week"  text                     NOT NULL,
  "period_no"    integer                  NOT NULL,
  "start_time"   time without time zone   NOT NULL,
  "end_time"     time without time zone   NOT NULL,
  "subject_code" text                     NOT NULL,
  "subject_name" text                     NOT NULL,
  "session_type" text                     NOT NULL DEFAULT 'Theory'::text,
  "room"         text                     NOT NULL DEFAULT 'LH-204'::text,
  "faculty_name" text                     NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "student_timetables_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."student_timetables"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read student timetables" ON "public"."student_timetables"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_timetables" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_timetables" TO "service_role";

REVOKE ALL ON TABLE "public"."student_timetables" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_timetables" TO "postgres";
