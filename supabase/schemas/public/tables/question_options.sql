CREATE TABLE "public"."question_options" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "question_id"  uuid                     NOT NULL,
  "option_key"   character varying(10)    NOT NULL,
  "option_text"  text                     NOT NULL,
  "option_order" integer                  NOT NULL DEFAULT 1,
  "is_correct"   boolean                  NOT NULL DEFAULT false,
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "question_options_pkey" PRIMARY KEY (id),
  CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.question_bank(id) ON DELETE CASCADE
);

ALTER TABLE "public"."question_options"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX question_options_question_idx ON public.question_options USING btree (question_id);

CREATE POLICY "quiz_options_public_access" ON "public"."question_options"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."question_options" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."question_options" TO "service_role";

REVOKE ALL ON TABLE "public"."question_options" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."question_options" TO "postgres";
