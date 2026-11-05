import uuid
import json
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.app.database import get_db
import sys
import os

EDGE_AGENT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../services/edge-agent"))
if EDGE_AGENT_PATH not in sys.path:
    sys.path.insert(0, EDGE_AGENT_PATH)

from inference.detector import EdgeDetector, is_point_in_polygon

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_artifacts():
    """Ensure any test rows created during test runs are cleanly wiped."""
    created_workflows = []
    created_cameras = []
    created_incidents = []
    yield {
        "workflows": created_workflows,
        "cameras": created_cameras,
        "incidents": created_incidents,
    }
    conn = get_db()
    cursor = conn.cursor()
    try:
        for inc_id in created_incidents:
            cursor.execute("DELETE FROM actions WHERE incident_id = ?", (inc_id,))
            cursor.execute("DELETE FROM feedback WHERE incident_id = ?", (inc_id,))
            cursor.execute("DELETE FROM incidents WHERE id = ?", (inc_id,))
        for wf_id in created_workflows:
            cursor.execute("DELETE FROM workflow_versions WHERE workflow_id = ?", (wf_id,))
            cursor.execute("DELETE FROM workflows WHERE id = ?", (wf_id,))
        for cam_id in created_cameras:
            cursor.execute("DELETE FROM zones WHERE camera_id = ?", (cam_id,))
            cursor.execute("DELETE FROM cameras WHERE id = ?", (cam_id,))
        conn.commit()
    finally:
        conn.close()


# ==============================================================================
# Challenge Vector 1: POST /api/v1/workflows/{id}/activate boundary conditions
# ==============================================================================

def test_activate_nonexistent_workflow():
    """Attempting to activate a non-existent workflow must return HTTP 404."""
    fake_id = str(uuid.uuid4())
    res = client.post(f"/api/v1/workflows/{fake_id}/activate")
    assert res.status_code == 404
    assert "Workflow not found" in res.json()["detail"]


def test_activate_workflow_without_version_record(clean_test_artifacts):
    """Workflow exists in DB but has zero version records -> HTTP 400."""
    conn = get_db()
    cursor = conn.cursor()
    wf_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
    site = cursor.fetchone()
    cursor.execute(
        "INSERT INTO workflows (id, organization_id, site_id, name, active_version, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 'Orphan Workflow', 1, 'draft', ?, ?)",
        (wf_id, site["organization_id"], site["id"], now, now)
    )
    conn.commit()
    conn.close()
    clean_test_artifacts["workflows"].append(wf_id)

    res = client.post(f"/api/v1/workflows/{wf_id}/activate")
    assert res.status_code == 400
    assert "no version definition found" in res.json()["detail"]


def test_activate_workflow_with_malformed_json_definition(clean_test_artifacts):
    """Workflow version definition has unparseable JSON -> HTTP 400."""
    conn = get_db()
    cursor = conn.cursor()
    wf_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
    site = cursor.fetchone()
    cursor.execute(
        "INSERT INTO workflows (id, organization_id, site_id, name, active_version, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 'Malformed JSON Workflow', 1, 'draft', ?, ?)",
        (wf_id, site["organization_id"], site["id"], now, now)
    )
    cursor.execute(
        "INSERT INTO workflow_versions (id, workflow_id, version, schema_version, definition, created_at) "
        "VALUES (?, ?, 1, '1.0', '{corrupted_json: true,', ?)",
        (str(uuid.uuid4()), wf_id, now)
    )
    conn.commit()
    conn.close()
    clean_test_artifacts["workflows"].append(wf_id)

    res = client.post(f"/api/v1/workflows/{wf_id}/activate")
    assert res.status_code == 400
    assert "invalid definition" in res.json()["detail"]


def test_activate_workflow_missing_trigger(clean_test_artifacts):
    """Workflow version definition has no trigger -> HTTP 400."""
    conn = get_db()
    cursor = conn.cursor()
    wf_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
    site = cursor.fetchone()
    cursor.execute(
        "INSERT INTO workflows (id, organization_id, site_id, name, active_version, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 'No Trigger Workflow', 1, 'draft', ?, ?)",
        (wf_id, site["organization_id"], site["id"], now, now)
    )
    incomplete_def = {
        "schema_version": "1.0",
        "title": {"en": "Incomplete Trigger", "hi": "अपूर्ण ट्रिगर"},
        "source_text": "Incomplete rule without trigger",
        "status": "draft",
        "verification": {
            "type": "temporal_scene_check",
            "instruction": "Verify person in warehouse perimeter",
            "evidence_window_seconds": 2.0
        },
        "actions": [
            {"type": "dashboard_alert", "enabled": True}
        ]
    }
    cursor.execute(
        "INSERT INTO workflow_versions (id, workflow_id, version, schema_version, definition, created_at) "
        "VALUES (?, ?, 1, '1.0', ?, ?)",
        (str(uuid.uuid4()), wf_id, json.dumps(incomplete_def), now)
    )
    conn.commit()
    conn.close()
    clean_test_artifacts["workflows"].append(wf_id)

    res = client.post(f"/api/v1/workflows/{wf_id}/activate")
    assert res.status_code == 400
    assert "Cannot activate workflow" in res.json()["detail"]


def test_activate_workflow_empty_actions(clean_test_artifacts):
    """Workflow version definition has empty actions list -> HTTP 400."""
    conn = get_db()
    cursor = conn.cursor()
    wf_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
    site = cursor.fetchone()
    cursor.execute(
        "INSERT INTO workflows (id, organization_id, site_id, name, active_version, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 'No Actions Workflow', 1, 'draft', ?, ?)",
        (wf_id, site["organization_id"], site["id"], now, now)
    )
    incomplete_def = {
        "schema_version": "1.0",
        "title": {"en": "Empty Actions", "hi": "खाली क्रियाएं"},
        "source_text": "Incomplete rule without actions",
        "status": "draft",
        "trigger": {
            "type": "object_in_zone",
            "classes": ["person"],
            "minimum_confidence": 0.55,
            "dwell_seconds": 1.5
        },
        "verification": {
            "type": "temporal_scene_check",
            "instruction": "Verify person in warehouse perimeter",
            "evidence_window_seconds": 2.0
        },
        "actions": []
    }
    cursor.execute(
        "INSERT INTO workflow_versions (id, workflow_id, version, schema_version, definition, created_at) "
        "VALUES (?, ?, 1, '1.0', ?, ?)",
        (str(uuid.uuid4()), wf_id, json.dumps(incomplete_def), now)
    )
    conn.commit()
    conn.close()
    clean_test_artifacts["workflows"].append(wf_id)

    res = client.post(f"/api/v1/workflows/{wf_id}/activate")
    assert res.status_code == 400
    assert "Cannot activate workflow" in res.json()["detail"]


def test_activate_workflow_all_actions_disabled(clean_test_artifacts):
    """Workflow has actions, but every action is disabled (enabled=False) -> HTTP 400."""
    conn = get_db()
    cursor = conn.cursor()
    wf_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
    site = cursor.fetchone()
    cursor.execute(
        "INSERT INTO workflows (id, organization_id, site_id, name, active_version, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 'Disabled Actions Workflow', 1, 'draft', ?, ?)",
        (wf_id, site["organization_id"], site["id"], now, now)
    )
    disabled_def = {
        "schema_version": "1.0",
        "title": {"en": "Disabled Actions", "hi": "अक्षम क्रियाएं"},
        "source_text": "Rule with only disabled actions",
        "status": "draft",
        "trigger": {
            "type": "object_in_zone",
            "classes": ["person"],
            "minimum_confidence": 0.55,
            "dwell_seconds": 1.5
        },
        "verification": {
            "type": "temporal_scene_check",
            "instruction": "Verify person in warehouse perimeter",
            "evidence_window_seconds": 2.0
        },
        "actions": [
            {"type": "dashboard_alert", "enabled": False},
            {"type": "whatsapp_message", "enabled": False}
        ]
    }
    cursor.execute(
        "INSERT INTO workflow_versions (id, workflow_id, version, schema_version, definition, created_at) "
        "VALUES (?, ?, 1, '1.0', ?, ?)",
        (str(uuid.uuid4()), wf_id, json.dumps(disabled_def), now)
    )
    conn.commit()
    conn.close()
    clean_test_artifacts["workflows"].append(wf_id)

    res = client.post(f"/api/v1/workflows/{wf_id}/activate")
    assert res.status_code == 400
    assert "at least one action must be enabled" in res.json()["detail"]


def test_activate_valid_workflow_success(clean_test_artifacts):
    """Complete and valid workflow activates successfully with status 'active' -> HTTP 200."""
    compile_res = client.post("/api/v1/workflows/compile", json={"prompt": "Alert if person detected"})
    assert compile_res.status_code == 200
    wf_def = compile_res.json()

    create_res = client.post("/api/v1/workflows", json={
        "name": "Valid Activation Workflow",
        "definition": wf_def
    })
    assert create_res.status_code == 201
    wf_id = create_res.json()["id"]
    clean_test_artifacts["workflows"].append(wf_id)

    act_res = client.post(f"/api/v1/workflows/{wf_id}/activate")
    assert act_res.status_code == 200
    assert act_res.json()["status"] == "active"
    assert act_res.json()["id"] == wf_id


# ==============================================================================
# Challenge Vector 2: POST /api/v1/workflows/{id}/versions version increments
# ==============================================================================

def test_version_creation_nonexistent_workflow():
    """Attempting to snapshot a version for non-existent workflow -> HTTP 404."""
    fake_id = str(uuid.uuid4())
    res = client.post(f"/api/v1/workflows/{fake_id}/versions")
    assert res.status_code == 404
    assert "Workflow not found" in res.json()["detail"]


def test_version_increments_monotonic(clean_test_artifacts):
    """Test sequential version snapshot increments (1 -> 2 -> 3) using base copy."""
    compile_res = client.post("/api/v1/workflows/compile", json={"prompt": "Alert if person detected"})
    wf_def = compile_res.json()

    create_res = client.post("/api/v1/workflows", json={
        "name": "Version Test Workflow",
        "definition": wf_def
    })
    assert create_res.status_code == 201
    wf_id = create_res.json()["id"]
    clean_test_artifacts["workflows"].append(wf_id)
    assert create_res.json()["version"] == 1

    # First version snapshot: creates v2
    v2_res = client.post(f"/api/v1/workflows/{wf_id}/versions")
    assert v2_res.status_code == 201
    assert v2_res.json()["version"] == 2
    assert v2_res.json()["workflow_id"] == wf_id

    # Second version snapshot: creates v3
    v3_res = client.post(f"/api/v1/workflows/{wf_id}/versions")
    assert v3_res.status_code == 201
    assert v3_res.json()["version"] == 3

    # Check database persistence
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT version FROM workflow_versions WHERE workflow_id = ? ORDER BY version ASC", (wf_id,))
    versions = [row["version"] for row in cursor.fetchall()]
    conn.close()
    assert versions == [1, 2, 3]


def test_version_custom_definition_payload(clean_test_artifacts):
    """Test version creation with custom definition payload (wrapped and direct)."""
    compile_res = client.post("/api/v1/workflows/compile", json={"prompt": "Alert if person detected"})
    wf_def = compile_res.json()

    create_res = client.post("/api/v1/workflows", json={
        "name": "Custom Version Workflow",
        "definition": wf_def
    })
    wf_id = create_res.json()["id"]
    clean_test_artifacts["workflows"].append(wf_id)

    # Custom version via {"definition": ...}
    custom_def = dict(wf_def)
    custom_def["source_text"] = "Custom updated rule prompt"
    custom_def["trigger"]["dwell_seconds"] = 5.0
    v2_res = client.post(f"/api/v1/workflows/{wf_id}/versions", json={"definition": custom_def})
    assert v2_res.status_code == 201
    assert v2_res.json()["version"] == 2

    # Custom version directly at root {"trigger": ..., "actions": ...}
    direct_custom = dict(wf_def)
    direct_custom["source_text"] = "Direct root payload"
    direct_custom["trigger"]["dwell_seconds"] = 10.0
    v3_res = client.post(f"/api/v1/workflows/{wf_id}/versions", json=direct_custom)
    assert v3_res.status_code == 201
    assert v3_res.json()["version"] == 3

    # Verify contents of v2 and v3 in DB
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT version, definition FROM workflow_versions WHERE workflow_id = ? AND version = 2", (wf_id,))
    v2_row = cursor.fetchone()
    v2_data = json.loads(v2_row["definition"])
    assert v2_data["trigger"]["dwell_seconds"] == 5.0

    cursor.execute("SELECT version, definition FROM workflow_versions WHERE workflow_id = ? AND version = 3", (wf_id,))
    v3_row = cursor.fetchone()
    v3_data = json.loads(v3_row["definition"])
    assert v3_data["trigger"]["dwell_seconds"] == 10.0
    conn.close()


def test_version_creation_invalid_payload_rejected(clean_test_artifacts):
    """Submitting an invalid custom definition must return HTTP 400 and not increment version."""
    compile_res = client.post("/api/v1/workflows/compile", json={"prompt": "Alert if person detected"})
    create_res = client.post("/api/v1/workflows", json={
        "name": "Invalid Version Test",
        "definition": compile_res.json()
    })
    wf_id = create_res.json()["id"]
    clean_test_artifacts["workflows"].append(wf_id)

    bad_payload = {"definition": {"invalid_key": "not a valid workflow"}}
    res = client.post(f"/api/v1/workflows/{wf_id}/versions", json=bad_payload)
    assert res.status_code == 400
    assert "Invalid workflow definition" in res.json()["detail"]

    # Ensure max version is still 1
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(version) as max_v FROM workflow_versions WHERE workflow_id = ?", (wf_id,))
    assert cursor.fetchone()["max_v"] == 1
    conn.close()


# ==============================================================================
# Challenge Vector 3: Candidate Event Edge Cases (API & Geometry)
# ==============================================================================

def test_candidate_event_zero_bounding_box(clean_test_artifacts):
    """Candidate event with zero bounding box (0, 0, 0, 0) must be handled gracefully."""
    event_payload = {
        "event_id": str(uuid.uuid4()),
        "camera_id": "test-cam-zero-bbox",
        "event_type": "restricted_zone_entry",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "source": "sample",
        "detector": {
            "name": "yolov8n",
            "version": "8.0.0",
            "confidence": 0.88,
            "bounding_box": {"x_min": 0.0, "y_min": 0.0, "x_max": 0.0, "y_max": 0.0}
        }
    }
    res = client.post("/api/v1/events/candidates", json=event_payload)
    assert res.status_code == 201
    data = res.json()
    assert "incident_id" in data
    clean_test_artifacts["incidents"].append(data["incident_id"])


def test_candidate_event_omitted_bounding_box(clean_test_artifacts):
    """Candidate event without bounding box (Optional/None) must be ingested cleanly."""
    event_payload = {
        "event_id": str(uuid.uuid4()),
        "camera_id": "test-cam-null-bbox",
        "event_type": "restricted_zone_entry",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "source": "sample",
        "detector": {
            "name": "yolov8n",
            "version": "8.0.0",
            "confidence": 0.91,
            "bounding_box": None
        }
    }
    res = client.post("/api/v1/events/candidates", json=event_payload)
    assert res.status_code == 201
    data = res.json()
    assert "incident_id" in data
    clean_test_artifacts["incidents"].append(data["incident_id"])


def test_candidate_event_boundary_coordinates(clean_test_artifacts):
    """Candidate event with extreme/boundary coordinates (0.0, 1.0) must ingest cleanly."""
    event_payload = {
        "event_id": str(uuid.uuid4()),
        "camera_id": "test-cam-boundary-coords",
        "event_type": "restricted_zone_entry",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "source": "sample",
        "detector": {
            "name": "yolov8n",
            "version": "8.0.0",
            "confidence": 0.95,
            "bounding_box": {"x_min": 0.0, "y_min": 0.0, "x_max": 1.0, "y_max": 1.0}
        }
    }
    res = client.post("/api/v1/events/candidates", json=event_payload)
    assert res.status_code == 201
    data = res.json()
    assert "incident_id" in data
    clean_test_artifacts["incidents"].append(data["incident_id"])


def test_ray_casting_and_zone_detector_edge_cases():
    """Directly stress-test geometry ray-casting with edge cases:
    - zero bbox
    - empty bbox
    - degenerate polygon (<3 vertices)
    - colinear points
    - boundary & vertex intersection
    - outside coordinates
    """
    polygon = [(0.2, 0.2), (0.8, 0.2), (0.8, 0.8), (0.2, 0.8)]
    detector = EdgeDetector(confidence_threshold=0.55)

    # 1. Zero bounding box
    zero_det = [{
        "class": "person",
        "confidence": 0.90,
        "bounding_box": {"x_min": 0.0, "y_min": 0.0, "x_max": 0.0, "y_max": 0.0}
    }]
    # Feet point (0, 0) is outside the polygon [0.2, 0.8]
    assert detector.evaluate_detections_in_zone(zero_det, polygon) == []

    # 2. Empty bounding box dictionary
    empty_det = [{
        "class": "person",
        "confidence": 0.90,
        "bounding_box": {}
    }]
    # Fallback feet point (0, 0) should not crash
    assert detector.evaluate_detections_in_zone(empty_det, polygon) == []

    # 3. Missing bounding box key
    missing_det = [{
        "class": "person",
        "confidence": 0.90
    }]
    assert detector.evaluate_detections_in_zone(missing_det, polygon) == []

    # 4. Zero-area bounding box centered inside polygon
    zero_area_inside = [{
        "class": "person",
        "confidence": 0.85,
        "bounding_box": {"x_min": 0.5, "y_min": 0.5, "x_max": 0.5, "y_max": 0.5}
    }]
    # Feet point (0.5, 0.5) is inside the polygon
    breaches = detector.evaluate_detections_in_zone(zero_area_inside, polygon)
    assert len(breaches) == 1
    assert breaches[0]["confidence"] == 0.85

    # 5. Degenerate polygons (< 3 points)
    assert is_point_in_polygon((0.5, 0.5), []) is False
    assert is_point_in_polygon((0.5, 0.5), [(0.5, 0.5)]) is False
    assert is_point_in_polygon((0.5, 0.5), [(0.2, 0.2), (0.8, 0.8)]) is False

    # 6. Colinear 3-point polygon (flat line, zero area)
    colinear_poly = [(0.2, 0.2), (0.5, 0.5), (0.8, 0.8)]
    # Ray casting on zero-area line must not crash
    result = is_point_in_polygon((0.5, 0.5), colinear_poly)
    assert isinstance(result, bool)

    # 7. Extreme coordinates
    assert is_point_in_polygon((-10.0, -10.0), polygon) is False
    assert is_point_in_polygon((10.0, 10.0), polygon) is False

    # 8. Epsilon inside vs outside boundaries
    assert is_point_in_polygon((0.5, 0.5), polygon) is True
    assert is_point_in_polygon((0.201, 0.5), polygon) is True
    assert is_point_in_polygon((0.199, 0.5), polygon) is False
    assert is_point_in_polygon((0.799, 0.5), polygon) is True
    assert is_point_in_polygon((0.801, 0.5), polygon) is False
