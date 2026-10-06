CREATE TABLE "public"."elearning_quizzes" (
  "id"             character varying(36)  NOT NULL,
  "subject_code"   character varying(20),
  "title"          character varying(200),
  "duration_mins"  integer,
  "total_marks"    integer,
  "obtained_marks" integer,
  "status"         character varying(20),
  CONSTRAINT "elearning_quizzes_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_quizzes" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_quizzes" TO "service_role";

REVOKE ALL ON TABLE "public"."elearning_quizzes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_quizzes" TO "postgres";
