import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from backend.config.database import Base

class Student(Base):
    __tablename__ = "students"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=True, index=True)
    roll_no = Column(Integer, default=1, index=True)
    student_code = Column(String(50), unique=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    status = Column(String(20), default="ACTIVE")
    division = Column(String(20), default="1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AcademicMetrics(Base):
    __tablename__ = "academic_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_code = Column(String(20), nullable=False, index=True)
    academic_year = Column(String(20), nullable=True)
    current_semester = Column(Integer, default=1)
    cgpa = Column(Float, nullable=True)
    latest_sgpa = Column(Float, nullable=True)
