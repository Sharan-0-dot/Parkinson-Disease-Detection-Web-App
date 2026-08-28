from uuid import UUID
from pydantic import BaseModel


class UserOut(BaseModel):
    id: UUID
    username: str
    role: str
    hospital_id: UUID

    class Config:
        from_attributes = True