CREATE TABLE "public"."subject_syllabus" (
  "id"                         character varying(36)  NOT NULL,
  "subject_code"               character varying(20),
  "subject_name"               character varying(150),
  "credits"                    integer,
  "faculty_name"               character varying(100),
  "faculty_designation"        character varying(100),
  "faculty_email"              character varying(100),
  "faculty_cabin"              character varying(100),
  "syllabus_progress"          integer,
  "university_curriculum_code" character varying(50),
  "curriculum_pdf_url"         text,
  CONSTRAINT "subject_syllabus_pkey" PRIMARY KEY (id)
);

CREATE INDEX ix_subject_syllabus_subject_code ON public.subject_syllabus USING btree (subject_code);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subject_syllabus" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subject_syllabus" TO "service_role";

REVOKE ALL ON TABLE "public"."subject_syllabus" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subject_syllabus" TO "postgres";
