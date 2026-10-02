import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class StudentProfile(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    roll_no = Column(Integer, default=21, index=True)
    student_code = Column(String(20), unique=True, default="CSE2401", index=True)
    full_name = Column(String(150), default="Shivam Sanjay Aghao")
    email = Column(String(150), default="shivam.aghao@ssgmce.ac.in", index=True)
    department = Column(String(20), default="CSE")
    class_name = Column(String(50), default="TY B.E. Computer Science and Engineering-A")
    division = Column(String(20), default="A")
    semester = Column(Integer, default=5)
    academic_year = Column(String(20), default="2026-2027")
    prn = Column(String(50), default="CSE2401")
    caste = Column(String(50), default="OBC")
    is_employee_ward = Column(Boolean, default=False)
    phone = Column(String(20), default="+91 94231 55678")
    date_of_birth = Column(String(20), default="2004-08-15")
    gender = Column(String(10), default="Male")
    blood_group = Column(String(10), default="O+ve")
    nationality = Column(String(50), default="Indian")
    emergency_contact = Column(String(20), default="+91 98230 41092")
    permanent_address = Column(String(255), default="Plot 14, Gajanan Colony, Buldhana Road, Shegaon")
    district = Column(String(50), default="Buldhana")
    state = Column(String(50), default="Maharashtra")
    pincode = Column(String(10), default="444203")
    father_name = Column(String(100), default="Mr. Sanjay Aghao")
    mother_name = Column(String(100), default="Mrs. Sunita Aghao")
    faculty_mentor = Column(String(100), default="Dr. Rohan Deshmukh (HOD, CSE)")
    admission_quota = Column(String(100), default="MHT-CET State Merit (Autonomous CAP)")
    hostel_status = Column(String(50), default="Day Scholar")
    cgpa = Column(Float, default=8.84)
    sgpa = Column(Float, default=8.92)
    attendance_rate = Column(Float, default=35.14)
    avatar_url = Column(Text, default="images/logo.png")
    created_at = Column(DateTime(timezone=True), default=utc_now)

class AcademicMetrics(Base):
    """Corresponds to Supabase public.student_academic_metrics."""
    __tablename__ = "academic_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637", index=True)
    academic_year = Column(String(20), default="2025-26")
    current_semester = Column(Integer, default=4)
    cgpa = Column(Float, default=8.64)
    latest_sgpa = Column(Float, default=8.84)
    sem1_sgpa = Column(Float, default=8.42)
    sem2_sgpa = Column(Float, default=8.58)
    sem3_sgpa = Column(Float, default=8.64)
    overall_attendance_pct = Column(Float, default=82.00)
    earned_credits = Column(Integer, default=86)
    total_credits = Column(Integer, default=160)
    academic_standing = Column(String(100), default="Active Student (Autonomous)")
    created_at = Column(DateTime(timezone=True), default=utc_now)

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    day = Column(String(20), index=True)  # monday, tuesday, etc.
    period_num = Column(String(20))       # Period 1, Period 2
    period_time = Column(String(50))      # 09:00 AM - 10:00 AM
    course_code = Column(String(20))      # CS-301
    course_name = Column(String(150))     # Data Structures
    venue = Column(String(100))           # LH-204
    teacher_name = Column(String(100))    # Prof. R. Sharma
    status = Column(String(50), default="Scheduled")
    status_class = Column(String(50), default="status-upcoming")
    att_label = Column(String(50), default="Regular Lecture")
    is_completed = Column(Boolean, default=False)
    is_active_now = Column(Boolean, default=False)
    is_critical = Column(Boolean, default=False)

class SubjectSyllabus(Base):
    __tablename__ = "subject_syllabus"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_code = Column(String(20), index=True)
    subject_name = Column(String(150))
    credits = Column(Integer, default=4)
    faculty_name = Column(String(100))
    faculty_designation = Column(String(100), default="Assistant Professor")
    faculty_email = Column(String(100))
    faculty_cabin = Column(String(100), default="CSE Cabins")
    syllabus_progress = Column(Integer, default=80)
    university_curriculum_code = Column(String(50), default="SGBAU-BTECH-CSE-2024")
    curriculum_pdf_url = Column(Text, default="https://ssgmce.ac.in/academics/syllabus/cse-sem4.pdf")

class FeeRecord(Base):
    __tablename__ = "fee_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637")
    academic_year = Column(String(20), default="2025-26")
    semester = Column(Integer, default=4)
    tuition_fee = Column(Float, default=74500.0)
    development_fee = Column(Float, default=12000.0)
    exam_fee = Column(Float, default=2500.0)
    gymkhana_fee = Column(Float, default=1500.0)
    total_fee = Column(Float, default=90500.0)
    paid_amount = Column(Float, default=90500.0)
    due_amount = Column(Float, default=0.0)
    status = Column(String(20), default="PAID")

class FeeReceipt(Base):
    __tablename__ = "fee_receipts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637")
    receipt_no = Column(String(100), unique=True)
    transaction_id = Column(String(100))
    payment_date = Column(String(30))
    amount = Column(Float)
    payment_mode = Column(String(50), default="Online Net Banking")
    bank_name = Column(String(100), default="State Bank of India")
    status = Column(String(20), default="SUCCESS")
    download_url = Column(Text, default="#")

class ElearningAssignment(Base):
    __tablename__ = "elearning_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_code = Column(String(20))
    subject_name = Column(String(150))
    title = Column(String(200))
    due_date = Column(String(30))
    total_marks = Column(Integer, default=20)
    submission_status = Column(String(20), default="SUBMITTED")
    grade = Column(String(10), default="A+")
    file_url = Column(Text, default="#")

class ElearningContent(Base):
    __tablename__ = "elearning_content"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_code = Column(String(20))
    subject_name = Column(String(150))
    title = Column(String(200))
    content_type = Column(String(20), default="PDF")  # PDF, PPT, VIDEO
    file_url = Column(Text, default="#")
    uploaded_at = Column(String(30))

class ElearningQuiz(Base):
    __tablename__ = "elearning_quizzes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_code = Column(String(20))
    title = Column(String(200))
    duration_mins = Column(Integer, default=30)
    total_marks = Column(Integer, default=20)
    obtained_marks = Column(Integer, default=18)
    status = Column(String(20), default="COMPLETED")

class ChangeInfoRequest(Base):
    __tablename__ = "change_info_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637")
    field_name = Column(String(50))  # Name, Employee, Caste, Personal Photo
    current_value = Column(String(255))
    requested_value = Column(String(255))
    reason = Column(Text)
    status = Column(String(20), default="PENDING")
    submitted_at = Column(DateTime(timezone=True), default=utc_now)

class UpdationInfoRecord(Base):
    __tablename__ = "updation_info_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637")
    category = Column(String(50))  # Industrial Visit, Seminar, Workshop, Activities
    title = Column(String(200))
    event_date = Column(String(50))
    organization = Column(String(150))
    description = Column(Text)
    aicte_points = Column(Integer, default=10)
    status = Column(String(20), default="VERIFIED")

class StudentDocument(Base):
    """Corresponds to Supabase public.student_documents table."""
    __tablename__ = "student_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637")
    document_name = Column(String(150), nullable=False)
    category = Column(String(50), default="ACADEMIC")  # IDENTITY, ACADEMIC, ADMISSION
    file_url = Column(Text, default="#")
    file_size = Column(String(20), default="1.2 MB")
    is_verified = Column(Boolean, default=True)
    upload_date = Column(String(30), default="2025-08-15")

class ExamMark(Base):
    __tablename__ = "exam_marks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637")
    semester = Column(Integer, default=4)
    subject_code = Column(String(20))
    subject_name = Column(String(150))
    cie1_score = Column(Float, default=28.0)
    cie2_score = Column(Float, default=27.0)
    ta_score = Column(Float, default=10.0)
    total_internal = Column(Float, default=65.0)
    grade = Column(String(10), default="A+")
    grade_points = Column(Float, default=9.0)

class ExamRevaluation(Base):
    __tablename__ = "exam_revaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637")
    subject_code = Column(String(20))
    subject_name = Column(String(150))
    exam_session = Column(String(50), default="Winter 2025")
    current_marks = Column(Float, default=24.0)
    application_type = Column(String(50), default="REVALUATION")
    fee_paid = Column(Float, default=300.0)
    status = Column(String(20), default="UNDER_PROCESS")
    applied_at = Column(DateTime(timezone=True), default=utc_now)

class StudentNotification(Base):
    __tablename__ = "student_notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="308637")
    title = Column(String(200))
    message = Column(Text)
    category = Column(String(50), default="ACADEMIC")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class StudentAttendanceSubject(Base):
    __tablename__ = "student_attendance_subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_code = Column(String(20), default="CSE2401", index=True)
    academic_year = Column(String(20), default="2026-2027")
    semester = Column(String(20), default="V")
    subject_name = Column(String(150), nullable=False)
    subject_code = Column(String(50), nullable=False)
    subject_type = Column(String(10), default="TH")  # TH, PR, TUT
    type_name = Column(String(20), default="Theory") # Theory, Practical, Tutorial
    present_periods = Column(Integer, default=0)
    total_periods = Column(Integer, default=0)
    faculty_name = Column(String(100))
    classroom = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=utc_now)
