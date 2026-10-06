import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from backend.config.database import Base

class Department(Base):
    __tablename__ = "departments"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(20), unique=True, nullable=False, index=True)
    dept_name = Column(String(100), nullable=True)
    name = Column(String(100), nullable=True)
    icon = Column(String(10), default="💻")
    classes_count = Column(Integer, default=4)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
