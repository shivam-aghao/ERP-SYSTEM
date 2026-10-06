CREATE TABLE "public"."results" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "student_id"      uuid                     NOT NULL,
  "subject_code"    text                     NOT NULL,
  "assessment_type" text                     NOT NULL,
  "marks_obtained"  numeric(5,2),
  "max_marks"       numeric(5,2),
  "academic_year"   text                     NOT NULL,
  "semester"        text,
  "uploaded_by"     uuid,
  "uploaded_at"     timestamp with time zone DEFAULT now(),
  CONSTRAINT "results_pkey" PRIMARY KEY (id),
  CONSTRAINT "results_student_id_subject_code_assessment_type_academic_ye_key" UNIQUE (student_id, subject_code, assessment_type, academic_year)
);

ALTER TABLE "public"."results"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."results" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."results" TO "service_role";

REVOKE ALL ON TABLE "public"."results" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."results" TO "postgres";
