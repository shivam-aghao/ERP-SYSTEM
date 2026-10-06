CREATE TABLE "public"."student_import_errors" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "batch_id"      uuid                     NOT NULL,
  "row_reference" character varying,
  "raw_value"     text,
  "error_type"    character varying        NOT NULL,
  "error_message" text                     NOT NULL,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "student_import_errors_batch_id_fkey" FOREIGN KEY (batch_id) REFERENCES public.student_import_batches(id) ON DELETE CASCADE,
  CONSTRAINT "student_import_errors_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."student_import_errors"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX student_import_errors_batch_idx ON public.student_import_errors USING btree (batch_id);

CREATE POLICY "Teachers read student import errors" ON "public"."student_import_errors"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.student_import_batches b
  WHERE ((b.id = student_import_errors.batch_id) AND (EXISTS ( SELECT 1
           FROM public.teachers t
          WHERE (t.id = ( SELECT auth.uid() AS uid))))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_import_errors" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_import_errors" TO "service_role";

REVOKE ALL ON TABLE "public"."student_import_errors" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_import_errors" TO "postgres";
