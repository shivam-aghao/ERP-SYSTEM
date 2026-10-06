CREATE TABLE "public"."quiz_questions" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "quiz_id"        uuid                     NOT NULL,
  "question_id"    uuid                     NOT NULL,
  "question_order" integer                  NOT NULL DEFAULT 1,
  "marks"          numeric(6,2)             NOT NULL DEFAULT 2,
  "negative_marks" numeric(6,2)             NOT NULL DEFAULT 0,
  "created_at"     timestamp with time zone DEFAULT now(),
  CONSTRAINT "quiz_questions_pkey" PRIMARY KEY (id),
  CONSTRAINT "quiz_questions_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.question_bank(id) ON DELETE RESTRICT,
  CONSTRAINT "quiz_questions_quiz_id_question_id_key" UNIQUE (quiz_id, question_id),
  CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE
);

ALTER TABLE "public"."quiz_questions"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX quiz_questions_question_idx ON public.quiz_questions USING btree (question_id);

CREATE INDEX quiz_questions_quiz_idx ON public.quiz_questions USING btree (quiz_id);

CREATE POLICY "quiz_questions_public_access" ON "public"."quiz_questions"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_questions" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_questions" TO "service_role";

REVOKE ALL ON TABLE "public"."quiz_questions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_questions" TO "postgres";
