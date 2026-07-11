from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    permissions = Column(JSON, nullable=True)  # List of string permissions e.g., ["read_posts", "create_job"]

    users = relationship("User", back_populates="role")
