CREATE TABLE "public"."classes" (
  "id"              uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "department_code" character varying(20)    NOT NULL,
  "name"            character varying(50)    NOT NULL,
  "year"            character varying(20),
  "division"        character varying(10),
  "semester"        integer,
  "student_count"   integer                  DEFAULT 0,
  "is_active"       boolean                  DEFAULT true,
  "created_at"      timestamp with time zone DEFAULT now(),
  "updated_at"      timestamp with time zone DEFAULT now(),
  "department_id"   uuid,
  "class_name"      character varying,
  "academic_year"   character varying,
  CONSTRAINT "classes_department_code_name_key" UNIQUE (department_code, name),
  CONSTRAINT "classes_pkey" PRIMARY KEY (id),
  CONSTRAINT "classes_department_code_fkey" FOREIGN KEY (department_code) REFERENCES public.departments(code) ON DELETE CASCADE,
  CONSTRAINT "classes_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."classes"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX classes_class_name_idx ON public.classes USING btree (class_name);

CREATE INDEX classes_department_id_idx ON public.classes USING btree (department_id);

CREATE INDEX idx_classes_dept ON public.classes USING btree (department_code);

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read classes" ON "public"."classes"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classes" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classes" TO "service_role";

REVOKE ALL ON TABLE "public"."classes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classes" TO "postgres";
