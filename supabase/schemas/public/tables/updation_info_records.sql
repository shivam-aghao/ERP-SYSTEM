CREATE TABLE "public"."updation_info_records" (
  "id"           character varying(36)  NOT NULL,
  "student_code" character varying(20),
  "category"     character varying(50),
  "title"        character varying(200),
  "event_date"   character varying(50),
  "organization" character varying(150),
  "description"  text,
  "aicte_points" integer,
  "status"       character varying(20),
  CONSTRAINT "updation_info_records_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."updation_info_records" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."updation_info_records" TO "service_role";

REVOKE ALL ON TABLE "public"."updation_info_records" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."updation_info_records" TO "postgres";
