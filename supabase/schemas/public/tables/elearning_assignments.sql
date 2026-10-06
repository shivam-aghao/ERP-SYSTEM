CREATE TABLE "public"."elearning_assignments" (
  "id"                character varying(36)  NOT NULL,
  "subject_code"      character varying(20),
  "subject_name"      character varying(150),
  "title"             character varying(200),
  "due_date"          character varying(30),
  "total_marks"       integer,
  "submission_status" character varying(20),
  "grade"             character varying(10),
  "file_url"          text,
  CONSTRAINT "elearning_assignments_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_assignments" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_assignments" TO "service_role";

REVOKE ALL ON TABLE "public"."elearning_assignments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_assignments" TO "postgres";
