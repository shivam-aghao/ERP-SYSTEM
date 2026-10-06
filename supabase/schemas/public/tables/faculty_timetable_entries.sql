CREATE TABLE "public"."faculty_timetable_entries" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "faculty_id"     uuid                     NOT NULL,
  "academic_year"  text                     NOT NULL,
  "session"        text                     NOT NULL DEFAULT 'Autumn'::text,
  "effective_from" date                     NOT NULL,
  "day_of_week"    integer                  NOT NULL,
  "start_time"     time without time zone   NOT NULL,
  "end_time"       time without time zone   NOT NULL,
  "subject_code"   text,
  "subject_name"   text                     NOT NULL,
  "class_code"     text,
  "room"           text,
  "entry_type"     text                     NOT NULL DEFAULT 'lecture'::text,
  "division"       text,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "faculty_timetable_entries_day_of_week_check" CHECK (((day_of_week >= 1) AND (day_of_week <= 6))),
  CONSTRAINT "faculty_timetable_entries_entry_type_check" CHECK ((entry_type = ANY (ARRAY['lecture'::text, 'practical'::text, 'break'::text]))),
  CONSTRAINT "faculty_timetable_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "faculty_timetable_time_check" CHECK ((end_time > start_time)),
  CONSTRAINT "faculty_timetable_entries_faculty_id_fkey" FOREIGN KEY (faculty_id) REFERENCES public.teachers(id) ON DELETE CASCADE
);

ALTER TABLE "public"."faculty_timetable_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_faculty_timetable_lookup ON public.faculty_timetable_entries USING btree (faculty_id, academic_year, day_of_week, start_time);

CREATE POLICY "Authenticated users can view faculty timetable" ON "public"."faculty_timetable_entries"
  FOR SELECT
  TO "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."faculty_timetable_entries" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."faculty_timetable_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."faculty_timetable_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."faculty_timetable_entries" TO "postgres";
