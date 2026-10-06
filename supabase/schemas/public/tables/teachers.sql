CREATE TABLE "public"."teachers" (
  "id"              uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "emp_code"        character varying(30)    NOT NULL,
  "full_name"       character varying(200)   NOT NULL,
  "designation"     character varying(100),
  "department_code" character varying(20),
  "email"           character varying(200),
  "phone"           character varying(20),
  "avatar_initials" character varying(5),
  "password_hash"   text,
  "is_active"       boolean                  DEFAULT true,
  "last_login_at"   timestamp with time zone,
  "created_at"      timestamp with time zone DEFAULT now(),
  "updated_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "teachers_department_code_fkey" FOREIGN KEY (department_code) REFERENCES public.departments(code),
  CONSTRAINT "teachers_email_key" UNIQUE (email),
  CONSTRAINT "teachers_emp_code_key" UNIQUE (emp_code),
  CONSTRAINT "teachers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."teachers"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_teachers_dept ON public.teachers USING btree (department_code);

CREATE INDEX idx_teachers_emp_code ON public.teachers USING btree (emp_code);

CREATE TRIGGER trg_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read teachers" ON "public"."teachers"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teachers" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teachers" TO "service_role";

REVOKE ALL ON TABLE "public"."teachers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teachers" TO "postgres";
