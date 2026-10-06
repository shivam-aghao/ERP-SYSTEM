CREATE TABLE "public"."attendance_records" (
  "id"           uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "session_id"   uuid                     NOT NULL,
  "student_id"   uuid,
  "student_code" character varying(40),
  "roll_no"      integer                  NOT NULL,
  "student_name" character varying(200)   NOT NULL,
  "status"       character varying(10)    NOT NULL DEFAULT 'PRESENT'::character varying,
  "remarks"      text,
  "marked_at"    timestamp with time zone DEFAULT now(),
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "attendance_records_pkey" PRIMARY KEY (id),
  CONSTRAINT "attendance_records_session_id_roll_no_key" UNIQUE (session_id, roll_no),
  CONSTRAINT "attendance_records_session_id_student_id_key" UNIQUE (session_id, student_id),
  CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL
);

ALTER TABLE "public"."attendance_records"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_records_session ON public.attendance_records USING btree (session_id);

CREATE INDEX idx_records_status ON public.attendance_records USING btree (status);

CREATE INDEX idx_records_student ON public.attendance_records USING btree (student_id);

CREATE TRIGGER trg_records_recalc
  AFTER INSERT OR DELETE OR UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_session_stats();

CREATE POLICY "Insert records" ON "public"."attendance_records"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Read records" ON "public"."attendance_records"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Update records" ON "public"."attendance_records"
  FOR UPDATE
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attendance_records" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attendance_records" TO "service_role";

REVOKE ALL ON TABLE "public"."attendance_records" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attendance_records" TO "postgres";
