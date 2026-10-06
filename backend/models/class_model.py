import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from backend.config.database import Base

class Class(Base):
    __tablename__ = "classes"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    class_name = Column(String(50), nullable=True, index=True)
    name = Column(String(50), nullable=True)
    academic_year = Column(String(20), default="2025-26")
    semester = Column(Integer, default=5)
    division = Column(String(20), default="Div 1")
    room = Column(String(50), default="Hall A")
    total_students = Column(Integer, default=60)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    code = Column(String(20), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    semester = Column(Integer, default=5)
    type = Column(String(20), default="THEORY")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
