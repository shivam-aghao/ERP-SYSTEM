import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(10), default="💻")
    classes_count = Column(Integer, default=4)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    classes = relationship("Class", back_populates="department", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="department", cascade="all, delete-orphan")
    teachers = relationship("Teacher", back_populates="department")

class Class(Base):
    __tablename__ = "classes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False, index=True)
    academic_year = Column(String(20), default="2025-26")
    semester = Column(Integer, default=5)
    division = Column(String(20), default="Div 1")
    room = Column(String(50), default="Hall A")
    total_students = Column(Integer, default=60)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    department = relationship("Department", back_populates="classes")
    students = relationship("Student", back_populates="assigned_class", cascade="all, delete-orphan")
    cards = relationship("ClassCard", back_populates="assigned_class", cascade="all, delete-orphan")
    sessions = relationship("AttendanceSession", back_populates="assigned_class")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(20), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    semester = Column(Integer, default=5)
    type = Column(String(20), default="THEORY")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    department = relationship("Department", back_populates="subjects")
    cards = relationship("ClassCard", back_populates="subject", cascade="all, delete-orphan")
    sessions = relationship("AttendanceSession", back_populates="subject")

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(150), nullable=False)
    emp_code = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    designation = Column(String(100), default="Associate Professor")
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    phone = Column(String(20), nullable=True)
    avatar = Column(String(20), default="RS")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    department = relationship("Department", back_populates="teachers")
    cards = relationship("ClassCard", back_populates="teacher", cascade="all, delete-orphan")
    sessions = relationship("AttendanceSession", back_populates="teacher")
    notifications = relationship("Notification", back_populates="teacher", cascade="all, delete-orphan")

class ClassCard(Base):
    __tablename__ = "class_cards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    teacher_id = Column(String(36), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(50), default="Hall C")
    color_gradient = Column(String(100), default="from-blue-600 to-indigo-700")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    teacher = relationship("Teacher", back_populates="cards")
    assigned_class = relationship("Class", back_populates="cards")
    subject = relationship("Subject", back_populates="cards")
    department = relationship("Department")

class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    roll_no = Column(Integer, nullable=False, index=True)
    student_code = Column(String(20), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    is_provisional = Column(Boolean, default=False)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    assigned_class = relationship("Class", back_populates="students")
    records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    teacher_id = Column(String(36), ForeignKey("teachers.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    attendance_date = Column(String(20), nullable=False, index=True)
    period = Column(String(50), default="1")
    status = Column(String(20), default="DRAFT", index=True)
    topic_covered = Column(Text, default="")
    teaching_aid = Column(String(100), default="Blackboard / PPT")
    remarks = Column(Text, default="")
    total_students = Column(Integer, default=0)
    present_count = Column(Integer, default=0)
    absent_count = Column(Integer, default=0)
    attendance_rate = Column(Float, default=0.0)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    teacher = relationship("Teacher", back_populates="sessions")
    assigned_class = relationship("Class", back_populates="sessions")
    subject = relationship("Subject", back_populates="sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="PRESENT")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_session_student"),
    )

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="records")

class AttendanceHistorySummary(Base):
    __tablename__ = "attendance_history_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    last_10_statuses = Column(String(20), default="")
    total_sessions = Column(Integer, default=0)
    present_count = Column(Integer, default=0)
    absent_count = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", name="uq_student_subject_history"),
    )

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    teacher_id = Column(String(36), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    teacher = relationship("Teacher", back_populates="notifications")
