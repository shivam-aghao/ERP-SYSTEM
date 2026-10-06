CREATE TABLE "public"."exam_marks" (
  "id"             character varying(36)  NOT NULL,
  "student_code"   character varying(20),
  "semester"       integer,
  "subject_code"   character varying(20),
  "subject_name"   character varying(150),
  "cie1_score"     double precision,
  "cie2_score"     double precision,
  "ta_score"       double precision,
  "total_internal" double precision,
  "grade"          character varying(10),
  "grade_points"   double precision,
  CONSTRAINT "exam_marks_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exam_marks" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exam_marks" TO "service_role";

REVOKE ALL ON TABLE "public"."exam_marks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exam_marks" TO "postgres";
