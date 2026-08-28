from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.hospital import Hospital
from app.models.user import User
from app.schemas.auth import HospitalRegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register-hospital", response_model=TokenResponse)
def register_hospital(payload: HospitalRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.admin_username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    hospital = Hospital(
        name=payload.hospital_name,
        address=payload.hospital_address,
        contact_email=payload.contact_email,
    )
    db.add(hospital)
    db.flush()  # get hospital.id before commit

    admin_user = User(
        hospital_id=hospital.id,
        username=payload.admin_username,
        hashed_password=hash_password(payload.admin_password),
        role="admin",
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    token = create_access_token({
        "sub": str(admin_user.id),
        "hospital_id": str(admin_user.hospital_id),
        "role": admin_user.role,
    })
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = create_access_token({
        "sub": str(user.id),
        "hospital_id": str(user.hospital_id),
        "role": user.role,
    })
    return TokenResponse(access_token=token)