CREATE TABLE "public"."timetable" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "faculty_id"    uuid                     NOT NULL,
  "day_of_week"   integer                  NOT NULL,
  "slot_index"    integer                  NOT NULL,
  "subject_code"  text,
  "class_code"    text,
  "room"          text,
  "is_lab"        boolean                  DEFAULT false,
  "academic_year" text                     NOT NULL,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "timetable_day_of_week_check" CHECK (((day_of_week >= 1) AND (day_of_week <= 7))),
  CONSTRAINT "timetable_faculty_id_day_of_week_slot_index_academic_year_key" UNIQUE (faculty_id, day_of_week, slot_index, academic_year),
  CONSTRAINT "timetable_pkey" PRIMARY KEY (id),
  CONSTRAINT "timetable_slot_index_check" CHECK (((slot_index >= 1) AND (slot_index <= 6)))
);

ALTER TABLE "public"."timetable"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."timetable" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."timetable" TO "service_role";

REVOKE ALL ON TABLE "public"."timetable" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."timetable" TO "postgres";
