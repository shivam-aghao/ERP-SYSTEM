CREATE TABLE "public"."subjects" (
  "id"              uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "department_code" character varying(20)    NOT NULL,
  "code"            character varying(30)    NOT NULL,
  "name"            character varying(250)   NOT NULL,
  "type"            character varying(20)    DEFAULT 'THEORY'::character varying,
  "credits"         integer,
  "semester"        integer,
  "is_active"       boolean                  DEFAULT true,
  "created_at"      timestamp with time zone DEFAULT now(),
  "updated_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "subjects_code_key" UNIQUE (code),
  CONSTRAINT "subjects_department_code_code_key" UNIQUE (department_code, code),
  CONSTRAINT "subjects_department_code_fkey" FOREIGN KEY (department_code) REFERENCES public.departments(code) ON DELETE CASCADE,
  CONSTRAINT "subjects_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."subjects"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_subjects_code ON public.subjects USING btree (code);

CREATE INDEX idx_subjects_dept ON public.subjects USING btree (department_code);

CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read subjects" ON "public"."subjects"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subjects" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subjects" TO "service_role";

REVOKE ALL ON TABLE "public"."subjects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subjects" TO "postgres";
