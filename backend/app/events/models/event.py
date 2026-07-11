from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    date = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
