# Voice Screening — Hospital Parkinson's Screening Platform

A full-stack web application that lets hospitals screen patients for signs of
Parkinson's disease from a **few seconds of sustained-vowel voice audio**. Staff
record or upload a clip, the backend extracts 21 acoustic biomarkers with Praat,
runs them through a trained neural network, and returns an easy-to-read risk
label with a confidence score.

> ⚠️ **Clinical decision-support aid only — not a diagnosis.** Results are meant
> to help staff decide who needs a closer look, never to replace a clinician's
> assessment.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
  - [1. Backend](#1-backend)
  - [2. Frontend](#2-frontend)
  - [3. Verify](#3-verify-both-are-up)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Data model](#data-model)
- [The screening pipeline](#the-screening-pipeline)
- [Authentication & multi-tenancy](#authentication--multi-tenancy)
- [Error format](#error-format)
- [Usage walkthrough](#usage-walkthrough)
- [Production notes](#production-notes)

---

## Features

- **Hospital self-service onboarding** — a hospital registers itself and its
  admin account from a public landing page; no manual provisioning.
- **JWT auth** — stateless bearer tokens; every API call is scoped to the
  caller's hospital.
- **Multi-tenant by design** — patients, recordings, and results are isolated
  per hospital. Staff only ever see their own organisation's data.
- **Patient management** — full CRUD with a per-hospital medical record number
  (`patient_code`) enforced unique within the hospital.
- **Voice screening** — record live in the browser or upload a file; the sample
  is scored in seconds.
- **Dashboard** — aggregate stats (patients, screenings, elevated flags, samples
  this week) and recent-patient activity.
- **Standardized error envelope** and friendly, state-aware UI (loading / empty /
  error / disabled states throughout).

---

## Tech stack

### Backend
| Concern | Choice |
| --- | --- |
| Web framework | **FastAPI** (`fastapi[standard]`, served by Uvicorn) |
| ORM / DB | **SQLAlchemy 2.0** + **PostgreSQL** (`psycopg2-binary`) |
| Validation / settings | **Pydantic v2** + `pydantic-settings` |
| Auth | **python-jose** (JWT, HS256) + **bcrypt** (direct) |
| ML inference | **PyTorch** (MLP) + **scikit-learn**/`joblib` (feature scaler) |
| Audio features | **praat-parselmouth** (Praat) + **pydub** (format conversion) |
| Uploads | `python-multipart` |

### Frontend
| Concern | Choice |
| --- | --- |
| Build tool | **Vite 8** |
| UI | **React 19** + **react-router-dom v7** |
| Styling | **Tailwind CSS v4** (`@theme` tokens, no config file) |
| Data / forms | **axios**, **react-hook-form** |
| UX | **react-hot-toast**, **lucide-react** icons, **jwt-decode** |

---

## Architecture

```
┌────────────────────────┐         ┌──────────────────────────────────┐
│  React SPA (Vite)      │  HTTPS  │  FastAPI                          │
│  localhost:5173        │────────▶│  localhost:8000                   │
│                        │  JWT in │                                   │
│  - Landing / auth      │  Bearer │  /auth   /patients   /voice       │
│  - Dashboard           │  header │     │        │           │        │
│  - Patient CRUD        │         │     ▼        ▼           ▼        │
│  - Record / upload     │         │  ┌─────────────────────────────┐  │
└────────────────────────┘         │  │ SQLAlchemy  → PostgreSQL     │  │
                                   │  └─────────────────────────────┘  │
                                   │  ┌─────────────────────────────┐  │
        audio (webm/wav) ─────────▶│  │ pydub → Praat (21 features) │  │
                                   │  │      → StandardScaler        │  │
                                   │  │      → PyTorch MLP → risk    │  │
                                   │  └─────────────────────────────┘  │
                                   │  audio files → storage/            │
                                   └──────────────────────────────────┘
```

---

## Project structure

```
Krusharushi_backend/
├── app/                         # FastAPI backend
│   ├── main.py                  # App entry, CORS, error envelope, startup hooks
│   ├── config.py                # Settings (reads .env via pydantic-settings)
│   ├── database.py              # SQLAlchemy engine / session / Base
│   ├── core/
│   │   ├── security.py          # bcrypt hashing + JWT create/decode
│   │   └── deps.py              # get_current_user / require_admin
│   ├── models/                  # SQLAlchemy ORM tables
│   │   ├── hospital.py  user.py  patient.py  voice_sample.py  prediction.py
│   ├── schemas/                 # Pydantic request/response models
│   │   ├── auth.py  user.py  patient.py  voice.py
│   ├── routers/                 # Route handlers
│   │   ├── auth.py  patients.py  voice.py
│   ├── services/
│   │   ├── audio_features.py    # WAV conversion + 21 Praat features
│   │   └── predict_service.py   # scaler + torch model inference
│   └── ml/
│       ├── net.py               # MLP definition (21→32→16→1)
│       ├── final_model.pt       # trained weights
│       └── scaler.pkl           # fitted StandardScaler
├── data/                        # CSVs used to fit the scaler (3 FL clients)
├── scripts/
│   └── generate_scaler.py       # regenerate scaler.pkl from data/
├── storage/                     # saved audio: <hospital_id>/<patient_id>/<sample>.wav
├── requirements.txt
├── .env                         # backend secrets (DO NOT COMMIT)
│
└── krusharushi_frontend/        # Vite + React frontend
    ├── src/
    │   ├── api/                 # axios client + endpoint wrappers
    │   ├── components/          # ui/ · layout/ · voice/
    │   ├── context/             # AuthContext (hook) + AuthProvider (state)
    │   ├── pages/               # Landing, Login, Signup, Dashboard, Patients…
    │   ├── lib/                 # formatting / prediction helpers
    │   ├── App.jsx              # route table
    │   └── main.jsx             # React entry
    ├── .env                     # VITE_API_BASE_URL
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

| Tool | Version used | Notes |
| --- | --- | --- |
| **Python** | 3.10.x | A `venv/` already exists in the repo. |
| **Node.js** | 20+ (tested on 22) | Ships with npm. |
| **PostgreSQL** | 13+ | Must be running locally; a database must exist (see below). |
| **FFmpeg** | any recent | **Required** — `pydub` shells out to it to convert the browser's `webm`/`ogg` recordings to WAV. Without it, `/voice/upload` and `/voice/record` return `422`. Screening a WAV file directly does not need it. |

Make sure `ffmpeg` is on your `PATH` (`ffmpeg -version` should print a version).

---

## Quick start

The app runs as **two processes**: the FastAPI backend on port `8000` and the
Vite dev server on port `5173`. Open **two terminals**.

### 1. Backend

From the repository root (`Krusharushi_backend/`):

```bash
cd /c/Krusharushi_backend && source venv/Scripts/activate && python -m uvicorn app.main:app --reload --port 8000
```

<details>
<summary>PowerShell / CMD equivalents & first-time setup</summary>

**First time only** — create the DB and install deps (the repo already has a
`venv/`, so activation is usually all you need):

```powershell
# Create the database (once)
psql -U postgres -c "CREATE DATABASE hospital_voice_db;"

# From Krusharushi_backend\
python -m venv venv                      # only if venv/ is missing
.\venv\Scripts\Activate.ps1              # PowerShell   (venv\Scripts\activate.bat for CMD)
pip install -r requirements.txt
```

**Run (PowerShell / CMD):**

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

</details>

On startup the backend **auto-creates all tables** and preloads the ML model.
You should see `Tables ready: [...]` and `Model + scaler loaded.` in the logs.

- API root / health: <http://localhost:8000/health>
- Interactive API docs (Swagger): <http://localhost:8000/docs>

### 2. Frontend

In a second terminal:

```bash
cd /c/Krusharushi_backend/krusharushi_frontend && npm install && npm run dev
```

(`npm install` is only needed the first time; after that just `npm run dev`.)

The app opens at <http://localhost:5173>.

### 3. Verify both are up

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`. Then open <http://localhost:5173>, click
**Get started**, and register a hospital.

---

## Configuration

### Backend — `.env` (repo root)

`app/config.py` reads these via `pydantic-settings`:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | — | e.g. `postgresql://postgres:PASSWORD@localhost:5432/hospital_voice_db` |
| `JWT_SECRET_KEY` | ✅ | — | Long random string used to sign tokens. |
| `JWT_ALGORITHM` | | `HS256` | JWT signing algorithm. |
| `JWT_EXPIRE_MINUTES` | | `60` | Access-token lifetime. |
| `MODEL_PATH` | | `app/ml/final_model.pt` | Trained PyTorch weights. |
| `SCALER_PATH` | | `app/ml/scaler.pkl` | Fitted `StandardScaler`. |
| `STORAGE_DIR` | | `storage` | Where uploaded/recorded audio is written. |
| `CORS_ORIGINS` | | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed browser origins. |

### Frontend — `krusharushi_frontend/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the backend API. |

> If you change the backend port, update `VITE_API_BASE_URL` **and** add the new
> frontend origin to `CORS_ORIGINS`.

---

## API reference

All responses use the [standard error envelope](#error-format) on failure.
Endpoints marked 🔒 require an `Authorization: Bearer <token>` header and are
automatically scoped to the caller's hospital.

### Auth
| Method | Path | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register-hospital` | `hospital_name`, `admin_username`, `admin_password`, `hospital_address?`, `contact_email?` | Creates a hospital + its **admin** user; returns a JWT. `400` if username taken. |
| `POST` | `/auth/login` | `username`, `password` | Returns a JWT. `401` on bad credentials. |

Both return `{ "access_token": "...", "token_type": "bearer" }`.

### Patients 🔒
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/patients` | List this hospital's patients (newest first). |
| `POST` | `/patients` | Create a patient. `409` if `patient_code` already used in this hospital. |
| `GET` | `/patients/stats` | Dashboard aggregates (patients, screenings, elevated flags, samples this week). |
| `GET` | `/patients/{id}` | Patient detail incl. voice samples & predictions. `404` if not in your hospital. |
| `PATCH` | `/patients/{id}` | Partial update. `409` on `patient_code` conflict. |
| `DELETE` | `/patients/{id}` | Delete patient (cascades to samples & predictions). `204`. |

### Voice 🔒
| Method | Path | Body (multipart) | Description |
| --- | --- | --- | --- |
| `POST` | `/voice/upload` | `patient_id`, `file` | Upload an audio file, run screening, store result. |
| `POST` | `/voice/record` | `patient_id`, `file` | Same as upload; tags the source as `recorded`. |
| `GET` | `/voice/{sample_id}/prediction` | — | Fetch a stored prediction. `404` if not yours. |

Voice endpoints return `422` if the audio can't be processed and `503` if the ML
artifacts are unavailable.

### Health
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check → `{"status":"ok"}`. No auth. |

---

## Data model

```
hospitals (id, name, address, contact_email, created_at)
    │ 1
    ├──< users        (id, hospital_id, username, hashed_password, role, created_at)
    │ 1
    └──< patients     (id, hospital_id, patient_code, full_name, age, gender, created_at)
                          │ 1                    UNIQUE(hospital_id, patient_code)
                          └──< voice_samples (id, patient_id, uploaded_by, file_path,
                                │ 1                source, duration_seconds, created_at)
                                └──1 predictions (id, voice_sample_id, probability_score,
                                                  predicted_class, model_version, created_at)
```

- **Cascade deletes**: removing a patient removes its voice samples and their
  predictions.
- `predicted_class`: `1` = elevated risk, `0` = low risk.
- `probability_score`: model probability in `[0, 1]`; the frontend converts it to
  a class-specific confidence percentage.
- Tables are created automatically at startup (no migrations tool yet — see
  [Production notes](#production-notes)).

---

## The screening pipeline

When a clip is submitted to `/voice/upload` or `/voice/record`:

1. **Store** the raw upload under `storage/<hospital_id>/<patient_id>/`.
2. **Convert** to mono WAV via `pydub` → FFmpeg (`ensure_wav`).
3. **Extract 21 acoustic features** with Praat/parselmouth (`extract_21_features`):
   PPE, DFA, RPDE, pulse/period counts, mean & std period, five **jitter**
   measures, six **shimmer** measures, mean autocorrelation, NHR and HNR.
4. **Scale** the feature vector with the pre-fitted `StandardScaler` (`scaler.pkl`).
5. **Infer** with a small PyTorch **MLP** (`21 → 32 → 16 → 1`, ReLU); a sigmoid
   over the logit gives the probability, thresholded at `0.5` for the class.
6. **Persist** a `VoiceSample` + `Prediction` and return them to the client.

The model (`final_model.pt`) was trained via **federated averaging** across the
three client datasets in `data/` (`model_version = "fedavg-v1-plain"`). To
regenerate the scaler from those CSVs:

```bash
python scripts/generate_scaler.py
```

---

## Authentication & multi-tenancy

- Passwords are hashed with **bcrypt** directly (passlib is intentionally avoided
  — see the note in `app/core/security.py`).
- Login/registration return a **JWT** carrying `sub` (user id), `hospital_id`,
  and `role`, signed with `JWT_SECRET_KEY` (HS256), expiring after
  `JWT_EXPIRE_MINUTES`.
- The frontend stores the token in `localStorage`, attaches it to every request
  via an axios interceptor, and auto-logs-out on any `401`.
- `get_current_user` resolves the token to a `User`; **every** patient/voice
  query is filtered by that user's `hospital_id`, so cross-hospital access is
  impossible even with a valid token.
- A `require_admin` dependency exists for future admin-only routes; today all
  authenticated staff can manage patients and run screenings.

---

## Error format

Every error response uses a consistent envelope:

```json
{
  "error": {
    "code": 409,
    "message": "Patient code 'MRN-001' already exists at this hospital",
    "details": null
  }
}
```

`details` is populated for validation errors (`422`) with the field-level list.
The frontend's `getApiErrorMessage` reads `error.message` for user-facing toasts
and inline alerts.

---

## Usage walkthrough

1. Open the app → **Register your hospital** (creates the hospital + admin login).
2. You land on the **Dashboard**.
3. **New patient** → enter a record number (`patient_code`), name, age, gender.
4. Open the patient → **New screening** → record a sustained vowel (e.g. "aaah")
   or upload a clip.
5. The **risk label + confidence meter** appears within a few seconds and is
   saved to the patient's history.

---

## Production notes

This is a demo-grade setup. Before any real deployment:

- **Migrations** — replace `Base.metadata.create_all` with **Alembic**.
- **Secrets** — never commit `.env`; the JWT secret and DB password must be
  rotated and injected from a secrets manager. Add `.env`, `venv/`, `storage/`,
  and `node_modules/` to `.gitignore`.
- **Audio storage** — move from local `storage/` to object storage (S3/GCS) and
  scrub PHI per your compliance regime.
- **CORS / HTTPS** — lock `CORS_ORIGINS` to real origins and terminate TLS.
- **Clinical governance** — the model is a screening aid; validate it clinically
  and surface the disclaimer wherever results appear.
```
