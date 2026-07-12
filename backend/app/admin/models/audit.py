from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )  # Null if system process
    action = Column(
        String(100), nullable=False
    )  # login, create_post, delete_user, etc.
    target = Column(String(200), nullable=True)  # Name/ID of modified resource
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
