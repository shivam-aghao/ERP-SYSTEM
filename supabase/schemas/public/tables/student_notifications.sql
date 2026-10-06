CREATE TABLE "public"."student_notifications" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "student_code" text                     DEFAULT '308637'::text,
  "title"        text                     NOT NULL,
  "message"      text                     NOT NULL,
  "severity"     text                     NOT NULL DEFAULT 'info'::text,
  "source"       text                     NOT NULL DEFAULT 'Examination Cell'::text,
  "is_read"      boolean                  NOT NULL DEFAULT false,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "student_notifications_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."student_notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read student notifications" ON "public"."student_notifications"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_notifications" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_notifications" TO "service_role";

REVOKE ALL ON TABLE "public"."student_notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_notifications" TO "postgres";
