import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.config import settings
from app.models.user import User
from app.models.patient import Patient
from app.models.voice_sample import VoiceSample
from app.models.prediction import Prediction
from app.schemas.voice import VoiceUploadResponse, PredictionOut
from app.services.audio_features import ensure_wav, extract_21_features
from app.services.predict_service import run_inference

router = APIRouter(prefix="/voice", tags=["voice"])

MODEL_VERSION = "fedavg-v1-plain"  # bump/change when swapping in a DP-trained model


def _handle_voice_submission(
    patient_id: uuid.UUID,
    file: UploadFile,
    source: str,
    db: Session,
    current_user: User,
) -> VoiceUploadResponse:
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.hospital_id == current_user.hospital_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    sample_id = uuid.uuid4()
    hospital_dir = os.path.join(settings.STORAGE_DIR, str(current_user.hospital_id), str(patient_id))
    os.makedirs(hospital_dir, exist_ok=True)

    raw_ext = os.path.splitext(file.filename or "")[1] or ".webm"
    raw_path = os.path.join(hospital_dir, f"{sample_id}_raw{raw_ext}")
    wav_path = os.path.join(hospital_dir, f"{sample_id}.wav")

    with open(raw_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        duration = ensure_wav(raw_path, wav_path)
        raw_features = extract_21_features(wav_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not process audio: {e}")

    try:
        probability, predicted_class = run_inference(raw_features)
    except Exception as e:
        # Model/scaler artifacts missing or torch failure — surface as 503, not 500.
        raise HTTPException(status_code=503, detail=f"Screening model unavailable: {e}")

    voice_sample = VoiceSample(
        id=sample_id,
        patient_id=patient_id,
        uploaded_by=current_user.id,
        file_path=wav_path,
        source=source,
        duration_seconds=duration,
    )
    db.add(voice_sample)
    db.flush()

    prediction = Prediction(
        voice_sample_id=voice_sample.id,
        probability_score=probability,
        predicted_class=predicted_class,
        model_version=MODEL_VERSION,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return VoiceUploadResponse(
        sample_id=voice_sample.id,
        source=source,
        prediction=prediction,
    )


@router.post("/upload", response_model=VoiceUploadResponse)
def upload_voice(
    patient_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _handle_voice_submission(patient_id, file, "uploaded", db, current_user)


@router.post("/record", response_model=VoiceUploadResponse)
def record_voice(
    patient_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _handle_voice_submission(patient_id, file, "recorded", db, current_user)


@router.get("/{sample_id}/prediction", response_model=PredictionOut)
def get_sample_prediction(
    sample_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a stored prediction, scoped to the caller's hospital."""
    prediction = (
        db.query(Prediction)
        .join(VoiceSample, Prediction.voice_sample_id == VoiceSample.id)
        .join(Patient, VoiceSample.patient_id == Patient.id)
        .filter(VoiceSample.id == sample_id, Patient.hospital_id == current_user.hospital_id)
        .first()
    )
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction
