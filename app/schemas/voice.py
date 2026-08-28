from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class PredictionOut(BaseModel):
    id: UUID
    voice_sample_id: UUID
    probability_score: float
    predicted_class: int
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True


class VoiceSampleOut(BaseModel):
    id: UUID
    source: str
    duration_seconds: float | None = None
    created_at: datetime
    prediction: PredictionOut | None = None

    class Config:
        from_attributes = True


class VoiceUploadResponse(BaseModel):
    sample_id: UUID
    source: str
    prediction: PredictionOut
