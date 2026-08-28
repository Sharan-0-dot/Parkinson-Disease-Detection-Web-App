from pydantic import BaseModel, EmailStr


class HospitalRegisterRequest(BaseModel):
    hospital_name: str
    hospital_address: str | None = None
    contact_email: EmailStr | None = None
    admin_username: str
    admin_password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"