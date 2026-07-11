from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date
from sqlalchemy.orm import relationship

from app.core.database import Base


class EmploymentHistory(Base):
    __tablename__ = "employment_history"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    company_name = Column(String(200), nullable=False)
    title = Column(String(100), nullable=False)
    location = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)  # Null if currently working
    description = Column(Text, nullable=True)

    profile = relationship("Profile", back_populates="employment_history")
