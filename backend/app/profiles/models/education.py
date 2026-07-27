from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Education(Base):
    __tablename__ = "education"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    institution_name = Column(String(200), nullable=False)
    degree = Column(String(100), nullable=False)
    field_of_study = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)  # Null if currently studying
    gpa = Column(Float, nullable=True)  # GPA field
    description = Column(Text, nullable=True)

    profile = relationship("Profile", back_populates="education")
