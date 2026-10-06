CREATE TABLE "public"."student_documents" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "student_code"      text                     NOT NULL,
  "document_type"     text                     NOT NULL,
  "title"             text                     NOT NULL,
  "status"            text                     NOT NULL DEFAULT 'Verified'::text,
  "issue_date"        date                     NOT NULL DEFAULT CURRENT_DATE,
  "expiry_date"       date,
  "issuing_authority" text                     NOT NULL DEFAULT 'Dean (Academics), SSGMCE'::text,
  "document_metadata" jsonb                    DEFAULT '{}'::jsonb,
  "download_url"      text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "student_documents_document_type_check" CHECK ((document_type = ANY (ARRAY['id-card'::text, 'grade-cards'::text, 'bonafide'::text, 'library-clearance'::text]))),
  CONSTRAINT "student_documents_pkey" PRIMARY KEY (id),
  CONSTRAINT "student_documents_status_check" CHECK ((status = ANY (ARRAY['Verified'::text, 'Pending'::text, 'Expired'::text])))
);

ALTER TABLE "public"."student_documents"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read student documents" ON "public"."student_documents"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_documents" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_documents" TO "service_role";

REVOKE ALL ON TABLE "public"."student_documents" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_documents" TO "postgres";
