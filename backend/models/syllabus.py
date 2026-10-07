import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from backend.config.database import Base

class SubjectSyllabus(Base):
    __tablename__ = "subject_syllabus"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), nullable=True)
    subject_code = Column(String(20), nullable=True, index=True)
    subject_name = Column(String(150), nullable=True)
    credits = Column(Float, default=4.0)
    type = Column(String(50), default="Core Theory")
    faculty_name = Column(String(100), nullable=True)
    faculty_designation = Column(String(100), default="Assistant Professor")
    faculty_email = Column(String(100), nullable=True)
    faculty_cabin = Column(String(100), default="LH-201")
    syllabus_progress = Column(Integer, default=75)
    university_curriculum_code = Column(String(50), default="Autonomous R-2023")
    curriculum_pdf_url = Column(Text, nullable=True)
    unit_number = Column(Integer, default=1)
    unit_title = Column(String(200), nullable=True)
    content = Column(Text, nullable=True)
    hours = Column(Integer, default=8)

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), nullable=True)
    day = Column(String(20), nullable=True)
    day_of_week = Column(String(20), nullable=True)
    period_num = Column(String(20), nullable=True)
    period_number = Column(Integer, default=1)
    period_time = Column(String(50), nullable=True)
    course_code = Column(String(20), nullable=True)
    course_name = Column(String(150), nullable=True)
    subject_name = Column(String(150), nullable=True)
    venue = Column(String(100), nullable=True)
    room = Column(String(50), default="Hall 101")
    teacher_name = Column(String(100), nullable=True)
    status = Column(String(50), default="Scheduled")
    status_class = Column(String(50), nullable=True)
    att_label = Column(String(50), nullable=True)
    type = Column(String(30), default="Theory")
