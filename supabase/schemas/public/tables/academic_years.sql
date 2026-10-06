CREATE TABLE "public"."academic_years" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "year_code"  character varying(20)    NOT NULL,
  "is_current" boolean                  NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "academic_years_pkey" PRIMARY KEY (id),
  CONSTRAINT "academic_years_year_code_key" UNIQUE (year_code)
);

ALTER TABLE "public"."academic_years"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_academic_years_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_academic_years_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Allow read academic_years" ON "public"."academic_years"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."academic_years" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."academic_years" TO "service_role";

REVOKE ALL ON TABLE "public"."academic_years" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."academic_years" TO "postgres";
