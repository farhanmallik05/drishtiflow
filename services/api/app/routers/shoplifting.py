from fastapi import APIRouter, HTTPException, UploadFile, File, Body, Query
from fastapi.responses import FileResponse
from pathlib import Path
from urllib.parse import quote
import csv
import mimetypes
import shutil
import subprocess
import sys
import time
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/api/v1/shoplifting", tags=["Shoplifting Log"])

# Resolve paths relative to the repo root so it works whether the API is run
# from `services/api` or from the repository root.
REPO_ROOT = Path(__file__).resolve().parents[4]  # services/api/app/routers -> repo root
CSV_PATH = REPO_ROOT / "services" / "edge-agent" / "assets" / "shop_theft_log.csv"
EVIDENCE_DIR = REPO_ROOT / "services" / "edge-agent" / "assets" / "evidence"
VIDEOS_DIR = REPO_ROOT / "services" / "edge-agent" / "assets" / "videos"
PIPELINE_SCRIPT = REPO_ROOT / "services" / "edge-agent" / "tools" / "run_shoplift_pipeline.py"

UPLOAD_CAMERA_ID = "cam-uploaded"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _as_bool(value) -> bool:
    """CSV stores booleans as the strings 'True'/'False'."""
    return str(value).strip().lower() in {"true", "1", "yes"}


def _as_float(value, default: float = 0.0) -> float:
    try:
        return round(float(value), 4)
    except (TypeError, ValueError):
        return default


def _media_type_for(path: Path, fallback: str = "application/octet-stream") -> str:
    """Best-effort MIME type so browsers can play any uploaded video format."""
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed or fallback


def _evidence_url(photo_path: str) -> str | None:
    """Map an absolute evidence path to the API route the frontend can render."""
    if not photo_path:
        return None
    filename = Path(photo_path).name
    if not filename or not (EVIDENCE_DIR / filename).exists():
        return None
    return f"/api/v1/shoplifting/evidence/{quote(filename)}"


def _normalize_record(row: dict) -> dict:
    """Convert a raw CSV row into a typed, frontend-friendly record."""
    photo_path = (row.get("photo_path") or "").strip()
    return {
        "track_id": row.get("track_id", ""),
        "camera_id": row.get("camera_id", ""),
        "entry_time": row.get("entry_time", ""),
        "exit_time": row.get("exit_time", ""),
        "duration_seconds": _as_float(row.get("duration_seconds")),
        "shelf_interaction": _as_bool(row.get("shelf_interaction")),
        "theft_suspected": _as_bool(row.get("theft_suspected")),
        "detector_confidence": _as_float(row.get("detector_confidence")),
        "photo_path": photo_path or None,
        "photo_url": _evidence_url(photo_path),
        "logged_at": row.get("logged_at", ""),
    }


def _read_log(camera_id: str | None = None) -> list[dict]:
    """Read the shoplifting CSV log into a list of normalized dicts (newest first)."""
    if not CSV_PATH.exists():
        return []
    rows: list[dict] = []
    with open(CSV_PATH, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            record = _normalize_record(row)
            if camera_id and record["camera_id"] != camera_id:
                continue
            rows.append(record)
    rows.reverse()  # newest first
    return rows


def _safe_path(directory: Path, filename: str) -> Path:
    """Resolve a filename inside ``directory`` while blocking path traversal."""
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    candidate = (directory / filename).resolve()
    if candidate.parent != directory.resolve():
        raise HTTPException(status_code=400, detail="Invalid filename")
    return candidate


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/log")
def get_shoplifting_log(
    camera_id: str | None = Query(default=None, description="Optional camera filter"),
    limit: int = Query(default=200, ge=1, le=1000),
):
    """Return every person tracked by the edge agent: entry/exit times, duration,
    suspected-theft flag, detector confidence, and evidence photo URL."""
    records = _read_log(camera_id=camera_id)[:limit]
    return {
        "count": len(records),
        "thefts_suspected": sum(1 for r in records if r["theft_suspected"]),
        "records": records,
    }


@router.get("/evidence/{filename}")
def get_evidence_photo(filename: str):
    """Serve a single evidence photo (person crop JPEG) saved by the edge agent."""
    file_path = _safe_path(EVIDENCE_DIR, filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Evidence photo not found")
    return FileResponse(str(file_path), media_type=_media_type_for(file_path, "image/jpeg"))


@router.get("/videos/{filename}")
def get_video_file(filename: str):
    """Serve an uploaded video file for frontend playback (supports Range requests)."""
    file_path = _safe_path(VIDEOS_DIR, filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(
        str(file_path),
        media_type=_media_type_for(file_path, "video/mp4"),
        headers={"Accept-Ranges": "bytes"},
    )


@router.post("/upload-video")
def upload_video(file: UploadFile = File(...)):
    """Upload a shop video file. Saves it to assets/videos/ and returns the
    stored path plus a playback URL for the frontend."""
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

    # Sanitize filename to prevent path traversal.
    safe_name = Path(file.filename or "").name
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = VIDEOS_DIR / safe_name

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {exc}")
    finally:
        file.file.close()

    return {
        "filename": safe_name,
        "path": str(file_path),
        "url": f"/api/v1/shoplifting/videos/{quote(safe_name)}",
        "media_type": _media_type_for(file_path, "video/mp4"),
        "size_bytes": file_path.stat().st_size,
        "message": "Video uploaded successfully. Use /process-video to run detection.",
    }


@router.post("/process-video")
async def process_video(
    video_path: str = Body(..., embed=True),
    camera_id: str = Body(default=UPLOAD_CAMERA_ID, embed=True),
):
    """Run the shoplifting detection pipeline on an uploaded video file.

    Accepts a video path (from /upload-video) and runs the full YOLOv8n +
    shoplifting monitor pipeline, producing entry/exit times and evidence
    photos. Returns the per-person records for this run so the UI can render
    results immediately.
    """
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

    # Resolve the path; reject anything outside the videos dir for safety.
    requested = Path(video_path)
    if not requested.is_absolute():
        requested = VIDEOS_DIR / requested
    requested = requested.resolve()
    if requested.parent != VIDEOS_DIR.resolve():
        raise HTTPException(status_code=400, detail="Invalid video path")
    if not requested.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    if not PIPELINE_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="Shoplifting pipeline script is missing")

    # Run the pipeline script as a subprocess (off the event loop).
    started = time.perf_counter()
    try:
        result = await run_in_threadpool(
            subprocess.run,
            [
                sys.executable,
                str(PIPELINE_SCRIPT),
                "--video",
                str(requested),
                "--camera",
                camera_id,
                "--out",
                str(CSV_PATH),
                "--evidence-dir",
                str(EVIDENCE_DIR),
            ],
            capture_output=True,
            text=True,
            timeout=300,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Video processing timed out")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}")

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline failed: {result.stderr[-1000:] if result.stderr else 'unknown error'}",
        )

    # The pipeline rewrites the CSV for this run, then we scope by camera.
    records = _read_log(camera_id=camera_id)
    thefts = sum(1 for r in records if r["theft_suspected"])

    return {
        "message": "Video processed successfully.",
        "video": str(requested),
        "video_url": f"/api/v1/shoplifting/videos/{quote(requested.name)}",
        "camera_id": camera_id,
        "records_found": len(records),
        "thefts_suspected": thefts,
        "records": records,
        "elapsed_seconds": round(time.perf_counter() - started, 2),
        "pipeline_output": result.stdout[-2000:] if result.stdout else "",
    }
