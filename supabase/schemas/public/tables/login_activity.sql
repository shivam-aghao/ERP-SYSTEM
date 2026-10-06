CREATE TABLE "public"."login_activity" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "profile_id" uuid                     NOT NULL,
  "login_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "user_agent" text,
  CONSTRAINT "login_activity_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."login_activity"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_login_activity_profile_id ON public.login_activity USING btree (profile_id);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."login_activity" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."login_activity" TO "service_role";

REVOKE ALL ON TABLE "public"."login_activity" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."login_activity" TO "postgres";
