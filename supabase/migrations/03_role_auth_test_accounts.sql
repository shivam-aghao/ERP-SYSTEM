-- ==============================================================================
-- SSGMCE SHEGAON - COLLEGE ERP SYSTEM
-- Migration: 03_role_auth_test_accounts.sql
-- Role-Based Authentication Seed Script:
--   - 10 Student Test Accounts (STU001 to STU010)
--   - 5 Faculty Test Accounts (EMP001 to EMP005)
--   - 1 Preserved Student Account (308979)
-- Master Password for all test accounts: Test@12345
-- Safe & Idempotent: Can be executed multiple times without duplicates or errors.
-- ==============================================================================

-- 1. Ensure cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  v_encrypted_pw TEXT := crypt('Test@12345', gen_salt('bf', 10));
  
  -- Record structure for seed entries
  rec RECORD;
BEGIN

  -- Create temporary table with seed users
  CREATE TEMP TABLE temp_seed_accounts (
    u_id UUID,
    user_id TEXT,
    email TEXT,
    full_name TEXT,
    role TEXT,
    course TEXT,
    branch TEXT,
    section TEXT,
    academic_year TEXT,
    semester TEXT,
    designation TEXT
  ) ON COMMIT DROP;

  INSERT INTO temp_seed_accounts VALUES
    -- Preserved Existing Student (308979)
    ('8ce804b5-c1a5-4b0b-92a1-8a842e616118', '308979', '308979@ssgmce.local', 'Ku. Aarti Ganesh Kawle', 'student', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V', NULL),

    -- 10 Student Test Accounts (STU001 - STU010)
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000001', 'STU001', 'stu001@ssgmce.local', 'Aarav Sharma', 'student', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000002', 'STU002', 'stu002@ssgmce.local', 'Ananya Patil', 'student', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000003', 'STU003', 'stu003@ssgmce.local', 'Rohan Deshmukh', 'student', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000004', 'STU004', 'stu004@ssgmce.local', 'Sneha Joshi', 'student', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000005', 'STU005', 'stu005@ssgmce.local', 'Aditya Kulkarni', 'student', 'B.E.', 'Computer Science & Engineering', 'B', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000006', 'STU006', 'stu006@ssgmce.local', 'Priya Wankhade', 'student', 'B.E.', 'Computer Science & Engineering', 'B', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000007', 'STU007', 'stu007@ssgmce.local', 'Tanmay Gaikwad', 'student', 'B.E.', 'Electronics & Telecommunication', 'A', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000008', 'STU008', 'stu008@ssgmce.local', 'Neha Badokar', 'student', 'B.E.', 'Electronics & Telecommunication', 'A', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000009', 'STU009', 'stu009@ssgmce.local', 'Yash Choudhary', 'student', 'B.E.', 'Mechanical Engineering', 'A', '2024-25', 'Semester V', NULL),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e000010', 'STU010', 'stu010@ssgmce.local', 'Sakshi Ingale', 'student', 'B.E.', 'Mechanical Engineering', 'A', '2024-25', 'Semester V', NULL),

    -- 5 Faculty Test Accounts (EMP001 - EMP005)
    ('8ce804b5-c1a5-4b0b-92a1-8a842e100001', 'EMP001', 'emp001@ssgmce.local', 'Dr. Rajesh Sharma', 'faculty', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V', 'Professor & HOD'),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e100002', 'EMP002', 'emp002@ssgmce.local', 'Prof. Sunita Deshpande', 'faculty', 'B.E.', 'Computer Science & Engineering', 'A', '2024-25', 'Semester V', 'Associate Professor'),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e100003', 'EMP003', 'emp003@ssgmce.local', 'Dr. Manoj Patil', 'faculty', 'B.E.', 'Electronics & Telecommunication', 'A', '2024-25', 'Semester V', 'Professor'),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e100004', 'EMP004', 'emp004@ssgmce.local', 'Prof. Kavita Wankhede', 'faculty', 'B.E.', 'Electronics & Telecommunication', 'A', '2024-25', 'Semester V', 'Assistant Professor'),
    ('8ce804b5-c1a5-4b0b-92a1-8a842e100005', 'EMP005', 'emp005@ssgmce.local', 'Dr. Sanjay Kulkarni', 'faculty', 'B.E.', 'Mechanical Engineering', 'A', '2024-25', 'Semester V', 'Professor & Dean');

  -- Loop through each seed account and upsert into auth.users and public.profiles
  FOR rec IN SELECT * FROM temp_seed_accounts LOOP

    -- A. Insert or update Supabase Auth user (auth.users)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = rec.email) THEN
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
        rec.u_id,
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
      -- Update password and metadata if user exists
      UPDATE auth.users
      SET encrypted_password = v_encrypted_pw,
          raw_user_meta_data = jsonb_build_object('full_name', rec.full_name, 'user_id', rec.user_id, 'role', rec.role),
          updated_at = NOW()
      WHERE email = rec.email;
    END IF;

    -- Retrieve the exact user id from auth.users (handles pre-existing user IDs)
    SELECT id INTO rec.u_id FROM auth.users WHERE email = rec.email;

    -- B. Upsert into public.profiles
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
      rec.u_id,
      rec.user_id,
      rec.full_name,
      rec.email,
      rec.role,
      'active',
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
      status = 'active',
      course = EXCLUDED.course,
      branch = EXCLUDED.branch,
      section = EXCLUDED.section,
      academic_year = EXCLUDED.academic_year,
      semester = EXCLUDED.semester,
      updated_at = NOW();

  END LOOP;

  RAISE NOTICE 'SSGMCE ERP: Successfully seeded 10 student accounts and 5 faculty accounts with password Test@12345';
END $$;
