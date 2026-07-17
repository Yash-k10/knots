import enum

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class EventCategoryType(str, enum.Enum):
    """Enumeration for predefined campus event categories."""

    ACADEMIC = "ACADEMIC"
    CULTURAL = "CULTURAL"
    SPORTS = "SPORTS"
    TECHNICAL = "TECHNICAL"
    WORKSHOP = "WORKSHOP"
    SEMINAR = "SEMINAR"
    SOCIAL = "SOCIAL"
    CAREER = "CAREER"
    OTHER = "OTHER"


class EventCategory(Base):
    """
    Represents a category that groups campus events by type.

    Each Event belongs to exactly one EventCategory.
    Categories help users discover and filter events by interest area.
    """

    __tablename__ = "event_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(300), nullable=True)

    # Back-reference: all events in this category
    events = relationship("Event", back_populates="category")

    def __repr__(self) -> str:
        return f"<EventCategory id={self.id} name={self.name!r}>"
