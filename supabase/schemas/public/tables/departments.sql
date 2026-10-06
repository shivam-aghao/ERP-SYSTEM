CREATE TABLE "public"."departments" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "code"       character varying(20)    NOT NULL,
  "name"       character varying(200)   NOT NULL,
  "short_name" character varying(50),
  "color"      character varying(20)    DEFAULT '#0B5CAD'::character varying,
  "hod_name"   character varying(150),
  "is_active"  boolean                  DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "departments_code_key" UNIQUE (code),
  CONSTRAINT "departments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."departments"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_departments_code ON public.departments USING btree (code);

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read departments" ON "public"."departments"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."departments" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."departments" TO "service_role";

REVOKE ALL ON TABLE "public"."departments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."departments" TO "postgres";
