CREATE TABLE "public"."syllabus_subjects" (
  "id"                text                     NOT NULL DEFAULT (gen_random_uuid())::text,
  "code"              text                     NOT NULL,
  "name"              text                     NOT NULL,
  "type"              text                     NOT NULL DEFAULT 'Core'::text,
  "credits"           numeric                  NOT NULL DEFAULT 3.0,
  "faculty_name"      text,
  "short_description" text,
  "department"        text                     DEFAULT 'IT'::text,
  "semester"          text                     DEFAULT 'Semester V'::text,
  "academic_year"     text                     DEFAULT '2025-2026'::text,
  "syllabus_progress" integer                  DEFAULT 75,
  "pdf_url"           text,
  "created_at"        timestamp with time zone DEFAULT now(),
  CONSTRAINT "syllabus_subjects_code_key" UNIQUE (code),
  CONSTRAINT "syllabus_subjects_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."syllabus_subjects"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon manage for syllabus_subjects" ON "public"."syllabus_subjects"
  FOR ALL
  TO PUBLIC
  USING (true);

CREATE POLICY "Public read for syllabus_subjects" ON "public"."syllabus_subjects"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_subjects" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_subjects" TO "service_role";

REVOKE ALL ON TABLE "public"."syllabus_subjects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_subjects" TO "postgres";
