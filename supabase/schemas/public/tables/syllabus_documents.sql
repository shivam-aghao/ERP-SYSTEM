CREATE TABLE "public"."syllabus_documents" (
  "id"            text                     NOT NULL DEFAULT (gen_random_uuid())::text,
  "title"         text                     NOT NULL,
  "description"   text,
  "document_type" text                     DEFAULT 'Syllabus Regulations'::text,
  "file_size"     text                     DEFAULT '2.4 MB'::text,
  "file_url"      text                     NOT NULL,
  "department"    text                     DEFAULT 'IT'::text,
  "semester"      text                     DEFAULT 'Semester V'::text,
  "updated_date"  text                     DEFAULT 'Jan 2026'::text,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "syllabus_documents_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."syllabus_documents"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon manage for syllabus_documents" ON "public"."syllabus_documents"
  FOR ALL
  TO PUBLIC
  USING (true);

CREATE POLICY "Public read for syllabus_documents" ON "public"."syllabus_documents"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_documents" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_documents" TO "service_role";

REVOKE ALL ON TABLE "public"."syllabus_documents" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_documents" TO "postgres";
