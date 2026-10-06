CREATE TABLE "public"."elearning_content" (
  "id"           character varying(36)  NOT NULL,
  "subject_code" character varying(20),
  "subject_name" character varying(150),
  "title"        character varying(200),
  "content_type" character varying(20),
  "file_url"     text,
  "uploaded_at"  character varying(30),
  CONSTRAINT "elearning_content_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_content" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_content" TO "service_role";

REVOKE ALL ON TABLE "public"."elearning_content" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."elearning_content" TO "postgres";
