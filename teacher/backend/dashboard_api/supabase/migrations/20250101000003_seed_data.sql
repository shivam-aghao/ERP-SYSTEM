-- ====================================================================
-- SSGMCE Teacher Dashboard ERP - Initial Seed Data Migration
-- Migration: 20250101000003_seed_data.sql
-- ====================================================================

-- 1. Departments
INSERT INTO departments (code, name, icon, description, head_of_dept, classes_count) VALUES
('CSE', 'Computer Science & Engineering', 'laptop', 'Department of Computer Science & Engineering', 'Dr. S. B. Somani', 6),
('IT', 'Information Technology', 'server', 'Department of Information Technology', 'Dr. P. R. Dhabe', 4),
('EE', 'Electrical Engineering', 'zap', 'Department of Electrical Engineering', 'Dr. M. A. Beg', 4),
('MECH', 'Mechanical Engineering', 'tool', 'Department of Mechanical Engineering', 'Dr. S. S. Deshmukh', 4),
('ENTC', 'Electronics & Telecommunication', 'radio', 'Department of Electronics & Telecommunication', 'Dr. D. D. Shah', 4),
('ASH', 'Applied Science & Humanities', 'book', 'Department of Applied Science & Humanities', 'Dr. N. H. Khandare', 2)
ON CONFLICT (code) DO NOTHING;

-- 2. Faculty
INSERT INTO faculty (
  id, employee_id, name, prefix, title, department_code, email, phone,
  avatar_initials, cabin_location, office_hours, qualification, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'FAC-CSE-1048',
  'Dr. Rohan Deshmukh',
  'Prof.',
  'Associate Professor',
  'CSE',
  'rohan.deshmukh@ssgmce.ac.in',
  '+91 98765 43210',
  'RD',
  'Academic Block B, Room 204',
  'Mon-Thu: 3:00 PM - 5:00 PM',
  'Ph.D. in Computer Science & Engineering',
  true
) ON CONFLICT (employee_id) DO NOTHING;

-- 3. Classes
INSERT INTO classes (code, department_code, name, semester, students_count, room, academic_year) VALUES
('2R1', 'CSE', 'Second Year CSE - Div A', 'Semester 3', 65, 'Room 201', '2024-2025'),
('2R2', 'CSE', 'Second Year CSE - Div B', 'Semester 3', 63, 'Room 202', '2024-2025'),
('3R', 'CSE', 'Third Year CSE', 'Semester 5', 68, 'Room 301', '2024-2025'),
('4R', 'CSE', 'Final Year CSE', 'Semester 7', 62, 'Room 401', '2024-2025')
ON CONFLICT (code) DO NOTHING;

-- 4. Subjects
INSERT INTO subjects (code, name, class_code, faculty_id, credits, icon, lecture_time, semester) VALUES
('CS302', 'Data Structures & Algorithms', '2R1', 'a0000000-0000-0000-0000-000000000001', '4 Credits', 'binary', '10:00 AM - 11:00 AM', 'Semester 3'),
('CS501', 'Database Management Systems', '3R', 'a0000000-0000-0000-0000-000000000001', '4 Credits', 'database', '11:15 AM - 12:15 PM', 'Semester 5'),
('CS702', 'Information & Cyber Security', '4R', 'a0000000-0000-0000-0000-000000000001', '3 Credits', 'shield', '02:00 PM - 03:00 PM', 'Semester 7')
ON CONFLICT (code) DO NOTHING;

