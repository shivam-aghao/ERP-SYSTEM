CREATE TABLE "public"."students" (
  "id"              uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "roll_no"         integer                  NOT NULL,
  "student_code"    character varying(40),
  "enrollment_no"   character varying(40),
  "name"            character varying(200)   NOT NULL,
  "department_code" character varying(20),
  "class_id"        uuid,
  "class_name"      character varying(50),
  "email"           character varying(200),
  "phone"           character varying(20),
  "is_provisional"  boolean                  DEFAULT false,
  "is_active"       boolean                  DEFAULT true,
  "created_at"      timestamp with time zone DEFAULT now(),
  "updated_at"      timestamp with time zone DEFAULT now(),
  "sis_id"          character varying,
  "full_name"       character varying,
  "department_id"   uuid,
  "year"            integer,
  "division"        character varying,
  "status"          character varying        DEFAULT 'ACTIVE'::character varying,
  CONSTRAINT "students_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL,
  CONSTRAINT "students_department_code_class_name_roll_no_key" UNIQUE (department_code, class_name, roll_no),
  CONSTRAINT "students_department_code_fkey" FOREIGN KEY (department_code) REFERENCES public.departments(code),
  CONSTRAINT "students_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT,
  CONSTRAINT "students_enrollment_no_key" UNIQUE (enrollment_no),
  CONSTRAINT "students_pkey" PRIMARY KEY (id),
  CONSTRAINT "students_student_code_key" UNIQUE (student_code)
);

ALTER TABLE "public"."students"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_students_class ON public.students USING btree (class_name);

CREATE INDEX idx_students_code ON public.students USING btree (student_code);

CREATE INDEX idx_students_dept ON public.students USING btree (department_code);

CREATE INDEX idx_students_enroll ON public.students USING btree (enrollment_no);

CREATE INDEX idx_students_roll ON public.students USING btree (roll_no);

CREATE INDEX students_class_id_idx ON public.students USING btree (class_id);

CREATE INDEX students_department_id_idx ON public.students USING btree (department_id);

CREATE INDEX students_sis_id_idx ON public.students USING btree (sis_id);

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read students" ON "public"."students"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."students" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."students" TO "service_role";

REVOKE ALL ON TABLE "public"."students" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."students" TO "postgres";
