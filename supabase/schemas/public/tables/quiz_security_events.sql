CREATE TABLE "public"."quiz_security_events" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "attempt_id" uuid                     NOT NULL,
  "event_type" character varying        NOT NULL,
  "event_time" timestamp with time zone DEFAULT now(),
  "metadata"   jsonb                    DEFAULT '{}'::jsonb,
  CONSTRAINT "quiz_security_events_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT "quiz_security_events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."quiz_security_events"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX quiz_security_events_attempt_idx ON public.quiz_security_events USING btree (attempt_id);

CREATE POLICY "quiz_security_events_public_access" ON "public"."quiz_security_events"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_security_events" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_security_events" TO "service_role";

REVOKE ALL ON TABLE "public"."quiz_security_events" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_security_events" TO "postgres";
