CREATE TABLE "public"."quiz_attempt_answers" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "attempt_id"           uuid                     NOT NULL,
  "question_id"          uuid                     NOT NULL,
  "selected_option"      character varying(10),
  "selected_options"     jsonb,
  "text_answer"          text,
  "is_marked_for_review" boolean                  DEFAULT false,
  "is_correct"           boolean                  DEFAULT false,
  "marks_obtained"       numeric(8,2)             DEFAULT 0,
  "time_taken_seconds"   numeric(8,2)             DEFAULT 0,
  "created_at"           timestamp with time zone DEFAULT now(),
  "updated_at"           timestamp with time zone DEFAULT now(),
  "marks_awarded"        numeric(8,2)             DEFAULT 0,
  CONSTRAINT "quiz_attempt_answers_attempt_id_question_id_key" UNIQUE (attempt_id, question_id),
  CONSTRAINT "quiz_attempt_answers_pkey" PRIMARY KEY (id),
  CONSTRAINT "quiz_attempt_answers_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.question_bank(id) ON DELETE RESTRICT,
  CONSTRAINT "quiz_attempt_answers_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id) ON DELETE CASCADE
);

ALTER TABLE "public"."quiz_attempt_answers"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX quiz_attempt_answers_attempt_idx ON public.quiz_attempt_answers USING btree (attempt_id);

CREATE POLICY "quiz_attempt_answers_public_access" ON "public"."quiz_attempt_answers"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_attempt_answers" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_attempt_answers" TO "service_role";

REVOKE ALL ON TABLE "public"."quiz_attempt_answers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_attempt_answers" TO "postgres";
