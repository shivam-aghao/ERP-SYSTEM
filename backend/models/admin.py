import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from backend.config.database import Base

class AuditLog(Base):
    __tablename__ = "quiz_audit_logs"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    entity_name = Column(String(100), nullable=True)
    entity_id = Column(String(50), nullable=True)
    payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
