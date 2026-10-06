CREATE TABLE "public"."change_info_requests" (
  "id"              character varying(36)    NOT NULL,
  "student_code"    character varying(20),
  "field_name"      character varying(50),
  "current_value"   character varying(255),
  "requested_value" character varying(255),
  "reason"          text,
  "status"          character varying(20),
  "submitted_at"    timestamp with time zone,
  CONSTRAINT "change_info_requests_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."change_info_requests" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."change_info_requests" TO "service_role";

REVOKE ALL ON TABLE "public"."change_info_requests" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."change_info_requests" TO "postgres";
