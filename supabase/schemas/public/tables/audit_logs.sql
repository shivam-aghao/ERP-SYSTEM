CREATE TABLE "public"."audit_logs" (
  "id"          uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "teacher_id"  uuid,
  "entity_type" character varying(50),
  "entity_id"   uuid,
  "action"      character varying(30),
  "old_values"  jsonb,
  "new_values"  jsonb,
  "ip_address"  character varying(45),
  "created_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "audit_logs_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL
);

ALTER TABLE "public"."audit_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_entity ON public.audit_logs USING btree (entity_type, entity_id);

CREATE INDEX idx_audit_teacher ON public.audit_logs USING btree (teacher_id);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_logs" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_logs" TO "service_role";

REVOKE ALL ON TABLE "public"."audit_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_logs" TO "postgres";
