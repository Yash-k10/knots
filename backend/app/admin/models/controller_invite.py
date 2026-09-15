from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.core.database import Base


class ControllerInvite(Base):
    __tablename__ = "controller_invites"

    id = Column(Integer, primary_key=True, index=True)
    code_hash = Column(String(64), unique=True, index=True, nullable=False)
    role = Column(String(50), default="Controller", nullable=False)
    department = Column(String(100), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    max_uses = Column(Integer, default=1, nullable=False)
    used_count = Column(Integer, default=0, nullable=False)
    status = Column(
        String(20), default="ACTIVE", nullable=False
    )  # ACTIVE, USED, EXPIRED, REVOKED
    used_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    used_at = Column(DateTime, nullable=True)
