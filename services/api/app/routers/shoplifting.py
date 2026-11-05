from fastapi import APIRouter, HTTPException, UploadFile, File, Body
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import csv
import os
import shutil
import subprocess
import sys

router = APIRouter(prefix="/api/v1/shoplifting", tags=["Shoplifting Log"])

# Resolve paths relative to the repo root so it works whether the API is run
# from `services/api` or from the repository root.
REPO_ROOT = Path(__file__).resolve().parents[4]  # services/api/app/routers -> repo root
CSV_PATH = REPO_ROOT / "services" / "edge-agent" / "assets" / "shop_theft_log.csv"
EVIDENCE_DIR = REPO_ROOT / "services" / "edge-agent" / "assets" / "evidence"
VIDEOS_DIR = REPO_ROOT / "services" / "edge-agent" / "assets" / "videos"
PIPELINE_SCRIPT = REPO_ROOT / "services" / "edge-agent" / "tools" / "run_shoplift_pipeline.py"


def _read_log() -> list[dict]:
    """Read the shoplifting CSV log into a list of dicts (newest first)."""
    if not CSV_PATH.exists():
        return []
    rows: list[dict] = []
    with open(CSV_PATH, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            rows.append(row)
    rows.reverse()  # newest first
    return rows


@router.get("/log")
def get_shoplifting_log():
    """Return every person tracked by the edge agent: entry time, exit time,
    duration, suspected-theft flag, detector confidence, and photo path."""
    return {"count": len(_read_log()), "records": _read_log()}


@router.get("/evidence/{filename}")
def get_evidence_photo(filename: str):
    """Serve a single evidence photo (person crop JPEG) saved by the edge agent."""
    # Prevent path traversal.
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = EVIDENCE_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Evidence photo not found")
    return FileResponse(str(file_path), media_type="image/jpeg")


@router.get("/videos/{filename}")
def get_video_file(filename: str):
    """Serve an uploaded video file for frontend playback."""
    # Prevent path traversal.
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = VIDEOS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(str(file_path), media_type="video/mp4")


@router.post("/upload-video")
def upload_video(file: UploadFile = File(...)):
    """Upload a shop video file. Saves it to assets/videos/ and returns the
    stored path so it can be processed by the shoplifting pipeline."""
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

    # Sanitize filename to prevent path traversal.
    safe_name = Path(file.filename).name
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
        "message": "Video uploaded successfully. Use /process-video to run detection.",
    }


@router.post("/process-video")
def process_video(video_path: str = Body(..., embed=True)):
    """Run the shoplifting detection pipeline on an uploaded video file.

    Accepts a video path (from /upload-video) and runs the full YOLOv8n +
    shoplifting monitor pipeline, producing entry/exit times and evidence
    photos in shop_theft_log.csv.
    """
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

    # Resolve the path; reject anything outside the videos dir for safety.
    requested = Path(video_path)
    if not requested.is_absolute():
        requested = VIDEOS_DIR / requested
    if not str(requested).startswith(str(VIDEOS_DIR)):
        raise HTTPException(status_code=400, detail="Invalid video path")
    if not requested.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    # Run the pipeline script as a subprocess.
    try:
        result = subprocess.run(
            [
                sys.executable,
                str(PIPELINE_SCRIPT),
                "--video",
                str(requested),
                "--camera",
                "cam-uploaded",
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

    # Return summary from the CSV.
    records = _read_log()
    thefts = sum(1 for r in records if r.get("theft_suspected") == "True")

    return {
        "message": "Video processed successfully.",
        "video": str(requested),
        "records_found": len(records),
        "thefts_suspected": thefts,
        "pipeline_output": result.stdout[-2000:] if result.stdout else "",
    }
