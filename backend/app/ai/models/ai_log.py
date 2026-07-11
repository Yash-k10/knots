from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey

from app.core.database import Base


class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_name = Column(String(100), nullable=False)  # AIResumeService, AIClubRecommendationService, etc.
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
