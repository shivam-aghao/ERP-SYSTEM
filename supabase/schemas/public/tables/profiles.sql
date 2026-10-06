CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "user_id"    character varying(100)   NOT NULL,
  "first_name" character varying(100)   NOT NULL,
  "last_name"  character varying(100),
  "email"      character varying(255),
  "phone"      character varying(20),
  "role_id"    uuid                     NOT NULL,
  "status"     character varying(20)    NOT NULL DEFAULT 'active'::character varying,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_email_key" UNIQUE (email),
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[]))),
  CONSTRAINT "profiles_user_id_key" UNIQUE (user_id),
  CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_role_id ON public.profiles USING btree (role_id);

CREATE INDEX idx_profiles_status ON public.profiles USING btree (status);

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Profiles Read" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (((auth.uid() = id) OR (public.get_auth_role() = ANY (ARRAY['employee'::text, 'admin'::text]))));

CREATE POLICY "Profiles Service Manage" ON "public"."profiles"
  FOR ALL
  TO PUBLIC
  USING ((((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR (public.get_auth_role() = 'admin'::text)))
  WITH CHECK ((((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR (public.get_auth_role() = 'admin'::text)));

CREATE POLICY "Profiles Update Self" ON "public"."profiles"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.uid() = id) OR (public.get_auth_role() = 'admin'::text)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";
