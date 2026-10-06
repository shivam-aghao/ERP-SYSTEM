import logging
from sqlalchemy.orm import Session
from app.models.db_models import (
    StudentProfile, TimetableEntry, SubjectSyllabus, FeeRecord, FeeReceipt,
    ElearningAssignment, ElearningContent, ElearningQuiz, StudentDocument,
    ExamMark, StudentNotification, StudentAttendanceSubject
)

logger = logging.getLogger("student_erp_fastapi")

def seed_student_database(db: Session):
    # 1. Student Profile
    student = db.query(StudentProfile).first()
    if not student:
        student = StudentProfile(
            roll_no=21,
            student_code="CSE2401",
            full_name="Shivam Sanjay Aghao",
            email="shivam.aghao@ssgmce.ac.in",
            department="CSE",
            class_name="TY B.E. Computer Science and Engineering-A",
            division="A",
            semester=5,
            academic_year="2026-2027",
            prn="CSE2401",
            caste="OBC",
            is_employee_ward=False,
            phone="+91 94231 55678",
            cgpa=8.84,
            sgpa=8.92,
            attendance_rate=35.14,
            avatar_url="images/logo.png"
        )
        db.add(student)
    else:
        student.full_name = "Shivam Sanjay Aghao"
        student.roll_no = 21
        student.student_code = "CSE2401"
        student.class_name = "TY B.E. Computer Science and Engineering-A"
        student.division = "A"
        student.semester = 5
        student.academic_year = "2026-2027"
        student.prn = "CSE2401"
        student.attendance_rate = 35.14

    # 2. Timetable Entries
    if db.query(TimetableEntry).count() == 0:
        timetable_days = {
            "monday": [
                ("Period 1", "09:00 AM - 10:00 AM", "CS-303", "Operating Systems", "LH-301", "Prof. V. K. Ramanujan", "Completed ✓", "status-done", "Attendance: Present", True, False, False),
                ("Period 2", "10:15 AM - 11:15 AM", "CS-301", "Data Structures & Algorithms", "LH-204", "Prof. R. Sharma", "Completed ✓", "status-done", "Attendance: Present", True, False, False),
                ("Period 3", "11:30 AM - 12:30 PM", "CS-304", "Database Management Systems", "LH-112", "Dr. P. Deshmukh", "Completed ✓", "status-done", "Attendance: Present", True, False, False),
                ("Period 4", "01:30 PM - 02:30 PM", "CS-305", "Computer Networks", "LH-108", "Dr. Ananya Sen", "Completed ✓", "status-done", "Attendance: Present", True, False, False),
                ("Period 5", "02:45 PM - 04:45 PM", "CS-301L", "DSA Lab (Batch 2R1)", "Software Lab 2", "Prof. R. Sharma", "Completed ✓", "status-done", "Practical Present", True, False, False),
            ],
            "thursday": [
                ("Period 1", "09:00 AM - 10:00 AM", "CS-301", "Data Structures", "LH-204", "Prof. R. Sharma", "Completed ✓", "status-done", "Attendance: Present", True, False, False),
                ("Period 2", "10:15 AM - 11:15 AM", "CS-302L", "Java Programming Lab", "Adv Systems Lab 3", "Dr. S. Kulkarni", "Live Now", "status-live", "Biometric Logged In", False, True, False),
                ("Period 3", "11:30 AM - 12:30 PM", "CS-303", "Operating Systems", "LH-301", "Prof. V. K. Ramanujan", "Next Up", "status-upcoming", "Starts in 15 mins", False, False, False),
                ("Period 4", "01:30 PM - 02:30 PM", "CS-305", "Computer Networks", "LH-108", "Dr. Ananya Sen", "Must Attend", "status-critical", "Critical for 75% threshold", False, False, True),
                ("Period 5", "02:45 PM - 03:45 PM", "CS-304", "Database Management Tutorial", "Seminar Hall 1", "Dr. P. Deshmukh", "Tutorial", "status-upcoming", "Problem Solving Session", False, False, False),
            ],
        }
        for day, periods in timetable_days.items():
            for p in periods:
                db.add(TimetableEntry(
                    day=day,
                    period_num=p[0],
                    period_time=p[1],
                    course_code=p[2],
                    course_name=p[3],
                    venue=p[4],
                    teacher_name=p[5],
                    status=p[6],
                    status_class=p[7],
                    att_label=p[8],
                    is_completed=p[9],
                    is_active_now=p[10],
                    is_critical=p[11]
                ))

    # 3. Subject Syllabus
    if db.query(SubjectSyllabus).count() == 0:
        syllabus_items = [
            ("CS-301", "Data Structures & Algorithms", 4, "Dr. J.M.Patil", "Associate Professor", "jm.patil@ssgmce.ac.in", "Cabin 204", 85),
            ("CS-302", "Object Oriented Programming with Java", 4, "Dr. S. Kulkarni", "Professor & HOD", "s.kulkarni@ssgmce.ac.in", "HOD Cabin", 78),
            ("CS-303", "Operating System Principles", 4, "Prof. V. K. Ramanujan", "Assistant Professor", "v.ramanujan@ssgmce.ac.in", "Cabin 210", 82),
            ("CS-304", "Database Management Systems", 4, "Dr. P. Deshmukh", "Associate Professor", "p.deshmukh@ssgmce.ac.in", "Cabin 208", 90),
            ("CS-305", "Computer Networks & Protocols", 3, "Dr. Ananya Sen", "Assistant Professor", "a.sen@ssgmce.ac.in", "Cabin 214", 70),
        ]
        for s in syllabus_items:
            db.add(SubjectSyllabus(
                subject_code=s[0],
                subject_name=s[1],
                credits=s[2],
                faculty_name=s[3],
                faculty_designation=s[4],
                faculty_email=s[5],
                faculty_cabin=s[6],
                syllabus_progress=s[7]
            ))

    # 4. Fee Record & Receipt
    if db.query(FeeRecord).count() == 0:
        db.add(FeeRecord(
            student_code="308637",
            academic_year="2025-26",
            semester=4,
            tuition_fee=74500.0,
            development_fee=12000.0,
            exam_fee=2500.0,
            gymkhana_fee=1500.0,
            total_fee=90500.0,
            paid_amount=90500.0,
            due_amount=0.0,
            status="PAID"
        ))
        db.add(FeeReceipt(
            student_code="308637",
            receipt_no="SSGMCE/FEE/2025-26/1048",
            transaction_id="TXN-SBI-984729184",
            payment_date="12 August 2025",
            amount=90500.0,
            payment_mode="Online Net Banking (SBI ePay)",
            bank_name="State Bank of India",
            status="SUCCESS",
            download_url="https://ssgmce.ac.in/fees/receipt_1048.pdf"
        ))

    # 5. E-Learning Assignments & Content
    if db.query(ElearningAssignment).count() == 0:
        db.add(ElearningAssignment(
            subject_code="CS-301",
            subject_name="Data Structures",
            title="Assignment 3: Red-Black Trees and Graph Traversal Algorithms",
            due_date="05 October 2026",
            total_marks=20,
            submission_status="SUBMITTED",
            grade="A+"
        ))
        db.add(ElearningAssignment(
            subject_code="CS-304",
            subject_name="Database Management",
            title="Assignment 2: Complex SQL Queries, Triggers and Normalization",
            due_date="10 October 2026",
            total_marks=20,
            submission_status="PENDING",
            grade="Pending"
        ))

    if db.query(ElearningContent).count() == 0:
        db.add(ElearningContent(
            subject_code="CS-301",
            subject_name="Data Structures",
            title="Unit 3: Balanced Binary Search Trees & Heaps",
            content_type="PDF",
            uploaded_at="20 Sept 2026"
        ))
        db.add(ElearningContent(
            subject_code="CS-302",
            subject_name="Java Programming",
            title="Unit 4: Java Virtual Machine Internals & Garbage Collection",
            content_type="PPT",
            uploaded_at="22 Sept 2026"
        ))

    # 6. D-Wallet Documents (Supabase student_documents)
    if db.query(StudentDocument).count() == 0:
        docs = [
            ("Aadhaar Card (UIDAI Verified)", "IDENTITY", "1.1 MB", True, "15 Aug 2024"),
            ("HSC Marksheet & Certificate", "ACADEMIC", "2.4 MB", True, "18 Aug 2024"),
            ("CAP Allotment Letter (MHT-CET / DTE)", "ADMISSION", "850 KB", True, "20 Aug 2024"),
            ("Caste & Non-Creamy Layer Certificate", "CATEGORY", "1.5 MB", True, "22 Aug 2024"),
            ("Semester III SGBAU Grade Card", "ACADEMIC", "1.3 MB", True, "10 Jan 2025")
        ]
        for d in docs:
            db.add(StudentDocument(
                student_code="308637",
                document_name=d[0],
                category=d[1],
                file_size=d[2],
                is_verified=d[3],
                upload_date=d[4]
            ))

    # 7. Examination Marks
    if db.query(ExamMark).count() == 0:
        marks = [
            ("CS-301", "Data Structures", 28.0, 27.0, 10.0, 65.0, "A+", 9.0),
            ("CS-302", "Java Programming", 26.0, 28.0, 9.5, 63.5, "A", 8.5),
            ("CS-303", "Operating Systems", 25.0, 26.0, 9.0, 60.0, "A", 8.0),
            ("CS-304", "Database Management", 29.0, 29.0, 10.0, 68.0, "O", 10.0),
            ("CS-305", "Computer Networks", 24.0, 25.0, 9.0, 58.0, "B+", 7.5),
        ]
        for m in marks:
            db.add(ExamMark(
                student_code="308637",
                semester=4,
                subject_code=m[0],
                subject_name=m[1],
                cie1_score=m[2],
                cie2_score=m[3],
                ta_score=m[4],
                total_internal=m[5],
                grade=m[6],
                grade_points=m[7]
            ))

    # 8. Notifications
    if db.query(StudentNotification).count() == 0:
        db.add(StudentNotification(
            student_code="CSE2401",
            title="Mid-Term CIE Test 2 Timetable",
            message="Continuous Internal Evaluation Test 2 commences from 12 October 2026. Review syllabus.",
            category="EXAM"
        ))
        db.add(StudentNotification(
            student_code="CSE2401",
            title="Critical Attendance Alert: 35.14%",
            message="Your overall attendance is 35.14% (26/74 periods). 8 subjects are below the mandatory 75% threshold.",
            category="ATTENDANCE"
        ))

    # 9. Attendance Subjects (9 Semester V Subjects for Shivam Sanjay Aghao)
    if db.query(StudentAttendanceSubject).count() == 0:
        attendance_subjects = [
            ("Data Science and Statistics", "5CS223PE-I-TH", "TH", "Theory", 5, 11, "Prof. Dr. R. S. Deshmukh", "LH-204"),
            ("Database Management Systems", "5CS220PC", "TH", "Theory", 4, 9, "Prof. P. V. Kulkarni", "LH-202"),
            ("Compiler Design", "5CS221PC", "TH", "Theory", 5, 18, "Prof. A. S. Joshi", "LH-204"),
            ("Computer Architecture & Organization", "5CS222PC", "TH", "Theory", 5, 15, "Prof. S. P. Bhombe", "LH-201"),
            ("Database Management Systems-LAB", "5CS224PC", "PR", "Practical", 2, 2, "Prof. P. V. Kulkarni", "Lab-2"),
            ("Compiler Design_LAB", "5CS225PC", "PR", "Practical", 0, 4, "Prof. A. S. Joshi", "Lab-1"),
            ("Introduction to Microprocessors", "5ET227MD", "TH", "Theory", 2, 7, "Prof. N. M. Yawale", "LH-105"),
            ("Microcontroller Applications", "5ET228MD", "TH", "Theory", 3, 6, "Prof. G. B. Rathod", "LH-105"),
            ("Microprocessor and Microcontroller Lab", "5ET229ML", "PR", "Practical", 0, 2, "Prof. G. B. Rathod", "MP-Lab"),
        ]
        for item in attendance_subjects:
            db.add(StudentAttendanceSubject(
                student_code="CSE2401",
                academic_year="2026-2027",
                semester="V",
                subject_name=item[0],
                subject_code=item[1],
                subject_type=item[2],
                type_name=item[3],
                present_periods=item[4],
                total_periods=item[5],
                faculty_name=item[6],
                classroom=item[7]
            ))

    db.commit()
    logger.info("Student dashboard database seeding completed successfully.")
