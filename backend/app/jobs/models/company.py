from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    website = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=True)

    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
