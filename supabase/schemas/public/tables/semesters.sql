CREATE TABLE "public"."semesters" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "branch_id"        uuid,
  "semester_number"  integer                  NOT NULL,
  "academic_year_id" uuid,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "semesters_academic_year_id_fkey" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  CONSTRAINT "semesters_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT,
  CONSTRAINT "semesters_branch_id_semester_number_academic_year_id_key" UNIQUE (branch_id, semester_number, academic_year_id),
  CONSTRAINT "semesters_pkey" PRIMARY KEY (id),
  CONSTRAINT "semesters_semester_number_check" CHECK (((semester_number >= 1) AND (semester_number <= 8)))
);

ALTER TABLE "public"."semesters"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_semesters_updated_at
  BEFORE UPDATE ON public.semesters
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_semesters_updated_at
  BEFORE UPDATE ON public.semesters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Allow read semesters" ON "public"."semesters"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."semesters" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."semesters" TO "service_role";

REVOKE ALL ON TABLE "public"."semesters" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."semesters" TO "postgres";
