from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    job_postings = relationship(
        "JobPosting", back_populates="company", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Company(id={self.id}, name='{self.name}')>"
