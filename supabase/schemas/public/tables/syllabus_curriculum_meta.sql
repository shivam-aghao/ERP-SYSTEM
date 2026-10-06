CREATE TABLE "public"."syllabus_curriculum_meta" (
  "id"           text                     NOT NULL DEFAULT (gen_random_uuid())::text,
  "subject_code" text                     NOT NULL,
  "outcomes"     text                     NOT NULL,
  "books"        text                     NOT NULL,
  "scheme"       text                     DEFAULT 'Autonomous B.Tech R-2023 / NEP-2020'::text,
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "syllabus_curriculum_meta_pkey" PRIMARY KEY (id),
  CONSTRAINT "syllabus_curriculum_meta_subject_code_key" UNIQUE (subject_code),
  CONSTRAINT "syllabus_curriculum_meta_subject_code_fkey" FOREIGN KEY (subject_code) REFERENCES public.syllabus_subjects(code) ON DELETE CASCADE
);

ALTER TABLE "public"."syllabus_curriculum_meta"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon manage for syllabus_curriculum_meta" ON "public"."syllabus_curriculum_meta"
  FOR ALL
  TO PUBLIC
  USING (true);

CREATE POLICY "Public read for syllabus_curriculum_meta" ON "public"."syllabus_curriculum_meta"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_curriculum_meta" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_curriculum_meta" TO "service_role";

REVOKE ALL ON TABLE "public"."syllabus_curriculum_meta" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_curriculum_meta" TO "postgres";
