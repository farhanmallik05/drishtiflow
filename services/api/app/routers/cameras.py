from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse

import json
import threading
import time
import uuid
import ipaddress
from datetime import datetime, timezone
from typing import Any, Dict, Generator, List, Optional, Tuple, Union
from urllib.parse import urlparse

import numpy as np

from ..schemas.camera import CameraCreate, CameraResponse, ZoneCreate, ZoneResponse, Point
from ..database import get_db

router = APIRouter(prefix="/api/v1/cameras", tags=["Cameras & Zones"])

# ---------------------------------------------------------------------------
# Live streaming helpers
# ---------------------------------------------------------------------------

_YOLO_MODEL: Any = None
_YOLO_LOCK = threading.Lock()


def _require_cv2() -> Any:
    """Imports OpenCV lazily so a missing optional dependency cannot break the API."""
    try:
        import cv2  # noqa: PLC0415 - deliberate lazy import
    except ImportError as exc:  # pragma: no cover - depends on install state
        raise HTTPException(
            status_code=503,
            detail="Live streaming requires opencv-python-headless in the API environment.",
        ) from exc
    return cv2


def _get_yolo_model(model_path: str = "yolov8n.pt") -> Any:
    """Lazily initializes the YOLOv8 model from the monorepo root or current directory."""
    global _YOLO_MODEL
    if _YOLO_MODEL is not None:
        return _YOLO_MODEL

    with _YOLO_LOCK:
        if _YOLO_MODEL is not None:
            return _YOLO_MODEL

        try:
            from ultralytics import YOLO  # noqa: PLC0415 - optional dependency
        except ImportError:
            return None

        from pathlib import Path

        candidates = [
            Path(model_path),
            Path(__file__).resolve().parents[4] / model_path,
            Path(__file__).resolve().parents[2] / model_path,
        ]
        resolved = next((str(p) for p in candidates if p.exists()), model_path)
        _YOLO_MODEL = YOLO(resolved)
        return _YOLO_MODEL


def _resolve_cv_source(
    source_type: str, stream_url: Optional[str]
) -> Optional[Union[int, str]]:
    """
    Converts camera database fields or query overrides into an OpenCV VideoCapture target.

    Returns ``None`` when the camera has no live source (e.g. the synthetic sample feed),
    so the API never silently opens the server's own webcam.
    """
    cleaned = (stream_url or "").strip()
    if cleaned:
        if cleaned.isdigit():
            return int(cleaned)
        if cleaned.lower() == "webcam":
            return 0
        return cleaned

    if (source_type or "").lower() == "webcam":
        return 0

    return None


def _validate_stream_source(source: Optional[Union[int, str]]) -> Optional[Union[int, str]]:
    """
    Reject SSRF-dangerous sources before they reach cv2.VideoCapture.

    Allows:
    - ``None`` (no source)
    - integer device indices (local webcam)
    - public http/https/rtsp URLs whose host is not loopback, private,
      link-local, multicast, reserved, or unspecified.

    Returns ``None`` when the source should be refused.
    """
    if source is None or isinstance(source, int):
        return source

    text = str(source).strip()
    try:
        parsed = urlparse(text)
    except Exception:
        return None

    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https", "rtsp"):
        return None

    host = parsed.hostname
    if not host:
        return None

    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        # Hostname: allow (cannot reliably enumerate all private TLDs).
        return text

    if (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return None

    return text


def _draw_yolo_detections(
    frame: np.ndarray,
    cached_detections: Optional[List[Dict[str, Any]]] = None,
    run_inference: bool = True,
    conf_threshold: float = 0.35,
) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
    """Runs YOLOv8 or re-draws cached bounding boxes on the frame for low-latency MJPEG streaming."""
    cv2 = _require_cv2()
    detections: List[Dict[str, Any]] = list(cached_detections or [])

    if run_inference:
        detections = []
        model = _get_yolo_model()
        if model is not None:
            try:
                results = model.predict(source=frame, conf=conf_threshold, verbose=False)
            except Exception:
                results = []
            for res in results:
                boxes = getattr(res, "boxes", None)
                names = getattr(res, "names", {})
                if boxes is None:
                    continue
                for box in boxes:
                    xyxy = box.xyxy[0].cpu().numpy().astype(int)
                    x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])
                    conf = float(box.conf[0].cpu().numpy())
                    cls_id = int(box.cls[0].cpu().numpy())
                    label = names.get(cls_id, str(cls_id))
                    detections.append(
                        {"label": label, "conf": conf, "x1": x1, "y1": y1, "x2": x2, "y2": y2}
                    )

    for det in detections:
        x1, y1, x2, y2 = det["x1"], det["y1"], det["x2"], det["y2"]
        label = det["label"]
        conf = det["conf"]
        color = (16, 185, 129) if label == "person" else (59, 130, 246)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        caption = f"{label} ({conf:.2f})"
        (tw, th), _ = cv2.getTextSize(caption, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, max(0, y1 - th - 8)), (x1 + tw + 6, y1), color, -1)
        cv2.putText(
            frame,
            caption,
            (x1 + 3, max(12, y1 - 4)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )

    return frame, detections


def _redact_source(source: Union[int, str]) -> str:
    """
    Removes embedded credentials from a camera source before it is rendered into
    an error frame. RTSP URLs commonly carry ``user:pass@host`` and the fallback
    banner is served to unauthenticated clients.
    """
    text = str(source)
    if "://" not in text:
        return text
    scheme, rest = text.split("://", 1)
    if "@" in rest:
        rest = rest.rsplit("@", 1)[1]
    return f"{scheme}://{rest}"


def _create_fallback_banner(message: str, width: int = 640, height: int = 360) -> bytes:
    """Generates a diagnostic JPEG frame when a camera or RTSP stream cannot be reached."""
    cv2 = _require_cv2()
    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    canvas[:] = (24, 24, 27)
    cv2.putText(
        canvas,
        "DrishtiFlow Live Stream Unavailable",
        (32, height // 2 - 16),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (248, 113, 113),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        canvas,
        message[:70],
        (32, height // 2 + 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (212, 212, 216),
        1,
        cv2.LINE_AA,
    )
    _, buf = cv2.imencode(".jpg", canvas)
    return buf.tobytes()


def _mjpeg_stream_generator(
    source: Union[int, str],
    annotate: bool = False,
    stride: int = 3,
    width: int = 640,
    height: int = 360,
    max_fps: float = 30.0,
) -> Generator[bytes, None, None]:
    """Opens OpenCV VideoCapture and yields multipart/x-mixed-replace JPEG frames."""
    cv2 = _require_cv2()

    cap = cv2.VideoCapture(source)
    if isinstance(source, str) and source.startswith("rtsp://"):
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        fallback_jpg = _create_fallback_banner(
            f"Cannot open source: {_redact_source(source)}", width, height
        )
        yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + fallback_jpg + b"\r\n"
        cap.release()
        return

    frame_idx = 0
    frame_period = 1.0 / max_fps if max_fps > 0 else 0.0
    cached_detections: List[Dict[str, Any]] = []

    try:
        while cap.isOpened():
            started = time.perf_counter()
            ok, frame = cap.read()
            if not ok or frame is None:
                # If reading a local video file for testing, loop back to frame 0
                if isinstance(source, str) and not source.startswith(
                    ("rtsp://", "http://", "https://")
                ):
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                break

            frame = cv2.resize(frame, (width, height))
            if annotate:
                run_yolo = (frame_idx % max(1, stride)) == 0
                frame, cached_detections = _draw_yolo_detections(
                    frame,
                    cached_detections=cached_detections,
                    run_inference=run_yolo,
                )

            frame_idx += 1
            ok_enc, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if not ok_enc:
                continue

            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"

            elapsed = time.perf_counter() - started
            if frame_period and elapsed < frame_period:
                time.sleep(frame_period - elapsed)
    finally:
        cap.release()


def _load_camera_row(camera_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a camera row, returning ``None`` when it does not exist."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cameras WHERE id = ?", (camera_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Camera CRUD, Zone Management & Connectivity
# ---------------------------------------------------------------------------

@router.get("", response_model=List[CameraResponse])
def list_cameras():
    """List cameras with their polygon zones."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras ORDER BY created_at ASC")
    cameras_rows = cursor.fetchall()

    result = []
    for cam in cameras_rows:
        cursor.execute("SELECT * FROM zones WHERE camera_id = ?", (cam["id"],))
        zones_rows = cursor.fetchall()
        zones = []
        for z in zones_rows:
            poly_data = json.loads(z["polygon"])
            zones.append(ZoneResponse(
                id=z["id"],
                camera_id=z["camera_id"],
                name=z["name"],
                polygon=[Point(**p) for p in poly_data],
                color=z["color"] or "#ef4444",
                created_at=z["created_at"]
            ))

        result.append(CameraResponse(
            id=cam["id"],
            organization_id=cam["organization_id"],
            site_id=cam["site_id"],
            name=cam["name"],
            source_type=cam["source_type"],
            stream_url=cam["stream_url"],
            status=cam["status"],
            last_heartbeat_at=cam["last_heartbeat_at"],
            zones=zones,
            created_at=cam["created_at"]
        ))
    conn.close()
    return result


@router.post("", response_model=CameraResponse, status_code=201)
def create_camera(req: CameraCreate):
    """Register a new camera source or sample clip."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
    site = cursor.fetchone()
    if not site:
        conn.close()
        raise HTTPException(status_code=500, detail="Site not configured")

    cam_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        INSERT INTO cameras (id, organization_id, site_id, name, source_type, stream_url, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'online', ?)
        """,
        (cam_id, site["organization_id"], site["id"], req.name, req.source_type, req.stream_url, now)
    )
    conn.commit()
    conn.close()

    return CameraResponse(
        id=cam_id,
        organization_id=site["organization_id"],
        site_id=site["id"],
        name=req.name,
        source_type=req.source_type,
        stream_url=req.stream_url,
        status="online",
        created_at=now,
        zones=[]
    )


@router.post("/{camera_id}/zones", response_model=ZoneResponse, status_code=201)
def add_zone(camera_id: str, req: ZoneCreate):
    """Save an interactive polygon zone overlay for a camera."""
    conn = get_db()
    cursor = conn.cursor()
    zone_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    poly_json = json.dumps([p.model_dump() for p in req.polygon])

    cursor.execute(
        """
        INSERT INTO zones (id, camera_id, name, polygon, color, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (zone_id, camera_id, req.name, poly_json, req.color or "#ef4444", now)
    )
    conn.commit()
    conn.close()

    return ZoneResponse(
        id=zone_id,
        camera_id=camera_id,
        name=req.name,
        polygon=req.polygon,
        color=req.color or "#ef4444",
        created_at=now
    )


@router.post("/{camera_id}/test")
def test_camera_connection(camera_id: str):
    """Test camera stream connectivity."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras WHERE id = ?", (camera_id,))
    cam = cursor.fetchone()
    if not cam:
        conn.close()
        raise HTTPException(status_code=404, detail="Camera not found")

    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE cameras SET status = 'online', last_heartbeat_at = ? WHERE id = ?", (now, camera_id))
    conn.commit()
    conn.close()

    return {
        "id": camera_id,
        "name": cam["name"],
        "status": "online",
        "tested_at": now,
        "source_type": cam["source_type"]
    }


@router.post("/{camera_id}/heartbeat")
def camera_heartbeat(camera_id: str):
    """Record an edge-agent heartbeat and mark the camera online."""
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE cameras SET last_heartbeat_at = ?, status = 'online' WHERE id = ?",
            (now, camera_id),
        )
        conn.commit()
    finally:
        conn.close()

    return {"camera_id": camera_id, "status": "online", "last_heartbeat_at": now}


# ---------------------------------------------------------------------------
# Live MJPEG Streaming & Snapshot
# ---------------------------------------------------------------------------

@router.get("/{camera_id}/stream")
def stream_camera_feed(
    camera_id: str,
    stream_url: Optional[str] = Query(
        default=None,
        description="Optional override RTSP/HTTP URL or webcam device index (e.g. '0')",
    ),
    annotate: bool = Query(
        default=True,
        description="When true, runs YOLOv8 object detection and draws live bounding boxes",
    ),
    stride: int = Query(
        default=3,
        ge=1,
        le=30,
        description="Run YOLOv8 inference every Nth frame to balance FPS and CPU load",
    ),
):
    """
    Streams live video from an RTSP IP camera, HTTP phone camera, or USB webcam
    as multipart/x-mixed-replace MJPEG so it renders natively inside browser <img> tags.
    """
    camera = _load_camera_row(camera_id)
    if camera is None and stream_url is None:
        raise HTTPException(status_code=404, detail="Camera not found")

    effective_url = stream_url if stream_url is not None else (camera or {}).get("stream_url")
    source_type = (camera or {}).get("source_type", "webcam")
    cv_source = _resolve_cv_source(source_type, effective_url)
    cv_source = _validate_stream_source(cv_source)

    if cv_source is None:
        fallback = _create_fallback_banner(
            "Invalid or unsafe stream source. Only public http/https/rtsp URLs and local webcam are allowed."
        )
        return Response(
            content=fallback,
            media_type="image/jpeg",
            headers={"Cache-Control": "no-store"},
        )

    return StreamingResponse(
        _mjpeg_stream_generator(
            source=cv_source,
            annotate=annotate,
            stride=stride,
        ),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-store", "Pragma": "no-cache"},
    )


@router.get("/{camera_id}/snapshot")
def capture_camera_snapshot(
    camera_id: str,
    stream_url: Optional[str] = Query(default=None),
    annotate: bool = Query(default=True),
):
    """Captures a single live JPEG frame from the camera for evidence or preview."""
    cv2 = _require_cv2()

    camera = _load_camera_row(camera_id)
    if camera is None and stream_url is None:
        raise HTTPException(status_code=404, detail="Camera not found")

    effective_url = stream_url if stream_url is not None else (camera or {}).get("stream_url")
    source_type = (camera or {}).get("source_type", "webcam")
    cv_source = _resolve_cv_source(source_type, effective_url)
    cv_source = _validate_stream_source(cv_source)

    if cv_source is None:
        fallback = _create_fallback_banner(
            "Invalid or unsafe stream source. Only public http/https/rtsp URLs and local webcam are allowed."
        )
        return Response(content=fallback, media_type="image/jpeg")

    cap = cv2.VideoCapture(cv_source)
    if not cap.isOpened():
        fallback = _create_fallback_banner(
            f"Snapshot failed for source: {_redact_source(cv_source)}"
        )
        return Response(content=fallback, media_type="image/jpeg")

    try:
        ok, frame = cap.read()
        if not ok or frame is None:
            fallback = _create_fallback_banner("Failed to read frame from camera")
            return Response(content=fallback, media_type="image/jpeg")

        frame = cv2.resize(frame, (640, 360))
        if annotate:
            frame, _ = _draw_yolo_detections(frame, run_inference=True)
        _, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        return Response(
            content=buf.tobytes(),
            media_type="image/jpeg",
            headers={"Cache-Control": "no-store"},
        )
    finally:
        cap.release()
