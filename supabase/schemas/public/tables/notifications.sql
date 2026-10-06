CREATE TABLE "public"."notifications" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "teacher_id" uuid,
  "title"      character varying(250)   NOT NULL,
  "message"    text,
  "type"       character varying(30)    DEFAULT 'info'::character varying,
  "is_read"    boolean                  DEFAULT false,
  "action_url" text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "notifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "notifications_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE
);

ALTER TABLE "public"."notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_notifications_teacher ON public.notifications USING btree (teacher_id, is_read);

CREATE INDEX notifications_type_idx ON public.notifications USING btree (TYPE);

CREATE POLICY "Read notifications" ON "public"."notifications"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "service_role";

REVOKE ALL ON TABLE "public"."notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "postgres";
