CREATE TABLE "public"."fee_receipts" (
  "id"             character varying(36)  NOT NULL,
  "student_code"   character varying(20),
  "receipt_no"     character varying(100),
  "transaction_id" character varying(100),
  "payment_date"   character varying(30),
  "amount"         double precision,
  "payment_mode"   character varying(50),
  "bank_name"      character varying(100),
  "status"         character varying(20),
  "download_url"   text,
  CONSTRAINT "fee_receipts_pkey" PRIMARY KEY (id),
  CONSTRAINT "fee_receipts_receipt_no_key" UNIQUE (receipt_no)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."fee_receipts" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."fee_receipts" TO "service_role";

REVOKE ALL ON TABLE "public"."fee_receipts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."fee_receipts" TO "postgres";
