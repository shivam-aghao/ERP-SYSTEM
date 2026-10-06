CREATE TABLE "public"."fee_records" (
  "id"              character varying(36) NOT NULL,
  "student_code"    character varying(20),
  "academic_year"   character varying(20),
  "semester"        integer,
  "tuition_fee"     double precision,
  "development_fee" double precision,
  "exam_fee"        double precision,
  "gymkhana_fee"    double precision,
  "total_fee"       double precision,
  "paid_amount"     double precision,
  "due_amount"      double precision,
  "status"          character varying(20),
  CONSTRAINT "fee_records_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."fee_records" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."fee_records" TO "service_role";

REVOKE ALL ON TABLE "public"."fee_records" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."fee_records" TO "postgres";
