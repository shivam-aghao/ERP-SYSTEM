CREATE TABLE "public"."academic_terms" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "academic_year" text                     NOT NULL,
  "semester_type" text                     NOT NULL,
  "start_date"    date                     NOT NULL,
  "end_date"      date                     NOT NULL,
  "is_current"    boolean                  DEFAULT false,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "academic_terms_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."academic_terms"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."academic_terms" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."academic_terms" TO "service_role";

REVOKE ALL ON TABLE "public"."academic_terms" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."academic_terms" TO "postgres";
