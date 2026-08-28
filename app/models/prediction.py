import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    voice_sample_id = Column(
        UUID(as_uuid=True), ForeignKey("voice_samples.id"), nullable=False, index=True
    )
    probability_score = Column(Float, nullable=False)
    predicted_class = Column(Integer, nullable=False)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    voice_sample = relationship("VoiceSample", back_populates="prediction")
