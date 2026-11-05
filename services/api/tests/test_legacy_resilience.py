"""
Regression tests for legacy-row resilience of list endpoints.

Root cause (found during live API smoke testing on 2026-11-04):
- Rows left in the shared demo database by an older stress-test naming scheme
  (`inc-stress-*` with detector_confidence=NULL, `cam-test-*` with status='active')
  caused GET /api/v1/incidents and GET /api/v1/cameras to raise Pydantic
  ValidationError -> HTTP 500 for the entire collection, poisoning the demo.

Fix: IncidentResponse.detector_confidence is Optional[float]; CameraResponse.status
is a plain str so out-of-enum values degrade safely instead of 500-ing the list.
These tests simulate exactly such legacy rows and assert the endpoints return 200.
"""
import pytest
from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.app.database import get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_legacy_rows():
    yield
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM incidents WHERE id LIKE 'legacy-resil-%'")
        cursor.execute("DELETE FROM cameras WHERE id LIKE 'legacy-resil-%'")
        cursor.execute("DELETE FROM zones WHERE camera_id LIKE 'legacy-resil-%'")
        conn.commit()
    finally:
        conn.close()


def _seed_legacy_rows():
    """Insert rows with exactly the out-of-schema values that broke the API."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO cameras (id, organization_id, site_id, name, source_type, status, created_at)
            VALUES ('legacy-resil-cam', 'test-org', 'test-site', 'Legacy Cam', 'sample', 'active', '2026-01-01T00:00:00')
            """
        )
        cursor.execute(
            """
            INSERT INTO incidents (
                id, organization_id, site_id, camera_id, event_type, status,
                detector_confidence, verifier_confidence, reason, occurred_at, created_at
            ) VALUES (
                'legacy-resil-inc', 'test-org', 'test-site', 'legacy-resil-cam',
                'restricted_zone_entry', 'action_sent', NULL, NULL, 'Legacy seed',
                '2026-01-01T00:00:00', '2026-01-01T00:00:00'
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def test_incidents_list_tolerates_legacy_null_detector_confidence():
    """A NULL detector_confidence row must not 500 the whole incidents list."""
    _seed_legacy_rows()
    res = client.get("/api/v1/incidents")
    assert res.status_code == 200, res.text
    ids = [i["id"] for i in res.json()]
    assert "legacy-resil-inc" in ids
    row = next(i for i in res.json() if i["id"] == "legacy-resil-inc")
    assert row["detector_confidence"] is None


def test_cameras_list_tolerates_legacy_out_of_enum_status():
    """A camera with status='active' (out of enum) must not 500 the camera list."""
    _seed_legacy_rows()
    res = client.get("/api/v1/cameras")
    assert res.status_code == 200, res.text
    ids = [c["id"] for c in res.json()]
    assert "legacy-resil-cam" in ids
    row = next(c for c in res.json() if c["id"] == "legacy-resil-cam")
    assert row["status"] == "active"
