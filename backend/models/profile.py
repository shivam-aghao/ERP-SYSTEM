import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Boolean
from backend.config.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    class_name = Column(String(50), default="ALL")
    type = Column(String(50), default="general")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
