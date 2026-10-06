CREATE TABLE "public"."syllabus_progress" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "subject_code"       text                     NOT NULL,
  "class_code"         text                     NOT NULL,
  "faculty_id"         uuid                     NOT NULL,
  "unit_number"        integer                  NOT NULL,
  "unit_name"          text                     NOT NULL,
  "completion_percent" integer                  DEFAULT 0,
  "updated_at"         timestamp with time zone DEFAULT now(),
  CONSTRAINT "syllabus_progress_completion_percent_check" CHECK (((completion_percent >= 0) AND (completion_percent <= 100))),
  CONSTRAINT "syllabus_progress_pkey" PRIMARY KEY (id),
  CONSTRAINT "syllabus_progress_subject_code_class_code_unit_number_key" UNIQUE (subject_code, class_code, unit_number)
);

ALTER TABLE "public"."syllabus_progress"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_syllabus_progress_updated_at
  BEFORE UPDATE ON public.syllabus_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_progress" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_progress" TO "service_role";

REVOKE ALL ON TABLE "public"."syllabus_progress" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."syllabus_progress" TO "postgres";
