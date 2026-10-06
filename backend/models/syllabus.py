import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text
from backend.config.database import Base

class SubjectSyllabus(Base):
    __tablename__ = "subject_syllabus"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), nullable=True)
    unit_number = Column(Integer, default=1)
    unit_title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    hours = Column(Integer, default=8)

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), nullable=True)
    day_of_week = Column(String(20), nullable=False)
    period_number = Column(Integer, default=1)
    subject_name = Column(String(100), nullable=False)
    teacher_name = Column(String(100), nullable=True)
    room = Column(String(50), default="Hall 101")
