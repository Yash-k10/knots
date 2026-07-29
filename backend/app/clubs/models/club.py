from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    members = relationship(
        "ClubMember", back_populates="club", cascade="all, delete-orphan"
    )
