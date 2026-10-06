CREATE TABLE "public"."student_profiles" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "roll_no"           integer                  NOT NULL DEFAULT 21,
  "student_code"      text                     NOT NULL DEFAULT '308637'::text,
  "prn"               text                     NOT NULL DEFAULT '202401088219'::text,
  "full_name"         text                     NOT NULL DEFAULT 'Shivam Sanjay Aghao'::text,
  "email"             text                     NOT NULL DEFAULT 'shivam.aghao@ssgmce.ac.in'::text,
  "department"        text                     NOT NULL DEFAULT 'Computer Science & Engineering'::text,
  "department_code"   text                     NOT NULL DEFAULT 'CSE'::text,
  "class_name"        text                     NOT NULL DEFAULT 'TY B.E. Computer Science and Engineering-A'::text,
  "division"          text                     NOT NULL DEFAULT 'A'::text,
  "semester"          integer                  NOT NULL DEFAULT 4,
  "academic_year"     text                     NOT NULL DEFAULT '2025-26'::text,
  "phone"             text                     DEFAULT '+91 94221 88219'::text,
  "date_of_birth"     date                     DEFAULT '2004-08-15'::date,
  "gender"            text                     DEFAULT 'Male'::text,
  "blood_group"       text                     DEFAULT 'O+ve'::text,
  "nationality"       text                     DEFAULT 'Indian'::text,
  "category"          text                     DEFAULT 'OBC'::text,
  "caste"             text                     DEFAULT 'Kunbi'::text,
  "emergency_contact" text                     DEFAULT '+91 98230 41092'::text,
  "permanent_address" text                     DEFAULT 'Plot 14, Gajanan Colony, Buldhana Road, Shegaon'::text,
  "district"          text                     DEFAULT 'Buldhana'::text,
  "state"             text                     DEFAULT 'Maharashtra'::text,
  "pincode"           text                     DEFAULT '444203'::text,
  "father_name"       text                     DEFAULT 'Mr. Sanjay Aghao'::text,
  "mother_name"       text                     DEFAULT 'Mrs. Sunita Aghao'::text,
  "faculty_mentor"    text                     DEFAULT 'Dr. Rohan Deshmukh (HOD, CSE)'::text,
  "admission_quota"   text                     DEFAULT 'MHT-CET State Merit (Autonomous CAP)'::text,
  "hostel_status"     text                     DEFAULT 'Day Scholar'::text,
  "cgpa"              numeric(4,2)             DEFAULT 8.64,
  "sgpa"              numeric(4,2)             DEFAULT 8.84,
  "attendance_rate"   numeric(5,2)             DEFAULT 82.00,
  "earned_credits"    integer                  DEFAULT 86,
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
