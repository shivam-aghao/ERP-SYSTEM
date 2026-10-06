CREATE TABLE "public"."syllabus_units" (
  "id"           text                     NOT NULL DEFAULT (gen_random_uuid())::text,
  "subject_code" text                     NOT NULL,
  "unit_number"  integer                  NOT NULL,
  "title"        text                     NOT NULL,
  "hours"        integer                  NOT NULL DEFAULT 6,
  "topics"       text                     NOT NULL,
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "syllabus_units_pkey" PRIMARY KEY (id),
  CONSTRAINT "syllabus_units_subject_code_fkey" FOREIGN KEY (subject_code) REFERENCES public.syllabus_subjects(code) ON DELETE CASCADE
);

ALTER TABLE "public"."syllabus_units"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon manage for syllabus_units" ON "public"."syllabus_units"
  FOR ALL
  TO PUBLIC
  USING (true);

CREATE POLICY "Public read for syllabus_units" ON "public"."syllabus_units"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_units" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_units" TO "service_role";

REVOKE ALL ON TABLE "public"."syllabus_units" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_units" TO "postgres";
