CREATE TABLE "public"."curriculum_syllabi" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "department_code"   text                     NOT NULL,
  "course_code"       text                     NOT NULL,
  "course_name"       text                     NOT NULL,
  "course_type"       text                     NOT NULL DEFAULT 'Core'::text,
  "semester"          integer                  NOT NULL DEFAULT 4,
  "credits"           integer                  NOT NULL DEFAULT 3,
  "short_code"        text                     NOT NULL,
  "faculty_name"      text                     NOT NULL,
  "faculty_email"     text,
  "syllabus_overview" text,
  "units"             jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "textbooks"         jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "curriculum_syllabi_course_code_key" UNIQUE (course_code),
  CONSTRAINT "curriculum_syllabi_course_type_check" CHECK ((course_type = ANY (ARRAY['Core'::text, 'PE1'::text, 'PE2'::text, 'OE'::text, 'MD'::text, 'Lab'::text]))),
  CONSTRAINT "curriculum_syllabi_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."curriculum_syllabi"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_curriculum_syllabi_updated_at
  BEFORE UPDATE ON public.curriculum_syllabi
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read curriculum syllabi" ON "public"."curriculum_syllabi"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."curriculum_syllabi" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."curriculum_syllabi" TO "service_role";

REVOKE ALL ON TABLE "public"."curriculum_syllabi" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."curriculum_syllabi" TO "postgres";
