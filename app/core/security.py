from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt, JWTError

from app.config import settings

# NOTE: We use the `bcrypt` library directly rather than passlib's CryptContext.
# passlib 1.7.4's bcrypt backend self-test is broken against bcrypt >= 4.1
# (raises "password cannot be longer than 72 bytes" on load), which would break
# every login/registration. Direct bcrypt is fully compatible with existing
# `$2b$` hashes, so no re-hashing of already-seeded users is needed.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES],
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
