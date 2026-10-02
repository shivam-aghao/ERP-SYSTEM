-- ====================================================================
-- SSGMCE Teacher Dashboard ERP - Canonical Seed Dataset
-- File: supabase/seed.sql
-- ====================================================================

-- 1. Seed Departments
INSERT INTO departments (code, name, icon, description, head_of_dept, classes_count) VALUES
('CSE', 'Computer Science & Engineering', 'laptop', 'Department of Computer Science & Engineering', 'Dr. S. B. Somani', 6),
('IT', 'Information Technology', 'server', 'Department of Information Technology', 'Dr. P. R. Dhabe', 4),
('EE', 'Electrical Engineering', 'zap', 'Department of Electrical Engineering', 'Dr. M. A. Beg', 4),
('MECH', 'Mechanical Engineering', 'tool', 'Department of Mechanical Engineering', 'Dr. S. S. Deshmukh', 4),
('ENTC', 'Electronics & Telecommunication', 'radio', 'Department of Electronics & Telecommunication', 'Dr. D. D. Shah', 4),
('ASH', 'Applied Science & Humanities', 'book', 'Department of Applied Science & Humanities', 'Dr. N. H. Khandare', 2)
ON CONFLICT (code) DO NOTHING;

-- 2. Seed Faculty (Dr. Rohan Deshmukh)
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

-- 3. Seed Classes
INSERT INTO classes (code, department_code, name, semester, students_count, room, academic_year) VALUES
('2R1', 'CSE', 'Second Year CSE - Div A', 'Semester 3', 65, 'Room 201', '2024-2025'),
('2R2', 'CSE', 'Second Year CSE - Div B', 'Semester 3', 63, 'Room 202', '2024-2025'),
('3R', 'CSE', 'Third Year CSE', 'Semester 5', 68, 'Room 301', '2024-2025'),
('4R', 'CSE', 'Final Year CSE', 'Semester 7', 62, 'Room 401', '2024-2025')
ON CONFLICT (code) DO NOTHING;

-- 4. Seed Subjects
INSERT INTO subjects (code, name, class_code, faculty_id, credits, icon, lecture_time, semester) VALUES
('CS302', 'Data Structures & Algorithms', '2R1', 'a0000000-0000-0000-0000-000000000001', '4 Credits', 'binary', '10:00 AM - 11:00 AM', 'Semester 3'),
('CS501', 'Database Management Systems', '3R', 'a0000000-0000-0000-0000-000000000001', '4 Credits', 'database', '11:15 AM - 12:15 PM', 'Semester 5'),
('CS702', 'Information & Cyber Security', '4R', 'a0000000-0000-0000-0000-000000000001', '3 Credits', 'shield', '02:00 PM - 03:00 PM', 'Semester 7')
ON CONFLICT (code) DO NOTHING;

-- 5. Seed Students (Class 2R1)
INSERT INTO students (id, roll_no, roll_formatted, enrollment_no, name, email, class_code, department_code, phone) VALUES
('b0000000-0000-0000-0000-000000000001', 1, '2R1-01', 'EN22104001', 'Aarav Sharma', 'aarav.sharma@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56789'),
('b0000000-0000-0000-0000-000000000002', 2, '2R1-02', 'EN22104002', 'Ananya Patel', 'ananya.patel@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56790'),
('b0000000-0000-0000-0000-000000000003', 3, '2R1-03', 'EN22104003', 'Rohan Kulkarni', 'rohan.kulkarni@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56791'),
('b0000000-0000-0000-0000-000000000004', 4, '2R1-04', 'EN22104004', 'Priya Verma', 'priya.verma@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56792'),
('b0000000-0000-0000-0000-000000000005', 5, '2R1-05', 'EN22104005', 'Siddharth Joshi', 'siddharth.joshi@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56793'),
('b0000000-0000-0000-0000-000000000006', 6, '2R1-06', 'EN22104006', 'Isha Deshpande', 'isha.deshpande@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56794'),
('b0000000-0000-0000-0000-000000000007', 7, '2R1-07', 'EN22104007', 'Aditya Kale', 'aditya.kale@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56795'),
('b0000000-0000-0000-0000-000000000008', 8, '2R1-08', 'EN22104008', 'Tanvi Mahajan', 'tanvi.mahajan@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56796'),
('b0000000-0000-0000-0000-000000000009', 9, '2R1-09', 'EN22104009', 'Omkar Patil', 'omkar.patil@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56797'),
('b0000000-0000-0000-0000-000000000010', 10, '2R1-10', 'EN22104010', 'Neha Raut', 'neha.raut@ssgmce.ac.in', '2R1', 'CSE', '+91 91234 56798')
ON CONFLICT (enrollment_no) DO NOTHING;

-- 6. Seed Timetable Slots
INSERT INTO timetable (faculty_id, day_of_week, slot_index, subject_code, class_code, room, is_lab, academic_year) VALUES
('a0000000-0000-0000-0000-000000000001', 1, 1, 'CS302', '2R1', 'Room 201', false, '2024-2025'),
('a0000000-0000-0000-0000-000000000001', 1, 2, 'CS501', '3R', 'Room 301', false, '2024-2025'),
('a0000000-0000-0000-0000-000000000001', 2, 1, 'CS702', '4R', 'Room 401', false, '2024-2025'),
('a0000000-0000-0000-0000-000000000001', 3, 2, 'CS302', '2R1', 'Room 201', false, '2024-2025'),
('a0000000-0000-0000-0000-000000000001', 4, 1, 'CS501', '3R', 'Room 301', false, '2024-2025'),
('a0000000-0000-0000-0000-000000000001', 5, 3, 'CS702', '4R', 'Room 401', false, '2024-2025')
ON CONFLICT (faculty_id, day_of_week, slot_index, academic_year) DO NOTHING;

-- 7. Seed Syllabus Progress for CS302
INSERT INTO syllabus_progress (subject_code, class_code, faculty_id, unit_number, unit_name, completion_percent) VALUES
('CS302', '2R1', 'a0000000-0000-0000-0000-000000000001', 1, 'Introduction to Data Structures & Arrays', 100),
('CS302', '2R1', 'a0000000-0000-0000-0000-000000000001', 2, 'Stacks, Queues and Recursion', 90),
('CS302', '2R1', 'a0000000-0000-0000-0000-000000000001', 3, 'Linked Lists (Singly, Doubly, Circular)', 75),
('CS302', '2R1', 'a0000000-0000-0000-0000-000000000001', 4, 'Trees, Binary Search Trees & AVL Trees', 40),
('CS302', '2R1', 'a0000000-0000-0000-0000-000000000001', 5, 'Graphs, BFS, DFS & Shortest Path', 10),
('CS302', '2R1', 'a0000000-0000-0000-0000-000000000001', 6, 'Hashing, Sorting & Searching Techniques', 0)
ON CONFLICT (subject_code, class_code, unit_number) DO UPDATE
SET completion_percent = EXCLUDED.completion_percent;

-- 8. Seed Notifications
INSERT INTO notifications (recipient_faculty_id, title, description, icon, type, is_read, action_url) VALUES
('a0000000-0000-0000-0000-000000000001', 'Low Attendance Alert', 'Student Roll No 2R1-05 (Siddharth Joshi) has attendance below 75% in CS302.', 'alert-triangle', 'warning', false, '/attendance'),
('a0000000-0000-0000-0000-000000000001', 'Mid-Sem Marks Submission', 'Deadline for submitting Mid-Semester Examination marks is October 25, 2024.', 'calendar', 'info', false, '/results'),
('a0000000-0000-0000-0000-000000000001', 'Department Meeting', 'HOD has scheduled an academic progress review meeting on Friday at 4:00 PM.', 'users', 'info', true, '/schedule');
