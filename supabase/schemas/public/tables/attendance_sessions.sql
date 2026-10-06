CREATE TABLE "public"."attendance_sessions" (
  "id"              uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "session_code"    character varying(40),
  "teacher_id"      uuid,
  "department_code" character varying(20)    NOT NULL,
  "department_name" character varying(200),
  "class_name"      character varying(50)    NOT NULL,
  "subject_code"    character varying(30)    NOT NULL,
  "subject_name"    character varying(250),
  "session_date"    date                     NOT NULL,
  "period"          character varying(20),
  "time_slot"       character varying(100),
  "topic_taught"    text,
  "teaching_aid"    character varying(200),
  "remark"          text,
  "session_type"    character varying(20)    DEFAULT 'REGULAR'::character varying,
  "total_students"  integer                  DEFAULT 0,
  "present_count"   integer                  DEFAULT 0,
  "absent_count"    integer                  DEFAULT 0,
  "attendance_rate" numeric(5,2)             DEFAULT 0.00,
  "status"          character varying(20)    DEFAULT 'DRAFT'::character varying,
  "submitted_at"    timestamp with time zone,
  "created_at"      timestamp with time zone DEFAULT now(),
  "updated_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "attendance_sessions_department_code_class_name_subject_code_key" UNIQUE (department_code, class_name, subject_code, session_date, period),
  CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY (id),
  CONSTRAINT "attendance_sessions_session_code_key" UNIQUE (session_code),
  CONSTRAINT "attendance_sessions_department_code_fkey" FOREIGN KEY (department_code) REFERENCES public.departments(code),
  CONSTRAINT "attendance_sessions_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL
);

ALTER TABLE "public"."attendance_sessions"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sessions_class ON public.attendance_sessions USING btree (class_name);

CREATE INDEX idx_sessions_date ON public.attendance_sessions USING btree (session_date DESC);

CREATE INDEX idx_sessions_status ON public.attendance_sessions USING btree (status);

CREATE INDEX idx_sessions_subject ON public.attendance_sessions USING btree (subject_code);

CREATE INDEX idx_sessions_teacher ON public.attendance_sessions USING btree (teacher_id);

CREATE TRIGGER trg_attendance_sessions_updated_at
  BEFORE UPDATE ON public.attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_session_code
  BEFORE INSERT ON public.attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_session_code();

CREATE POLICY "Insert sessions" ON "public"."attendance_sessions"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Read sessions" ON "public"."attendance_sessions"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Update sessions" ON "public"."attendance_sessions"
  FOR UPDATE
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attendance_sessions" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attendance_sessions" TO "service_role";

REVOKE ALL ON TABLE "public"."attendance_sessions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attendance_sessions" TO "postgres";
