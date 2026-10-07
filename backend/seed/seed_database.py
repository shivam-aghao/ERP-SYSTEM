"""
SSGMCE ERP Database Seed Utility
Verifies and seeds complete institutional data for:
- Student Portal (Shivam Sanjay Aghao - Roll 60 - Class 3R)
- Teacher Portal (Dr. Rohan Deshmukh - FAC-CSE-1048)
- Attendance, Timetable, Syllabus, Examination, Fees, E-Learning
"""
import os
import sys
import uuid
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ERP_ROOT = os.path.dirname(BASE_DIR)
if ERP_ROOT not in sys.path:
    sys.path.insert(0, ERP_ROOT)

from backend.config.database import SessionLocal, engine, Base
import backend.models
from sqlalchemy import text

def seed():
    # 1. Create all ORM tables first
    Base.metadata.create_all(bind=engine)

    with engine.connect() as con:
        # 2. Create auxiliary tables if not present
        con.execute(text("""
            CREATE TABLE IF NOT EXISTS student_attendance_subjects (
                id VARCHAR(36) PRIMARY KEY,
                student_code VARCHAR(20),
                academic_year VARCHAR(20),
                semester VARCHAR(20),
                subject_name VARCHAR(150) NOT NULL,
                subject_code VARCHAR(50) NOT NULL,
                subject_type VARCHAR(20),
                type_name VARCHAR(20),
                present_periods INTEGER,
                total_periods INTEGER,
                faculty_name VARCHAR(100),
                classroom VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS timetable_entries (
                id VARCHAR(36) PRIMARY KEY,
                class_id VARCHAR(36),
                day VARCHAR(20),
                day_of_week VARCHAR(20),
                period_num VARCHAR(20),
                period_number INTEGER,
                period_time VARCHAR(50),
                course_code VARCHAR(20),
                course_name VARCHAR(150),
                subject_name VARCHAR(150),
                venue VARCHAR(100),
                room VARCHAR(50) DEFAULT 'Hall A',
                teacher_name VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Scheduled',
                status_class VARCHAR(50),
                att_label VARCHAR(50),
                is_completed BOOLEAN DEFAULT 0,
                is_active_now BOOLEAN DEFAULT 0,
                is_critical BOOLEAN DEFAULT 0,
                type VARCHAR(30) DEFAULT 'Theory'
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS timetable_assessments (
                id VARCHAR(36) PRIMARY KEY,
                teacher_id VARCHAR(36),
                type VARCHAR(30) NOT NULL,
                subject VARCHAR(150) NOT NULL,
                title VARCHAR(250) NOT NULL,
                date VARCHAR(20) NOT NULL,
                start_time VARCHAR(10) NOT NULL,
                end_time VARCHAR(10) NOT NULL,
                link TEXT NOT NULL,
                class_code VARCHAR(50) DEFAULT '2R1',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(36) PRIMARY KEY,
                class_id VARCHAR(36),
                class_name VARCHAR(50) DEFAULT 'ALL',
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'general',
                is_read BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS student_documents (
                id VARCHAR(36) PRIMARY KEY,
                student_code VARCHAR(20) NOT NULL,
                document_type VARCHAR(50) NOT NULL,
                title VARCHAR(150) NOT NULL,
                status VARCHAR(30) DEFAULT 'Verified',
                issue_date VARCHAR(30),
                expiry_date VARCHAR(30),
                issuing_authority VARCHAR(150) DEFAULT 'Dean (Academics), SSGMCE',
                download_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS fee_records (
                id VARCHAR(36) PRIMARY KEY,
                student_code VARCHAR(20),
                academic_year VARCHAR(20),
                semester INTEGER,
                tuition_fee REAL,
                development_fee REAL,
                exam_fee REAL,
                gymkhana_fee REAL,
                total_fee REAL,
                paid_amount REAL,
                due_amount REAL,
                status VARCHAR(20) DEFAULT 'Paid'
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS fee_receipts (
                id VARCHAR(36) PRIMARY KEY,
                student_code VARCHAR(20),
                receipt_no VARCHAR(100) UNIQUE,
                transaction_id VARCHAR(100),
                payment_date VARCHAR(30),
                amount REAL,
                payment_mode VARCHAR(50) DEFAULT 'Online UPI',
                bank_name VARCHAR(100) DEFAULT 'State Bank of India',
                status VARCHAR(20) DEFAULT 'Success',
                download_url TEXT
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS change_info_requests (
                id VARCHAR(36) PRIMARY KEY,
                student_code VARCHAR(20),
                field_name VARCHAR(50),
                current_value VARCHAR(255),
                requested_value VARCHAR(255),
                reason TEXT,
                status VARCHAR(20) DEFAULT 'Pending',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS elearning_assignments (
                id VARCHAR(36) PRIMARY KEY,
                subject_code VARCHAR(20),
                subject_name VARCHAR(150),
                title VARCHAR(200),
                due_date VARCHAR(30),
                total_marks INTEGER DEFAULT 25,
                submission_status VARCHAR(20) DEFAULT 'Submitted',
                grade VARCHAR(10) DEFAULT 'A+',
                file_url TEXT
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS elearning_content (
                id VARCHAR(36) PRIMARY KEY,
                subject_code VARCHAR(20),
                subject_name VARCHAR(150),
                title VARCHAR(200),
                content_type VARCHAR(20) DEFAULT 'PDF',
                file_url TEXT,
                uploaded_at VARCHAR(30)
            )
        """))

        con.execute(text("""
            CREATE TABLE IF NOT EXISTS exam_marks (
                id VARCHAR(36) PRIMARY KEY,
                student_code VARCHAR(20),
                semester INTEGER,
                subject_code VARCHAR(20),
                subject_name VARCHAR(150),
                cie1_score REAL,
                cie2_score REAL,
                ta_score REAL,
                total_internal REAL,
                grade VARCHAR(10),
                grade_points REAL
            )
        """))

        con.commit()

    # 3. Seed Institutional Data
    session = SessionLocal()
    try:
        # Check / Seed Departments
        dept_cnt = session.execute(text("SELECT COUNT(*) FROM departments")).scalar()
        if dept_cnt == 0:
            session.execute(text("""
                INSERT INTO departments (id, code, dept_name, name, icon, classes_count, description)
                VALUES 
                ('dept-cse', 'CSE', 'Computer Science & Engineering', 'Computer Science & Engineering', '💻', 6, 'Department of Computer Science & Engineering'),
                ('dept-it', 'IT', 'Information Technology', 'Information Technology', '🖥️', 4, 'Department of Information Technology')
            """))

        # Check / Seed Classes
        class_cnt = session.execute(text("SELECT COUNT(*) FROM classes")).scalar()
        if class_cnt == 0:
            session.execute(text("""
                INSERT INTO classes (id, department_id, class_name, name, academic_year, semester, division, room, total_students)
                VALUES 
                ('c1r1', 'dept-cse', '1R1', 'First Year R1', '2025-26', 1, '1', 'LH-101', 60),
                ('c2r1', 'dept-cse', '2R1', 'Second Year R1', '2025-26', 3, '1', 'LH-201', 65),
                ('c2r2', 'dept-cse', '2R2', 'Second Year R2', '2025-26', 3, '2', 'LH-202', 63),
                ('c3r1', 'dept-cse', '3R', 'Third Year R', '2025-26', 5, '1', 'LH-301', 68),
                ('c4r1', 'dept-cse', '4R', 'Final Year R', '2025-26', 7, '1', 'LH-401', 62)
            """))

        # Check / Seed Teachers
        teach_cnt = session.execute(text("SELECT COUNT(*) FROM teachers")).scalar()
        if teach_cnt == 0:
            session.execute(text("""
                INSERT INTO teachers (id, department_id, teacher_code, first_name, last_name, email, designation, cabin_number, is_active)
                VALUES 
                ('a0000000-0000-0000-0000-000000000001', 'dept-cse', 'FAC-CSE-1048', 'Rohan', 'Deshmukh', 'rohan.deshmukh@ssgmce.ac.in', 'Associate Professor', 'B-204', 1)
            """))

        # Check / Seed Subjects
        subj_cnt = session.execute(text("SELECT COUNT(*) FROM subjects")).scalar()
        if subj_cnt == 0:
            session.execute(text("""
                INSERT INTO subjects (id, department_id, code, name, semester, type)
                VALUES 
                ('sub-cs301', 'dept-cse', 'CS-301', 'Data Structures & Algorithms', 3, 'THEORY'),
                ('sub-cs302', 'dept-cse', 'CS-302', 'Database Management Systems', 3, 'THEORY'),
                ('sub-cs501', 'dept-cse', 'CS-501', 'Operating Systems', 5, 'THEORY'),
                ('sub-cs701', 'dept-cse', 'CS-701', 'Information & Cyber Security', 7, 'THEORY')
            """))
            session.execute(text("""
                INSERT INTO class_cards (id, teacher_id, class_id, subject_id, academic_year, semester, is_active)
                VALUES 
                ('cc-1', 'a0000000-0000-0000-0000-000000000001', 'c2r1', 'sub-cs301', '2025-26', 'Odd', 1),
                ('cc-2', 'a0000000-0000-0000-0000-000000000001', 'c3r1', 'sub-cs501', '2025-26', 'Odd', 1)
            """))

        # Check / Seed Students
        stud = session.execute(text("SELECT * FROM students WHERE student_code = '308637' LIMIT 1")).fetchone()
        if not stud:
            session.execute(text("""
                INSERT INTO students (id, class_id, roll_no, student_code, full_name, email, phone, status, division)
                VALUES 
                ('s0000000-0000-0000-0000-000000000001', 'c3r1', 60, '308637', 'Shivam Sanjay Aghao', 'shivam.aghao@ssgmce.ac.in', '+91 94218 00000', 'ACTIVE', '1'),
                ('s0000000-0000-0000-0000-000000000002', 'c2r1', 1, '308601', 'Aarav Sharma', 'aarav.sharma@ssgmce.ac.in', '+91 91234 56789', 'ACTIVE', '1'),
                ('s0000000-0000-0000-0000-000000000003', 'c2r1', 2, '308602', 'Ananya Patel', 'ananya.patel@ssgmce.ac.in', '+91 91234 56790', 'ACTIVE', '1'),
                ('s0000000-0000-0000-0000-000000000004', 'c2r1', 3, '308603', 'Rohan Kulkarni', 'rohan.kulkarni@ssgmce.ac.in', '+91 91234 56791', 'ACTIVE', '1'),
                ('s0000000-0000-0000-0000-000000000005', 'c2r1', 4, '308604', 'Priya Verma', 'priya.verma@ssgmce.ac.in', '+91 91234 56792', 'ACTIVE', '1')
            """))

        # Check / Seed Users for Auth
        user_cnt = session.execute(text("SELECT COUNT(*) FROM users")).scalar()
        if user_cnt == 0:
            session.execute(text("""
                INSERT INTO users (id, username, email, role, is_active)
                VALUES 
                ('s0000000-0000-0000-0000-000000000001', '308637', 'shivam.aghao@ssgmce.ac.in', 'student', 1),
                ('a0000000-0000-0000-0000-000000000001', 'FAC-CSE-1048', 'rohan.deshmukh@ssgmce.ac.in', 'teacher', 1),
                ('admin-001', 'admin', 'admin@ssgmce.ac.in', 'admin', 1)
            """))

        # Check / Seed Academic Metrics
        met_cnt = session.execute(text("SELECT COUNT(*) FROM academic_metrics WHERE student_code = '308637'")).scalar()
        if met_cnt == 0:
            session.execute(text("""
                INSERT INTO academic_metrics (id, student_code, academic_year, current_semester, cgpa, latest_sgpa)
                VALUES ('m-308637', '308637', '2025-26', 4, 8.64, 8.84)
            """))

        # Check / Seed Student Attendance Subjects
        att_cnt = session.execute(text("SELECT COUNT(*) FROM student_attendance_subjects WHERE student_code = '308637'")).scalar()
        if att_cnt == 0:
            session.execute(text("""
                INSERT INTO student_attendance_subjects (id, student_code, academic_year, semester, subject_name, subject_code, subject_type, type_name, present_periods, total_periods, faculty_name, classroom)
                VALUES 
                ('att-1', '308637', '2025-26', '4', 'Data Structures & Algorithms', 'CS-301', 'THEORY', 'Core', 28, 32, 'Dr. Rohan Deshmukh', 'LH-201'),
                ('att-2', '308637', '2025-26', '4', 'Database Management Systems', 'CS-302', 'THEORY', 'Core', 30, 34, 'Prof. S. B. Somani', 'LH-202'),
                ('att-3', '308637', '2025-26', '4', 'Operating Systems', 'CS-303', 'THEORY', 'Core', 25, 30, 'Prof. P. R. Dhabe', 'LH-203'),
                ('att-4', '308637', '2025-26', '4', 'Computer Networks', 'CS-304', 'THEORY', 'Core', 27, 31, 'Prof. M. A. Beg', 'LH-204'),
                ('att-5', '308637', '2025-26', '4', 'Theory of Computation', 'CS-305', 'THEORY', 'Core', 26, 30, 'Prof. D. D. Shah', 'LH-201')
            """))

        # Check / Seed Timetable Entries
        tt_cnt = session.execute(text("SELECT COUNT(*) FROM timetable_entries")).scalar()
        if tt_cnt == 0:
            days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            periods = [
                (1, "09:00 - 10:00 AM", "CS-301", "Data Structures & Algorithms", "LH-201", "Dr. Rohan Deshmukh"),
                (2, "10:00 - 11:00 AM", "CS-302", "Database Management Systems", "LH-202", "Prof. S. B. Somani"),
                (3, "11:15 - 12:15 PM", "CS-303", "Operating Systems", "LH-203", "Prof. P. R. Dhabe"),
                (4, "01:00 - 02:00 PM", "CS-304", "Computer Networks", "LH-204", "Prof. M. A. Beg"),
                (5, "02:00 - 03:00 PM", "CS-305", "Theory of Computation", "LH-201", "Prof. D. D. Shah")
            ]
            for d in days:
                for p_num, p_time, code, name, venue, teacher in periods:
                    session.execute(text("""
                        INSERT INTO timetable_entries 
                        (id, day, day_of_week, period_num, period_number, period_time, course_code, course_name, subject_name, venue, room, teacher_name, status, type)
                        VALUES 
                        (:id, :day, :day, :p_num, :p_num_int, :p_time, :code, :name, :name, :venue, :venue, :teacher, 'Scheduled', 'Theory')
                    """), {
                        "id": str(uuid.uuid4()),
                        "day": d,
                        "p_num": f"Period {p_num}",
                        "p_num_int": p_num,
                        "p_time": p_time,
                        "code": code,
                        "name": name,
                        "venue": venue,
                        "teacher": teacher
                    })

        # Check / Seed Notifications
        notif_cnt = session.execute(text("SELECT COUNT(*) FROM notifications")).scalar()
        if notif_cnt == 0:
            session.execute(text("""
                INSERT INTO notifications (id, class_name, title, message, type, is_read)
                VALUES 
                ('notif-1', '3R', 'Mid-Term Examination Schedule Announced', 'Mid-Term tests begin next Monday. Please review syllabus coverage.', 'exam', 0),
                ('notif-2', '3R', 'Library Book Due Reminder', 'Please return or renew issued books before Friday to avoid fine.', 'library', 0),
                ('notif-3', 'ALL', 'Annual Tech Fest Registration Open', 'Registrations for Pragyan 2026 are now live on the student portal.', 'event', 0)
            """))

        # Check / Seed Student Documents
        doc_cnt = session.execute(text("SELECT COUNT(*) FROM student_documents WHERE student_code = '308637'")).scalar()
        if doc_cnt == 0:
            session.execute(text("""
                INSERT INTO student_documents (id, student_code, document_type, title, status, issue_date, issuing_authority, download_url)
                VALUES 
                ('doc-1', '308637', 'id-card', 'Student Smart Identity Card', 'Verified', '2024-08-01', 'Registrar, SSGMCE', '#'),
                ('doc-2', '308637', 'grade-cards', 'Semester 3 Grade Report Card', 'Verified', '2025-01-15', 'Controller of Examinations', '#'),
                ('doc-3', '308637', 'bonafide', 'Bonafide Certificate', 'Verified', '2025-02-10', 'Dean (Academics), SSGMCE', '#')
            """))

        # Check / Seed Fees
        fee_cnt = session.execute(text("SELECT COUNT(*) FROM fee_records WHERE student_code = '308637'")).scalar()
        if fee_cnt == 0:
            session.execute(text("""
                INSERT INTO fee_records (id, student_code, academic_year, semester, tuition_fee, development_fee, exam_fee, gymkhana_fee, total_fee, paid_amount, due_amount, status)
                VALUES 
                ('fee-1', '308637', '2025-26', 4, 85000.0, 12000.0, 2500.0, 1500.0, 101000.0, 101000.0, 0.0, 'Paid')
            """))
            session.execute(text("""
                INSERT INTO fee_receipts (id, student_code, receipt_no, transaction_id, payment_date, amount, payment_mode, bank_name, status, download_url)
                VALUES 
                ('rec-1', '308637', 'REC-2025-08912', 'TXN9928192801', '2025-07-28', 101000.0, 'Online Net Banking', 'State Bank of India', 'Success', '#')
            """))

        # Check / Seed Subject Syllabus
        syl_cnt = session.execute(text("SELECT COUNT(*) FROM subject_syllabus")).scalar()
        if syl_cnt == 0:
            session.execute(text("""
                INSERT INTO subject_syllabus (id, subject_code, subject_name, credits, type, faculty_name, faculty_designation, faculty_email, faculty_cabin, syllabus_progress, university_curriculum_code, curriculum_pdf_url)
                VALUES 
                ('syl-1', 'CS-301', 'Data Structures & Algorithms', 4.0, 'Core Theory + Lab', 'Prof. Rajesh Sharma', 'Assistant Professor', 'rajesh.sharma@ssgmce.ac.in', 'LH-201', 82, 'Autonomous R-2023', '#'),
                ('syl-2', 'CS-302', 'Java & Object Oriented Programming', 3.5, 'Theory + Lab', 'Dr. Rohan Deshmukh', 'Associate Professor & HOD', 'rohan.deshmukh@ssgmce.ac.in', 'LH-204', 80, 'Autonomous R-2023', '#'),
                ('syl-3', 'CS-303', 'Operating Systems Concepts', 3.0, 'Core Theory', 'Prof. Priya Patil', 'Assistant Professor', 'priya.patil@ssgmce.ac.in', 'LH-203', 75, 'Autonomous R-2023', '#'),
                ('syl-4', 'CS-304', 'Database Management Systems', 4.0, 'Core Theory + Lab', 'Dr. Vikram Joshi', 'Assistant Professor', 'vikram.joshi@ssgmce.ac.in', 'Lab 3 Annex', 78, 'Autonomous R-2023', '#'),
                ('syl-5', 'CS-305', 'Computer Networks & Security', 3.0, 'Core Theory', 'Dr. Ananya Sen', 'Associate Professor', 'ananya.sen@ssgmce.ac.in', 'LH-108', 65, 'Autonomous R-2023', '#')
            """))

        # Check / Seed E-Learning Assignments
        asg_cnt = session.execute(text("SELECT COUNT(*) FROM elearning_assignments")).scalar()
        if asg_cnt == 0:
            session.execute(text("""
                INSERT INTO elearning_assignments (id, subject_code, subject_name, title, due_date, total_marks, submission_status, grade, file_url)
                VALUES 
                ('asg-1', 'CS-301', 'Data Structures & Algorithms', 'Assignment 3: Balanced Binary Search Trees (AVL Trees)', '2026-03-20', 25, 'Submitted', 'Pending', '#'),
                ('asg-2', 'CS-304', 'Database Management Systems', 'Assignment 2: Schema Normalization & BCNF Decomposition', '2026-03-27', 25, 'Pending', 'Pending', '#'),
                ('asg-3', 'CS-302', 'Java Programming', 'Lab Assignment 4: Multi-threaded Server Socket Application', '2026-04-05', 25, 'Submitted', 'A+', '#')
            """))

        # Check / Seed E-Learning Content
        cnt_cnt = session.execute(text("SELECT COUNT(*) FROM elearning_content")).scalar()
        if cnt_cnt == 0:
            session.execute(text("""
                INSERT INTO elearning_content (id, subject_code, subject_name, title, content_type, file_url, uploaded_at)
                VALUES 
                ('cnt-1', 'CS-302', 'Java Programming', 'Unit 4: Concurrency & Thread Synchronization Notes', 'Lecture Slides', '#', '2026-02-15'),
                ('cnt-2', 'CS-305', 'Computer Networks', 'Unit 3: Subnetting & CIDR Addressing Video Tutorial', 'Recorded Video', '#', '2026-02-20'),
                ('cnt-3', 'CS-304', 'DBMS', 'Unit 2: Relational Calculus & SQL Optimization Cheatsheet', 'Study Notes', '#', '2026-03-01')
            """))

        # Check / Seed Examination Marks
        mrk_cnt = session.execute(text("SELECT COUNT(*) FROM exam_marks WHERE student_code = '308637'")).scalar()
        if mrk_cnt == 0:
            session.execute(text("""
                INSERT INTO exam_marks (id, student_code, semester, subject_code, subject_name, cie1_score, cie2_score, ta_score, total_internal, grade, grade_points)
                VALUES 
                ('mrk-1', '308637', 4, 'CS-301', 'Data Structures & Algorithms', 18.5, 19.0, 9.5, 47.0, 'A+', 9.0),
                ('mrk-2', '308637', 4, 'CS-302', 'Java Programming', 17.0, 18.5, 9.0, 44.5, 'A', 8.5),
                ('mrk-3', '308637', 4, 'CS-303', 'Operating Systems', 19.0, 18.0, 9.5, 46.5, 'A+', 9.0),
                ('mrk-4', '308637', 4, 'CS-304', 'Database Management Systems', 18.0, 19.5, 9.0, 46.5, 'A+', 9.0),
                ('mrk-5', '308637', 4, 'CS-305', 'Computer Networks', 16.5, 17.5, 8.5, 42.5, 'B+', 8.0)
            """))

        session.commit()
        print("SSGMCE ERP Database populated and ready.")
    except Exception as e:
        session.rollback()
        print(f"Seed error: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    seed()
