import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import inspect

from app.config import settings
from app.database import Base, engine
from app.models import hospital, user, patient, voice_sample, prediction  # noqa: F401
from app.routers import auth, patients, voice


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables (demo convenience; a production deploy would use Alembic).
    Base.metadata.create_all(bind=engine)
    print("Tables ready:", inspect(engine).get_table_names())

    # Warm the ML artifacts once at startup so the first screening isn't slow.
    # Best-effort: auth/patient endpoints still work if torch or the model
    # files are unavailable in this environment.
    try:
        from app.services.predict_service import get_model, get_scaler

        get_scaler()
        get_model()
        print("Model + scaler loaded.")
    except Exception as e:  # noqa: BLE001
        print(f"[warn] Could not preload ML artifacts at startup: {e}")

    yield


app = FastAPI(title="Hospital Voice Screening API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error_response(status_code: int, message: str, details=None, headers=None) -> JSONResponse:
    """Standardized JSON error envelope: {"error": {code, message, details?}}."""
    body: dict = {"error": {"code": status_code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=body, headers=headers)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, str):
        message, details = detail, None
    else:
        message, details = "Request failed", detail
    return _error_response(
        exc.status_code, message, details, headers=getattr(exc, "headers", None)
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return _error_response(
        422,
        "Validation failed",
        details=jsonable_encoder(exc.errors()),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Log the real cause server-side; return an opaque envelope to the client.
    traceback.print_exc()
    return _error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR, "Internal server error"
    )


app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(voice.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
