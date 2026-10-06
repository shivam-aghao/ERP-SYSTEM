CREATE TABLE "public"."branches" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "department_id" uuid,
  "course_id"     uuid,
  "code"          character varying(50)    NOT NULL,
  "name"          character varying(150)   NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "branches_code_key" UNIQUE (code),
  CONSTRAINT "branches_pkey" PRIMARY KEY (id),
  CONSTRAINT "branches_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."branches"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Allow read branches" ON "public"."branches"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."branches" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."branches" TO "service_role";

REVOKE ALL ON TABLE "public"."branches" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."branches" TO "postgres";
