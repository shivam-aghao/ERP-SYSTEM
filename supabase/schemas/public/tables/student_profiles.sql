CREATE TABLE "public"."student_profiles" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "roll_no"           integer,
  "student_code"      text                     NOT NULL,
  "prn"               text                     NOT NULL,
  "full_name"         text                     NOT NULL,
  "email"             text                     NOT NULL,
  "department"        text                     NOT NULL DEFAULT 'Computer Science & Engineering'::text,
  "department_code"   text                     NOT NULL DEFAULT 'CSE'::text,
  "class_name"        text,
  "division"          text,
  "semester"          integer                  DEFAULT 1,
  "academic_year"     text,
  "phone"             text,
  "date_of_birth"     date,
  "gender"            text,
  "blood_group"       text,
  "nationality"       text                     DEFAULT 'Indian'::text,
  "category"          text,
  "caste"             text,
  "emergency_contact" text,
  "permanent_address" text,
  "district"          text,
  "state"             text                     DEFAULT 'Maharashtra'::text,
  "pincode"           text,
  "father_name"       text,
  "mother_name"       text,
  "faculty_mentor"    text,
  "admission_quota"   text,
  "hostel_status"     text,
  "cgpa"              numeric(4,2)             DEFAULT 0.0,
  "sgpa"              numeric(4,2)             DEFAULT 0.0,
  "attendance_rate"   numeric(5,2)             DEFAULT 0.0,
  "earned_credits"    integer                  DEFAULT 0,
  "total_credits"     integer                  DEFAULT 160,
  "academic_standing" text                     DEFAULT 'Active Student (Autonomous)'::text,
  "avatar_url"        text                     DEFAULT 'images/logo.png'::text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "student_profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "student_profiles_prn_key" UNIQUE (prn),
  CONSTRAINT "student_profiles_student_code_key" UNIQUE (student_code)
);

ALTER TABLE "public"."student_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read student profiles" ON "public"."student_profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public update own profile" ON "public"."student_profiles"
  FOR UPDATE
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_profiles" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."student_profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_profiles" TO "postgres";
