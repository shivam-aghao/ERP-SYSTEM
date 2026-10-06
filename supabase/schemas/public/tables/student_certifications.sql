CREATE TABLE "public"."student_certifications" (
  "id"                uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "student_id"        uuid                     NOT NULL,
  "title"             character varying(300)   NOT NULL,
  "type"              character varying(50)    DEFAULT 'Certification'::character varying,
  "issuing_authority" character varying(250),
  "issue_date"        date,
  "score"             character varying(50),
  "credential_id"     character varying(150),
  "credential_url"    text,
  "is_verified"       boolean                  DEFAULT false,
  "created_at"        timestamp with time zone DEFAULT now(),
  "updated_at"        timestamp with time zone DEFAULT now(),
  CONSTRAINT "student_certifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "student_certifications_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

ALTER TABLE "public"."student_certifications"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_certs_student ON public.student_certifications USING btree (student_id);

CREATE TRIGGER trg_student_certifications_updated_at
  BEFORE UPDATE ON public.student_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Read certs" ON "public"."student_certifications"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_certifications" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_certifications" TO "service_role";

REVOKE ALL ON TABLE "public"."student_certifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_certifications" TO "postgres";
