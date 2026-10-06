CREATE TABLE "public"."syllabus_faculty" (
  "id"         text                     NOT NULL DEFAULT (gen_random_uuid())::text,
  "name"       text                     NOT NULL,
  "role"       text                     NOT NULL,
  "department" text                     DEFAULT 'IT'::text,
  "subjects"   text,
  "email"      text,
  "tag"        text,
  "cabin"      text                     DEFAULT 'LH-201'::text,
  "avatar_url" text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "syllabus_faculty_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."syllabus_faculty"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon manage for syllabus_faculty" ON "public"."syllabus_faculty"
  FOR ALL
  TO PUBLIC
  USING (true);

CREATE POLICY "Public read for syllabus_faculty" ON "public"."syllabus_faculty"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_faculty" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_faculty" TO "service_role";

REVOKE ALL ON TABLE "public"."syllabus_faculty" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_faculty" TO "postgres";
