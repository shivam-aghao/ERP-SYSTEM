CREATE TABLE "public"."exam_revaluations" (
  "id"               character varying(36)    NOT NULL,
  "student_code"     character varying(20),
  "subject_code"     character varying(20),
  "subject_name"     character varying(150),
  "exam_session"     character varying(50),
  "current_marks"    double precision,
  "application_type" character varying(50),
  "fee_paid"         double precision,
  "status"           character varying(20),
  "applied_at"       timestamp with time zone,
  CONSTRAINT "exam_revaluations_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exam_revaluations" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exam_revaluations" TO "service_role";

REVOKE ALL ON TABLE "public"."exam_revaluations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exam_revaluations" TO "postgres";
