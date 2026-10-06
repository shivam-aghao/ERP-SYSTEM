CREATE TABLE "public"."admins" (
  "admin_id"   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "profile_id" uuid                     NOT NULL,
  "admin_code" character varying(100)   NOT NULL,
  "first_name" character varying(100)   NOT NULL,
  "last_name"  character varying(100),
  "phone"      character varying(20),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admins_admin_code_key" UNIQUE (admin_code),
  CONSTRAINT "admins_pkey" PRIMARY KEY (admin_id),
  CONSTRAINT "admins_profile_id_key" UNIQUE (profile_id),
  CONSTRAINT "admins_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."admins"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_admins_code ON public.admins USING btree (admin_code);

CREATE INDEX idx_admins_profile_id ON public.admins USING btree (profile_id);

CREATE TRIGGER set_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins Read" ON "public"."admins"
  FOR SELECT
  TO PUBLIC
  USING ((public.get_auth_role() = 'admin'::text));

CREATE POLICY "Admins Service Manage" ON "public"."admins"
  FOR ALL
  TO PUBLIC
  USING ((((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR (public.get_auth_role() = 'admin'::text)))
  WITH CHECK ((((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR (public.get_auth_role() = 'admin'::text)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admins" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admins" TO "service_role";

REVOKE ALL ON TABLE "public"."admins" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admins" TO "postgres";
