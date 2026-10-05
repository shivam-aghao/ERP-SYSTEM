-- ==============================================================================
-- SSGMCE SHEGAON - COLLEGE ERP SYSTEM
-- Migration: 04_faculty_accounts.sql
-- Task: Add/Synchronize Faculty/Employee Accounts (EMP001 to EMP005)
-- Database Target: Cloud Supabase
-- Master Password: Test@12345
-- Safe, Non-Destructive, and Idempotent
-- ==============================================================================

-- 1. Ensure required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Safely guard the auth trigger function handle_new_teacher()
-- Prevents relation "public.teachers" does not exist error if public.teachers is absent.
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS TRIGGER AS $$
BEGIN
  IF to_regclass('public.teachers') IS NOT NULL AND (COALESCE(NEW.raw_user_meta_data->>'role', '') IN ('faculty', 'teacher')) THEN
    BEGIN
      INSERT INTO public.teachers (id, full_name, emp_code, designation, department_id)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Faculty Member'),
        COALESCE(NEW.raw_user_meta_data->>'user_id', NEW.raw_user_meta_data->>'emp_code', 'EMP001'),
        COALESCE(NEW.raw_user_meta_data->>'designation', 'Assistant Professor'),
        (SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1)
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Upsert Faculty Accounts into auth.users and public.profiles
DO $$
DECLARE
  v_encrypted_pw TEXT := crypt('Test@12345', gen_salt('bf', 10));
  v_user_uuid UUID;
  rec RECORD;
BEGIN

  -- Temporary table with the 5 Faculty Accounts
  CREATE TEMP TABLE temp_faculty_seed (
    user_id TEXT,
    email TEXT,
    full_name TEXT,
    role TEXT,
    status TEXT,
    course TEXT,
    branch TEXT,
    section TEXT,
    academic_year TEXT,
    semester TEXT
  ) ON COMMIT DROP;

  INSERT INTO temp_faculty_seed VALUES
    ('EMP001', 'EMP001@ssgmce.local', 'Faculty 1', 'faculty', 'active', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V'),
    ('EMP002', 'EMP002@ssgmce.local', 'Faculty 2', 'faculty', 'active', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V'),
    ('EMP003', 'EMP003@ssgmce.local', 'Faculty 3', 'faculty', 'active', 'B.E.', 'Electronics & Telecommunication', 'A', '2024-25', 'Semester V'),
    ('EMP004', 'EMP004@ssgmce.local', 'Faculty 4', 'faculty', 'active', 'B.E.', 'Electronics & Telecommunication', 'A', '2024-25', 'Semester V'),
    ('EMP005', 'EMP005@ssgmce.local', 'Faculty 5', 'faculty', 'active', 'B.E.', 'Mechanical Engineering', 'A', '2024-25', 'Semester V');

  FOR rec IN SELECT * FROM temp_faculty_seed LOOP

    -- A. Locate existing auth user by email (case-insensitive) or create one
    SELECT id INTO v_user_uuid
    FROM auth.users
    WHERE LOWER(email) = LOWER(rec.email);

    IF v_user_uuid IS NULL THEN
      -- Also check if user exists under profile
      SELECT id INTO v_user_uuid
      FROM public.profiles
      WHERE user_id = rec.user_id;
    END IF;

    IF v_user_uuid IS NULL THEN
      v_user_uuid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_uuid,
        'authenticated',
        'authenticated',
        rec.email,
        v_encrypted_pw,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', rec.full_name, 'user_id', rec.user_id, 'role', rec.role),
        NOW(),
        NOW()
      );
    ELSE
      -- Synchronize password and metadata for existing auth user
      UPDATE auth.users
      SET email = rec.email,
          encrypted_password = v_encrypted_pw,
          raw_user_meta_data = jsonb_build_object('full_name', rec.full_name, 'user_id', rec.user_id, 'role', rec.role),
          updated_at = NOW()
      WHERE id = v_user_uuid;
    END IF;

    -- B. Upsert into public.profiles using the exact auth.users UUID
    INSERT INTO public.profiles (
      id,
      user_id,
      full_name,
      email,
      role,
      status,
      course,
      branch,
      section,
      academic_year,
      semester,
      created_at,
      updated_at
    ) VALUES (
      v_user_uuid,
      rec.user_id,
      rec.full_name,
      rec.email,
      rec.role,
      rec.status,
      rec.course,
      rec.branch,
      rec.section,
      rec.academic_year,
      rec.semester,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      course = EXCLUDED.course,
      branch = EXCLUDED.branch,
      section = EXCLUDED.section,
      academic_year = EXCLUDED.academic_year,
      semester = EXCLUDED.semester,
      updated_at = NOW();

  END LOOP;

  RAISE NOTICE 'SSGMCE ERP: Successfully synchronized 5 Faculty accounts (EMP001-EMP005) with role faculty and password Test@12345';
END $$;
