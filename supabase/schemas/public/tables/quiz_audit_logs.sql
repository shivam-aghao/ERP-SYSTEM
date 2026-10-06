CREATE TABLE "public"."quiz_audit_logs" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     character varying,
  "action"      character varying        NOT NULL,
  "entity_type" character varying        NOT NULL,
  "entity_id"   character varying,
  "timestamp"   timestamp with time zone DEFAULT now(),
  "metadata"    jsonb                    DEFAULT '{}'::jsonb,
  CONSTRAINT "quiz_audit_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."quiz_audit_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX quiz_audit_logs_entity_idx ON public.quiz_audit_logs USING btree (entity_type, entity_id);

CREATE POLICY "quiz_audit_logs_public_access" ON "public"."quiz_audit_logs"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_audit_logs" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_audit_logs" TO "service_role";

REVOKE ALL ON TABLE "public"."quiz_audit_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_audit_logs" TO "postgres";
