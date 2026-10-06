CREATE TABLE "public"."question_bank" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "question_text"   text                     NOT NULL,
  "question_type"   character varying        NOT NULL DEFAULT 'MCQ'::character varying,
  "subject_id"      uuid,
  "subject_name"    character varying        DEFAULT 'Computer Science'::character varying,
  "topic"           character varying,
  "difficulty"      character varying        NOT NULL DEFAULT 'MEDIUM'::character varying,
  "marks"           numeric(6,2)             NOT NULL DEFAULT 2,
  "negative_marks"  numeric(6,2)             NOT NULL DEFAULT 0,
  "expected_answer" text,
  "explanation"     text,
  "created_by"      uuid,
  "created_at"      timestamp with time zone DEFAULT now(),
  "updated_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "question_bank_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."question_bank"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX question_bank_difficulty_idx ON public.question_bank USING btree (difficulty);

CREATE INDEX question_bank_subject_idx ON public.question_bank USING btree (subject_name);

CREATE INDEX question_bank_topic_idx ON public.question_bank USING btree (topic);

CREATE POLICY "quiz_question_bank_public_access" ON "public"."question_bank"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."question_bank" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."question_bank" TO "service_role";

REVOKE ALL ON TABLE "public"."question_bank" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."question_bank" TO "postgres";
