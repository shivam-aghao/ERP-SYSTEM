CREATE TABLE "public"."student_import_batches" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "file_name"          character varying        NOT NULL,
  "class_id"           uuid,
  "total_records"      integer                  NOT NULL DEFAULT 0,
  "successful_records" integer                  NOT NULL DEFAULT 0,
  "duplicate_records"  integer                  NOT NULL DEFAULT 0,
  "failed_records"     integer                  NOT NULL DEFAULT 0,
  "imported_at"        timestamp with time zone DEFAULT now(),
  "status"             character varying        NOT NULL,
  CONSTRAINT "student_import_batches_pkey" PRIMARY KEY (id),
  CONSTRAINT "student_import_batches_status_check"
    CHECK
    (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'COMPLETED'::character varying, 'PARTIAL'::character varying, 'FAILED'::character
    varying])::text[])))
);

ALTER TABLE "public"."student_import_batches"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage student import batches" ON "public"."student_import_batches"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.teachers t
  WHERE (t.id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.teachers t
  WHERE (t.id = ( SELECT auth.uid() AS uid)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_import_batches" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_import_batches" TO "service_role";

REVOKE ALL ON TABLE "public"."student_import_batches" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_import_batches" TO "postgres";
