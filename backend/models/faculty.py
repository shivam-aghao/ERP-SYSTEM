import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from backend.config.database import Base

class Teacher(Base):
    __tablename__ = "teachers"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    teacher_code = Column(String(50), unique=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    designation = Column(String(50), default="Assistant Professor")
    cabin_number = Column(String(20), default="B-204")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ClassCard(Base):
    __tablename__ = "class_cards"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("teachers.id"), nullable=True)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=True)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    academic_year = Column(String(20), default="2025-26")
    semester = Column(String(20), default="Odd")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
