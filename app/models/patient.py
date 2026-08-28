import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"
    # A patient_code (hospital MRN) is unique within a hospital, not globally.
    __table_args__ = (
        UniqueConstraint("hospital_id", "patient_code", name="uq_patient_hospital_code"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False, index=True)
    patient_code = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    voice_samples = relationship(
        "VoiceSample",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="VoiceSample.created_at.desc()",
    )

    @property
    def screening_count(self) -> int:
        return len(self.voice_samples)

    @property
    def latest_prediction(self):
        # voice_samples is ordered newest-first, so the first sample that has
        # a prediction is the most recent screening result.
        for sample in self.voice_samples:
            if sample.prediction is not None:
                return sample.prediction
        return None

    @property
    def last_screened_at(self):
        return self.voice_samples[0].created_at if self.voice_samples else None
