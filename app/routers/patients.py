import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.voice_sample import VoiceSample
from app.models.prediction import Prediction
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientSummary,
    PatientDetail,
    HospitalStats,
)

router = APIRouter(prefix="/patients", tags=["patients"])


def _get_owned_patient(patient_id: uuid.UUID, db: Session, current_user: User) -> Patient:
    """Fetch a patient scoped to the caller's hospital, or raise 404."""
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.hospital_id == current_user.hospital_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


def _assert_code_available(
    db: Session, hospital_id: uuid.UUID, patient_code: str, exclude_id: uuid.UUID | None = None
):
    query = db.query(Patient).filter(
        Patient.hospital_id == hospital_id,
        Patient.patient_code == patient_code,
    )
    if exclude_id is not None:
        query = query.filter(Patient.id != exclude_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient code '{patient_code}' already exists at this hospital",
        )


@router.post("", response_model=PatientDetail, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_code_available(db, current_user.hospital_id, payload.patient_code)

    patient = Patient(hospital_id=current_user.hospital_id, **payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=list[PatientSummary])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Patient)
        .filter(Patient.hospital_id == current_user.hospital_id)
        .order_by(Patient.created_at.desc())
        .all()
    )


@router.get("/stats", response_model=HospitalStats)
def hospital_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate screening metrics for the caller's hospital (dashboard cards)."""
    hid = current_user.hospital_id

    total_patients = (
        db.query(func.count(Patient.id)).filter(Patient.hospital_id == hid).scalar() or 0
    )
    total_screenings = (
        db.query(func.count(VoiceSample.id))
        .join(Patient, VoiceSample.patient_id == Patient.id)
        .filter(Patient.hospital_id == hid)
        .scalar()
        or 0
    )
    elevated_flags = (
        db.query(func.count(Prediction.id))
        .join(VoiceSample, Prediction.voice_sample_id == VoiceSample.id)
        .join(Patient, VoiceSample.patient_id == Patient.id)
        .filter(Patient.hospital_id == hid, Prediction.predicted_class == 1)
        .scalar()
        or 0
    )
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    samples_this_week = (
        db.query(func.count(VoiceSample.id))
        .join(Patient, VoiceSample.patient_id == Patient.id)
        .filter(Patient.hospital_id == hid, VoiceSample.created_at >= week_ago)
        .scalar()
        or 0
    )

    return HospitalStats(
        total_patients=total_patients,
        total_screenings=total_screenings,
        elevated_flags=elevated_flags,
        samples_this_week=samples_this_week,
    )


@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_patient(patient_id, db, current_user)


@router.patch("/{patient_id}", response_model=PatientDetail)
def update_patient(
    patient_id: uuid.UUID,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = _get_owned_patient(patient_id, db, current_user)
    data = payload.model_dump(exclude_unset=True)

    new_code = data.get("patient_code")
    if new_code and new_code != patient.patient_code:
        _assert_code_available(db, current_user.hospital_id, new_code, exclude_id=patient.id)

    for field, value in data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = _get_owned_patient(patient_id, db, current_user)
    db.delete(patient)  # cascades to voice_samples + predictions
    db.commit()
    return None
