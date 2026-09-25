-- ==============================================================================
-- SSGMCE SHEGAON - TEACHER ATTENDANCE ERP SYSTEM
-- Migration: 0002_seed.sql
-- Seed Data: Departments, Classes, Subjects, and 69 Students from 1R Roll List
-- ==============================================================================

-- 1. DEPARTMENTS (CSE, ETC, MECH)
INSERT INTO public.departments (code, name) VALUES
  ('CSE', 'Computer Science & Engineering'),
  ('ETC', 'Electronics & Telecommunication Engineering'),
  ('MECH', 'Mechanical Engineering')
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name;

-- 2. CLASSES
-- CSE Classes
INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'FY-CSE-A', '2024-25', 'A' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'SY-CSE-A', '2024-25', 'A' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'TY-CSE-A', '2024-25', 'A' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'BE-CSE-A', '2024-25', 'A' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, name) DO NOTHING;

-- ETC Classes
INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'FY-ETC-A', '2024-25', 'A' FROM public.departments WHERE code = 'ETC'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'SY-ETC-A', '2024-25', 'A' FROM public.departments WHERE code = 'ETC'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'TY-ETC-A', '2024-25', 'A' FROM public.departments WHERE code = 'ETC'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'BE-ETC-A', '2024-25', 'A' FROM public.departments WHERE code = 'ETC'
ON CONFLICT (department_id, name) DO NOTHING;

-- MECH Classes
INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'FY-MECH-A', '2024-25', 'A' FROM public.departments WHERE code = 'MECH'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'SY-MECH-A', '2024-25', 'A' FROM public.departments WHERE code = 'MECH'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'TY-MECH-A', '2024-25', 'A' FROM public.departments WHERE code = 'MECH'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO public.classes (department_id, name, academic_year, division)
SELECT id, 'BE-MECH-A', '2024-25', 'A' FROM public.departments WHERE code = 'MECH'
ON CONFLICT (department_id, name) DO NOTHING;

-- 3. SUBJECTS
-- CSE Subjects
INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, '3CS205MD', 'Database Management', 'THEORY' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'CS302', 'Data Structures', 'THEORY' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'CS303', 'Java Programming', 'THEORY' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'CS304', 'Operating Systems', 'THEORY' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'CS306', 'Computer Networks', 'THEORY' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'CS307', 'Web Development', 'LAB' FROM public.departments WHERE code = 'CSE'
ON CONFLICT (department_id, code) DO NOTHING;

-- ETC Subjects
INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'ET301', 'Digital Signal Processing', 'THEORY' FROM public.departments WHERE code = 'ETC'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'ET302', 'Microcontrollers & Embedded', 'THEORY' FROM public.departments WHERE code = 'ETC'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'ET303', 'VLSI Design', 'LAB' FROM public.departments WHERE code = 'ETC'
ON CONFLICT (department_id, code) DO NOTHING;

-- MECH Subjects
INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'ME301', 'Thermodynamics', 'THEORY' FROM public.departments WHERE code = 'MECH'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'ME302', 'Fluid Mechanics', 'THEORY' FROM public.departments WHERE code = 'MECH'
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.subjects (department_id, code, name, type)
SELECT id, 'ME303', 'Machine Design', 'THEORY' FROM public.departments WHERE code = 'MECH'
ON CONFLICT (department_id, code) DO NOTHING;

-- 4. STUDENTS FOR SY-CSE-A (69 Students from 1R_Student_Roll_List.pdf)
-- Provisional students: Roll 45 ('Mayuresh Subhash Guhe') and Roll 58 ('Satya Sandeep Patil')
INSERT INTO public.students (class_id, roll_no, student_code, full_name, is_provisional)
VALUES
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 1, '308979', 'Ku. Aarti Ganesh Kawle', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 2, '308652', 'Ku. Anuja Bhagwan Garmode', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 3, '308668', 'Ku. Anushri Sachin Chavan', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 4, '308596', 'Ku. Apurva Prashant Jagtap', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 5, '308615', 'Ku. Arpita Satish Mourya', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 6, '308667', 'Ku. Dhanashri Santosh Jain', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 7, '308877', 'Ku. Divya Naresh Joshi', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 8, '309089', 'Ku. Dolly Girishkumarji Bhutada', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 9, '308653', 'Ku. Gargi Manoj Mane', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 10, '308834', 'Ku. Gouri Pramodrao Deshmukh', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 11, '308746', 'Ku. Jiya Jitendra Kamble', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 12, '308835', 'Ku. Krushna Suresh Falke', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 13, '308843', 'Ku. Pallavi Ganesh Tade', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 14, '309044', 'Ku. Ritika Manojkumar Chaudhari', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 15, '308648', 'Ku. Sakshi Jitendra Wagh', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 16, '308699', 'Ku. Saloni Anil Ghodkhande', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 17, '309012', 'Ku. Samiksha Bhujangrao Deshmukh', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 18, '308636', 'Ku. Sanchita Ranjit Gawande', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 19, '308677', 'Ku. Sayyad Ummehani Asharaf ali', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 20, '308958', 'Ku. Shrishti Rajendra Ingale', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 21, '308803', 'Ku. Shrushti Ketan Raninga', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 22, '308611', 'Ku. Shruti Prakash Bhute', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 23, '308620', 'Ku. Snehal Uday Rangankar', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 24, '308597', 'Ku. Suhana Harishankar Tiwari', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 25, '308626', 'Ku. Tanushri Shirish Kharche', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 26, '309017', 'Ku. Tanvi Amol Bichare', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 27, '308684', 'Ku. Vaishnavi Ramesh Tale', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 28, '308666', 'Abhishek Ajabrao Nirmal', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 29, '308646', 'Aditya Sanjay Nagre', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 30, '308887', 'Anurag Dhananjay Nagzirkar', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 31, '308628', 'Armaan Ramprakash Gupta', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 32, '308785', 'Aryan Anil Bobade', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 33, '308954', 'Atharv Pradip Sonone', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 34, '308641', 'Atharva Umesh Deshmukh', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 35, '308845', 'Devesh Girish Talatule', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 36, '308621', 'Divyansh Vijay Mate', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 37, '308712', 'Dnyaneshwar Raju Bajad', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 38, '309067', 'Dnyaneshwar Sunil Deshmukh', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 39, '308594', 'Ganesh Dilip Bari', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 40, '308660', 'Jagdish Shaligram Bodade', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 41, '308933', 'Kartik Bhaskar Hande', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 42, '308748', 'Krushana Vitthal Kharsade', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 43, '308661', 'Mandar Mukesh Dhamodhar', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 44, '308963', 'Manthan Gajanan Morey', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 45, '308629', 'Mayuresh Subhash Guhe', true),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 46, '308643', 'Nandan Dilip Kulat', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 47, '308768', 'Nikhil Rameshwar Zode', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 48, '308874', 'Parth Kiran Jadhav', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 49, '308736', 'Pavan Sheshrao Gaikwad', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 50, '308962', 'Prajwal Baban Ghawat', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 51, '308602', 'Prajwal Himmatrao Virokar', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 52, '308657', 'Pranav Bhagwat Gadhave', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 53, '308649', 'Pranav Rajesh Dhurde', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 54, '308655', 'Rahul Bhashkar Pagrut', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 55, '309090', 'Rajveer singh Paramjit singh Popli', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 56, '308794', 'Rushikesh Satish Bhawarkar', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 57, '308840', 'Sanskar Vijay Dahatre', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 58, '308769', 'Satya Sandeep Patil', true),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 59, '308671', 'Saurav Ananta Dhage', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 60, '308637', 'Shivam Sanjay Aghao', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 61, '308593', 'Shubh Prashant Chandore', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 62, '308960', 'Soham Madhukar Patil', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 63, '308862', 'Sujal Milind Agame', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 64, '308944', 'Sujal Sailendra Patiye', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 65, '308981', 'Sumit Subodh Hinge', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 66, '308619', 'Swraj Anil Harne', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 67, '308870', 'Tushar Gajendra Chatare', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 68, '308676', 'Tushar Shankar Patole', false),
  ((SELECT id FROM public.classes WHERE name = 'SY-CSE-A' LIMIT 1), 69, '308645', 'Vedant Suryakant Tayade', false);
