CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-initializing to avoid schema mismatch with older table versions
DROP TABLE IF EXISTS "attendance_records" CASCADE;
DROP TABLE IF EXISTS "attendance_sessions" CASCADE;
DROP TABLE IF EXISTS "students" CASCADE;
DROP TABLE IF EXISTS "teacher_class_cards" CASCADE;
DROP TABLE IF EXISTS "class_cards" CASCADE;
DROP TABLE IF EXISTS "subjects" CASCADE;
DROP TABLE IF EXISTS "classes" CASCADE;
DROP TABLE IF EXISTS "teachers" CASCADE;
DROP TABLE IF EXISTS "departments" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;

CREATE TABLE IF NOT EXISTS "departments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "color" TEXT DEFAULT '#0B5CAD',
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "teachers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "auth_user_id" TEXT UNIQUE NOT NULL,
  "employee_code" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "designation" TEXT NOT NULL,
  "department_code" TEXT NOT NULL REFERENCES "departments"("code") ON UPDATE CASCADE ON DELETE RESTRICT,
  "avatar" TEXT,
  "unread_notifications" INTEGER DEFAULT 0 NOT NULL,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "classes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "department_code" TEXT NOT NULL REFERENCES "departments"("code") ON UPDATE CASCADE ON DELETE RESTRICT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "year" TEXT NOT NULL,
  "division" TEXT,
  "student_count" INTEGER DEFAULT 60 NOT NULL,
  "room" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "classes_department_code_code_key" UNIQUE ("department_code", "code")
);

CREATE TABLE IF NOT EXISTS "subjects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "department_code" TEXT NOT NULL REFERENCES "departments"("code") ON UPDATE CASCADE ON DELETE RESTRICT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "type" TEXT DEFAULT 'Theory' NOT NULL,
  "default_time" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "subjects_department_code_code_key" UNIQUE ("department_code", "code")
);

CREATE TABLE IF NOT EXISTS "teacher_class_cards" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacher_id" UUID NOT NULL REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "department_code" TEXT NOT NULL,
  "class_code" TEXT NOT NULL,
  "subject_code" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "teacher_class_cards_teacher_dept_class_sub_key" UNIQUE ("teacher_id", "department_code", "class_code", "subject_code"),
  CONSTRAINT "teacher_class_cards_dept_fkey" FOREIGN KEY ("department_code") REFERENCES "departments"("code") ON UPDATE CASCADE,
  CONSTRAINT "teacher_class_cards_class_fkey" FOREIGN KEY ("department_code", "class_code") REFERENCES "classes"("department_code", "code") ON UPDATE CASCADE,
  CONSTRAINT "teacher_class_cards_subject_fkey" FOREIGN KEY ("department_code", "subject_code") REFERENCES "subjects"("department_code", "code") ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "students" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "department_code" TEXT NOT NULL,
  "class_code" TEXT NOT NULL,
  "roll_number" INTEGER NOT NULL,
  "roll_formatted" TEXT NOT NULL,
  "prn" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "is_provisional" BOOLEAN DEFAULT false NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "students_dept_class_roll_key" UNIQUE ("department_code", "class_code", "roll_number"),
  CONSTRAINT "students_class_fkey" FOREIGN KEY ("department_code", "class_code") REFERENCES "classes"("department_code", "code") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "students_prn_idx" ON "students"("prn");

CREATE TABLE IF NOT EXISTS "attendance_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_code" TEXT UNIQUE NOT NULL,
  "teacher_id" UUID NOT NULL REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "department_code" TEXT NOT NULL,
  "class_code" TEXT NOT NULL,
  "subject_code" TEXT NOT NULL,
  "session_date" DATE NOT NULL,
  "period" INTEGER,
  "time_slot" TEXT,
  "session_type" TEXT DEFAULT 'REGULAR' NOT NULL,
  "topic_taught" TEXT,
  "remark" TEXT,
  "total_students" INTEGER NOT NULL,
  "present_count" INTEGER NOT NULL,
  "absent_count" INTEGER NOT NULL,
  "percentage" NUMERIC(5, 2) NOT NULL,
  "status" TEXT DEFAULT 'DRAFT' NOT NULL,
  "submitted_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "unique_session" UNIQUE ("teacher_id", "department_code", "class_code", "subject_code", "session_date", "period"),
  CONSTRAINT "sessions_dept_fkey" FOREIGN KEY ("department_code") REFERENCES "departments"("code") ON UPDATE CASCADE,
  CONSTRAINT "sessions_class_fkey" FOREIGN KEY ("department_code", "class_code") REFERENCES "classes"("department_code", "code") ON UPDATE CASCADE,
  CONSTRAINT "sessions_subject_fkey" FOREIGN KEY ("department_code", "subject_code") REFERENCES "subjects"("department_code", "code") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "attendance_sessions_teacher_date_idx" ON "attendance_sessions"("teacher_id", "session_date");
CREATE INDEX IF NOT EXISTS "attendance_sessions_dept_class_date_idx" ON "attendance_sessions"("department_code", "class_code", "session_date");
CREATE INDEX IF NOT EXISTS "attendance_sessions_status_idx" ON "attendance_sessions"("status");

CREATE TABLE IF NOT EXISTS "attendance_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "student_id" UUID NOT NULL REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "status" TEXT NOT NULL,
  "previous_history" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "attendance_records_session_student_key" UNIQUE ("session_id", "student_id")
);
CREATE INDEX IF NOT EXISTS "attendance_records_student_idx" ON "attendance_records"("student_id");

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacher_id" UUID NOT NULL REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT DEFAULT 'info' NOT NULL,
  "is_read" BOOLEAN DEFAULT false NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "notifications_teacher_read_idx" ON "notifications"("teacher_id", "is_read");
