from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    department = Column(String(100), nullable=True)
    skills = Column(
        JSON, nullable=True
    )  # Grouped/categorized skills or list of strings
    profile_picture = Column(String(255), nullable=True)
    certifications = Column(JSON, nullable=True)  # List of certifications
    projects = Column(JSON, nullable=True)  # List of projects

    user = relationship("User", back_populates="profile")
    employment_history = relationship(
        "EmploymentHistory", back_populates="profile", cascade="all, delete-orphan"
    )
    education = relationship(
        "Education", back_populates="profile", cascade="all, delete-orphan"
    )
