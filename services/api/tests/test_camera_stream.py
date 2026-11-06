"""Live camera streaming and snapshot endpoint contracts.

These tests use a local MP4 fixture instead of a real RTSP camera so they run
offline in CI. They assert framing and plumbing, not detection accuracy.
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.app.routers.cameras import (
    _mjpeg_stream_generator,
    _redact_source,
    _resolve_cv_source,
    _validate_stream_source,
)

client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
SAMPLE_VIDEO = REPO_ROOT / "services" / "edge-agent" / "assets" / "videos" / "cctv_intrusion_1.mp4"


def test_stream_unknown_camera_returns_404():
    response = client.get("/api/v1/cameras/does-not-exist/stream")
    assert response.status_code == 404


def test_snapshot_unknown_camera_returns_404():
    response = client.get("/api/v1/cameras/does-not-exist/snapshot")
    assert response.status_code == 404


@pytest.mark.skipif(not SAMPLE_VIDEO.exists(), reason="Sample MP4 fixture is not present")
def test_snapshot_returns_jpeg_for_local_video():
    response = client.get(
        "/api/v1/cameras/any-camera/snapshot",
        params={"stream_url": str(SAMPLE_VIDEO), "annotate": "false"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    # JPEG magic bytes
    assert response.content[:2] == b"\xff\xd8"
    assert len(response.content) > 1000


@pytest.mark.skipif(not SAMPLE_VIDEO.exists(), reason="Sample MP4 fixture is not present")
def test_mjpeg_generator_emits_multipart_frames():
    generator = _mjpeg_stream_generator(str(SAMPLE_VIDEO), annotate=False)
    try:
        chunk = next(generator)
    finally:
        generator.close()

    assert chunk.startswith(b"--frame\r\n")
    assert b"Content-Type: image/jpeg" in chunk.split(b"\r\n\r\n")[0]
    assert b"\xff\xd8" in chunk


@pytest.mark.parametrize(
    "source_type,stream_url,expected",
    [
        ("sample", None, None),
        ("sample", "", None),
        ("webcam", None, 0),
        ("rtsp", "rtsp://cam.local/stream", "rtsp://cam.local/stream"),
        ("rtsp", "0", 0),
        ("http", "http://10.0.0.5:8080/video", "http://10.0.0.5:8080/video"),
    ],
)
def test_resolve_cv_source(source_type, stream_url, expected):
    assert _resolve_cv_source(source_type, stream_url) == expected


def test_sample_camera_without_source_never_opens_server_webcam():
    """A sample camera must not silently capture the API host's own webcam."""
    assert _resolve_cv_source("sample", None) is None


@pytest.mark.parametrize(
    "source,expected",
    [
        ("rtsp://admin:s3cret@10.0.0.5:554/stream", "rtsp://10.0.0.5:554/stream"),
        ("rtsp://10.0.0.5:554/stream", "rtsp://10.0.0.5:554/stream"),
        ("http://user@camera.local/video", "http://camera.local/video"),
        (0, "0"),
    ],
)
def test_redact_source_strips_credentials(source, expected):
    """Fallback frames are served unauthenticated, so they must never echo RTSP passwords."""
    assert _redact_source(source) == expected


@pytest.mark.parametrize(
    "source,expected",
    [
        # Allowed: public HTTP/HTTPS/RTSP
        ("http://1.1.1.1:554/stream", "http://1.1.1.1:554/stream"),
        ("https://camera.example.com/video", "https://camera.example.com/video"),
        ("rtsp://8.8.8.8:554/stream", "rtsp://8.8.8.8:554/stream"),
        # Allowed: local webcam device index
        (0, 0),
        # Rejected: loopback
        ("http://127.0.0.1:8000/", None),
        ("http://localhost:8000/", "http://localhost:8000/"),
        # Rejected: private RFC1918
        ("http://10.0.0.5:8080/video", None),
        ("http://192.168.1.50:554/stream", None),
        ("http://172.16.0.1/", None),
        # Rejected: link-local / cloud metadata
        ("http://169.254.169.254/latest/meta-data/", None),
        # Rejected: unsupported scheme (file, ftp, etc.)
        ("file:///etc/passwd", None),
        ("ftp://internal.host/", None),
        # Rejected: multicast / reserved / unspecified
        ("http://224.0.0.1/", None),
        ("http://0.0.0.0/", None),
        # None passes through
        (None, None),
    ],
)
def test_validate_stream_source_blocks_ssrf(source, expected):
    """_validate_stream_source must refuse loopback/private/metadata/internal sources."""
    assert _validate_stream_source(source) == expected
