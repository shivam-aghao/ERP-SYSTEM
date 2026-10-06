CREATE TABLE "public"."timetable_entries" (
  "id"            character varying(36)  NOT NULL,
  "day"           character varying(20),
  "period_num"    character varying(20),
  "period_time"   character varying(50),
  "course_code"   character varying(20),
  "course_name"   character varying(150),
  "venue"         character varying(100),
  "teacher_name"  character varying(100),
  "status"        character varying(50),
  "status_class"  character varying(50),
  "att_label"     character varying(50),
  "is_completed"  boolean,
  "is_active_now" boolean,
  "is_critical"   boolean,
  CONSTRAINT "timetable_entries_pkey" PRIMARY KEY (id)
);

CREATE INDEX ix_timetable_entries_day ON public.timetable_entries USING btree (day);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."timetable_entries" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."timetable_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."timetable_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."timetable_entries" TO "postgres";
