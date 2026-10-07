import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from backend.config.database import Base

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("teachers.id"), nullable=True)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    session_date = Column(String(20), nullable=False)
    period_number = Column(Integer, default=1)
    session_type = Column(String(20), default="theory")
    status = Column(String(20), default="submitted")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    is_present = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class StudentAttendanceSubject(Base):
    __tablename__ = "student_attendance_subjects"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_code = Column(String(50), default="308637", index=True)
    academic_year = Column(String(20), default="2025-26")
    semester = Column(String(20), default="4")
    subject_name = Column(String(150), nullable=False)
    subject_code = Column(String(50), nullable=False)
    subject_type = Column(String(20), default="THEORY")
    type_name = Column(String(20), default="Core")
    present_periods = Column(Integer, default=28)
    total_periods = Column(Integer, default=32)
    faculty_name = Column(String(100), default="Dr. Rohan Deshmukh")
    classroom = Column(String(50), default="LH-201")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
