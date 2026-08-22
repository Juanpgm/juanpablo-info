# voice2textReporter

![Python](https://img.shields.io/badge/python-3.11%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![faster-whisper](https://img.shields.io/badge/faster--whisper-≥1.0-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-stable-brightgreen)

> **Plug-and-play FastAPI module** — records a voice note, transcribes it **locally** with [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (no API key, no cost), stores the audio in S3 or local filesystem, persists the record with timestamp and returns structured JSON.

Drop it into **any** FastAPI project with a single `include_router()` call.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Integration — add to your own FastAPI project](#integration--add-to-your-own-fastapi-project)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Model Size Guide](#model-size-guide)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Documentation](#documentation)
- [License](#license)

---

## Features

- **100% local transcription** — no OpenAI API key, no cost, no data leaves your server.
- **Pluggable storage** — local filesystem (dev) or AWS S3 (production).
- **Pluggable persistence** — JSON file (zero deps) or Firebase Firestore.
- **gzip compression** of uploaded audio by default (~40% size reduction).
- **iOS Safari compatible** — handles `video/mp4` MIME type from mobile voice notes.
- **Ports & adapters** — swap backends via env vars, no code changes.

---

## Quick start

### 1. Install

```bash
pip install fastapi uvicorn[standard] python-multipart faster-whisper boto3 python-dotenv aiofiles
```

> **Important:** `ffmpeg` must be installed and on your PATH.  
> Windows: `winget install FFmpeg`  
> macOS: `brew install ffmpeg`  
> Ubuntu: `apt install ffmpeg`

### 2. Configure

```bash
cp .env.example .env
# Edit .env — the defaults work for local development without any changes.
```

### 3. Run the example app

```bash
uvicorn app.main:app --reload
```

Open [http://localhost:8000/docs](http://localhost:8000/docs) to explore the API.

---

## Integration — add to your own FastAPI project

```python
from fastapi import FastAPI
from voice2text import router           # 1. import the router

app = FastAPI()
app.include_router(router, prefix="/voice")  # 2. mount it — done
```

The module reads all configuration from environment variables (see below).
It is entirely self-contained; it adds no global state to your application.

---

## API Endpoints

All endpoints are mounted under the prefix you choose (default: `/voice`).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/voice/records` | Upload audio → transcribe → save |
| `GET` | `/voice/records` | List all records |
| `GET` | `/voice/records/{id}` | Get a single record |
| `DELETE` | `/voice/records/{id}` | Delete record + audio file |
| `GET` | `/voice/health` | Health check |

### POST `/voice/records`

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | file | ✅ | Audio file (wav, mp3, ogg, webm, m4a, mp4) |
| `title` | string | ❌ | Human-readable label |
| `language` | string | ❌ | Language hint (`es`, `en`, …). Auto-detected when omitted. |
| `metadata` | JSON string | ❌ | Extra key-value pairs attached to the record |

**Example with curl:**

```bash
curl -X POST http://localhost:8000/voice/records \
  -F "audio=@my_note.wav" \
  -F "title=Field inspection note" \
  -F "language=es"
```

**Example response (201):**

```json
{
  "record_id": "a3f8c1d2e4b5...",
  "title": "Field inspection note",
  "text": "El árbol en la esquina está bloqueando la vía peatonal.",
  "language": "es",
  "duration_seconds": 5.4,
  "audio_url": "/audio/recordings/a3f8c1d2/audio_uuid.wav",
  "audio_key": "recordings/a3f8c1d2/audio_uuid.wav",
  "audio_filename": "my_note.wav",
  "created_at": "2026-05-14T10:23:45-05:00",
  "metadata": {}
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WHISPER_MODEL_SIZE` | `base` | Whisper model: `tiny` / `base` / `small` / `medium` / `large-v2` |
| `WHISPER_LANGUAGE` | `es` | Default transcription language (BCP-47) |
| `WHISPER_BEAM_SIZE` | `5` | Beam search width — higher = more accurate, slower |
| `WHISPER_DEVICE` | `cpu` | `cpu` or `cuda` |
| `WHISPER_COMPUTE_TYPE` | `int8` | `int8` for CPU, `float16` for GPU |
| `STORAGE_BACKEND` | `local` | `local` or `s3` |
| `LOCAL_STORAGE_DIR` | `voice2text_uploads` | Directory for local file storage |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials (S3 only) |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials (S3 only) |
| `AWS_REGION` | `us-east-1` | S3 bucket region |
| `S3_BUCKET_NAME` | `voice2text-recordings` | Target S3 bucket |
| `S3_PREFIX` | `recordings` | Object key prefix inside the bucket |
| `S3_PRESIGNED_URL_EXPIRATION` | `3600` | Presigned URL TTL in seconds |
| `REPO_BACKEND` | `json` | `json` or `firebase` |
| `JSON_DB_PATH` | `voice2text_records.json` | Path to the JSON database file |
| `FIREBASE_CREDENTIALS_PATH` | `serviceAccountKey.json` | Path to Firebase service account JSON |
| `FIRESTORE_COLLECTION` | `voice_records` | Firestore collection name |
| `COMPRESS_AUDIO` | `true` | gzip-compress audio before uploading |
| `VOICE2TEXT_TIMEZONE` | `UTC` | IANA timezone for `created_at` timestamps |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |

---

## Model size guide

| Model | Size | Spanish WER | Approx. speed (CPU) |
|-------|------|-------------|---------------------|
| `tiny` | 39 MB | ~15% | < 0.5 s for 5 s audio |
| `base` | 74 MB | ~10% | ~1 s for 5 s audio |
| `small` | 244 MB | ~7% | ~3 s for 5 s audio |
| `medium` | 769 MB | ~5% | ~8 s for 5 s audio |

`base` is the recommended default — good quality and fast enough for real-time use.

---

## Project Structure

```
voice2TextReporter/
├── voice2text/               ← The reusable module
│   ├── __init__.py           ← Exports `router`
│   ├── config.py             ← All config from env vars
│   ├── models.py             ← Pydantic v2 data models
│   ├── transcriber.py        ← Whisper singleton + transcribe()
│   ├── dependencies.py       ← DI factories (lru_cache)
│   ├── router.py             ← FastAPI APIRouter (public API)
│   ├── storage/
│   │   ├── base.py           ← BaseStorage ABC
│   │   ├── local_storage.py  ← Local filesystem backend
│   │   └── s3_storage.py     ← AWS S3 backend
│   └── repository/
│       ├── base.py           ← BaseRepository ABC
│       ├── json_repo.py      ← JSON file backend (thread-safe)
│       └── firebase_repo.py  ← Firestore backend
├── app/
│   └── main.py               ← Standalone example FastAPI app
├── tests/
│   ├── test_transcriber.py   ← Unit tests (mocked Whisper)
│   └── test_router.py        ← Integration tests (TestClient)
├── .env.example
├── .gitignore
├── requirements.txt
├── reverse-engineering-voice-transcription.md
└── README.md
```

---

## Running Tests

```bash
pip install pytest httpx
pytest tests/ -v
```

---

## Documentation

Full documentation lives in the [`docs/`](docs/) folder:

| Document | Description |
|----------|-------------|
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Step-by-step setup from zero to running server |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | How to import and mount the module in any FastAPI project |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Complete endpoint reference with request/response schemas |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | All environment variables explained in detail |
| [docs/BACKENDS.md](docs/BACKENDS.md) | Storage and repository backend guide (local, S3, JSON, Firestore) |
| [reverse-engineering-voice-transcription.md](reverse-engineering-voice-transcription.md) | Full reverse-engineering analysis of the original api-catatrack feature |

---

## License

MIT
