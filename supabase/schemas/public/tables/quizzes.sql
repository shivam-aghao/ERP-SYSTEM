CREATE TABLE "public"."quizzes" (
  "id"                        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "teacher_id"                uuid,
  "class_id"                  uuid                     NOT NULL,
  "title"                     character varying        NOT NULL,
  "description"               text,
  "subject_id"                uuid,
  "duration_minutes"          integer                  NOT NULL DEFAULT 30,
  "total_marks"               numeric(6,2)             NOT NULL DEFAULT 100,
  "marks_per_question"        numeric(4,2)             NOT NULL DEFAULT 1,
  "negative_marks"            numeric(4,2)             NOT NULL DEFAULT 0,
  "start_time"                timestamp with time zone,
  "end_time"                  timestamp with time zone,
  "max_attempts"              integer                  NOT NULL DEFAULT 1,
  "status"                    character varying        NOT NULL DEFAULT 'DRAFT'::character varying,
  "created_at"                timestamp with time zone DEFAULT now(),
  "updated_at"                timestamp with time zone DEFAULT now(),
  "subject_name"              character varying        DEFAULT 'Computer Science'::character varying,
  "instructions"              text,
  "start_at"                  timestamp with time zone DEFAULT now(),
  "end_at"                    timestamp with time zone DEFAULT (now() + '7 days'::interval),
  "passing_marks"             numeric(6,2)             DEFAULT 40,
  "shuffle_questions"         boolean                  DEFAULT false,
  "shuffle_options"           boolean                  DEFAULT false,
  "allow_question_navigation" boolean                  DEFAULT true,
  "allow_back_navigation"     boolean                  DEFAULT true,
  "show_result_immediately"   boolean                  DEFAULT true,
  "show_correct_answers"      boolean                  DEFAULT true,
  "result_release_mode"       character varying        DEFAULT 'IMMEDIATE'::character varying,
  "negative_marking"          boolean                  DEFAULT false,
  "require_all_questions"     boolean                  DEFAULT false,
  "allow_unanswered"          boolean                  DEFAULT true,
  "is_published"              boolean                  DEFAULT false,
  CONSTRAINT "quizzes_pkey" PRIMARY KEY (id),
  CONSTRAINT "quizzes_status_check"
    CHECK
    (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'SCHEDULED'::character varying, 'PUBLISHED'::character varying, 'ACTIVE'::character varying, 'CLOSED'::character
    varying, 'ARCHIVED'::character varying])::text[])))
);

ALTER TABLE "public"."quizzes"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_quizzes_is_published ON public.quizzes USING btree (is_published);

CREATE INDEX quizzes_class_id_idx ON public.quizzes USING btree (class_id);

CREATE INDEX quizzes_status_idx ON public.quizzes USING btree (status);

CREATE INDEX quizzes_teacher_id_idx ON public.quizzes USING btree (teacher_id);

CREATE TRIGGER trg_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone can insert/update quizzes" ON "public"."quizzes"
  FOR ALL
  TO PUBLIC
  USING (true);

CREATE POLICY "Anyone can read published quizzes" ON "public"."quizzes"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Teachers manage their quizzes" ON "public"."quizzes"
  FOR ALL
  TO PUBLIC
  USING (((teacher_id = auth.uid()) OR (auth.role() = 'service_role'::text)));

CREATE POLICY "quiz_module_public_access" ON "public"."quizzes"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quizzes" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quizzes" TO "service_role";

REVOKE ALL ON TABLE "public"."quizzes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quizzes" TO "postgres";
