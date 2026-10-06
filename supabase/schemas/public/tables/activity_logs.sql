CREATE TABLE "public"."activity_logs" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "faculty_id"    uuid,
  "activity_type" text                     NOT NULL,
  "title"         text                     NOT NULL,
  "description"   text,
  "icon"          text                     DEFAULT 'activity'::text,
  "icon_style"    text                     DEFAULT 'blue'::text,
  "metadata"      jsonb                    DEFAULT '{}'::jsonb,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "activity_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."activity_logs"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."activity_logs" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."activity_logs" TO "service_role";

REVOKE ALL ON TABLE "public"."activity_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."activity_logs" TO "postgres";
