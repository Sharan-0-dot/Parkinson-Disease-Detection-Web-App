from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.voice import PredictionOut, VoiceSampleOut


class PatientCreate(BaseModel):
    patient_code: str = Field(..., min_length=1)
    full_name: str | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    gender: str | None = None


class PatientUpdate(BaseModel):
    """All fields optional — only provided fields are updated."""
    patient_code: str | None = Field(default=None, min_length=1)
    full_name: str | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    gender: str | None = None


class PatientOut(BaseModel):
    id: UUID
    patient_code: str
    full_name: str | None
    age: int | None
    gender: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class PatientSummary(PatientOut):
    """List-view row: base patient fields plus a screening snapshot."""
    screening_count: int = 0
    last_screened_at: datetime | None = None
    latest_prediction: PredictionOut | None = None


class PatientDetail(PatientOut):
    """Detail view: full patient record with screening history."""
    voice_samples: list[VoiceSampleOut] = []


class HospitalStats(BaseModel):
    total_patients: int
    total_screenings: int
    elevated_flags: int
    samples_this_week: int
