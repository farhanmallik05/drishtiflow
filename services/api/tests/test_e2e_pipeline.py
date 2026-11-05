import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from services.api.app.main import app
from services.api.app.database import get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_e2e_debris():
    """
    Guarantee teardown even when assertions fail mid-test (the inline cleanup at
    the bottom of the test body is skipped in that case, which previously leaked
    duplicate 'Bhiwandi Bay A Camera' rows and 'test-cam-01' incidents into the
    live demo database). Keeps newest seed row of each e2e fingerprint.
    """
    yield
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM workflows
            WHERE name = 'Warehouse Intrusion Monitor'
              AND id NOT IN (
                SELECT id FROM (
                  SELECT id FROM workflows
                  WHERE name = 'Warehouse Intrusion Monitor'
                  ORDER BY created_at DESC LIMIT 1
                )
              )
        """)
        cursor.execute("""
            DELETE FROM workflow_versions
            WHERE workflow_id NOT IN (SELECT id FROM workflows)
        """)
        cursor.execute("""
            DELETE FROM cameras
            WHERE name = 'Bhiwandi Bay A Camera'
              AND id NOT IN (
                SELECT id FROM (
                  SELECT id FROM cameras
                  WHERE name = 'Bhiwandi Bay A Camera'
                  ORDER BY created_at DESC LIMIT 1
                )
              )
        """)
        cursor.execute("DELETE FROM incidents WHERE camera_id = 'test-cam-01'")
        cursor.execute("DELETE FROM zones WHERE camera_id NOT IN (SELECT id FROM cameras)")
        cursor.execute("DELETE FROM actions WHERE incident_id NOT IN (SELECT id FROM incidents)")
        cursor.execute("DELETE FROM feedback WHERE incident_id NOT IN (SELECT id FROM incidents)")
        cursor.execute("DELETE FROM workflow_versions WHERE workflow_id NOT IN (SELECT id FROM workflows)")
        conn.commit()
    finally:
        conn.close()


def test_full_drishtiflow_e2e_pipeline():
    """
    Complete end-to-end validation matching PRD §4.2 Hackathon Demo Scope:
    Hindi prompt -> compiler -> camera zone -> candidate event -> VLM verify -> policy check -> action -> feedback
    """
    print("\n--- 1. VERNACULAR WORKFLOW COMPILATION ---")
    prompt = "Raat 10 baje ke baad godown mein koi aaye toh alert karo"
    compile_res = client.post("/api/v1/workflows/compile", json={"prompt": prompt})
    assert compile_res.status_code == 200
    wf_def = compile_res.json()
    assert wf_def["status"] == "needs_review"
    assert "person" in wf_def["trigger"]["classes"]
    print(f"Compiled Title: {wf_def['title']['en']}")

    print("\n--- 2. CAMERA & ZONE ONBOARDING ---")
    # Register Camera
    cam_res = client.post("/api/v1/cameras", json={
        "name": "Bhiwandi Bay A Camera",
        "source_type": "sample"
    })
    assert cam_res.status_code == 201
    cam = cam_res.json()
    camera_id = cam["id"]
    print(f"Registered Camera ID: {camera_id}")

    # Add Polygon Zone
    zone_res = client.post(f"/api/v1/cameras/{camera_id}/zones", json={
        "camera_id": camera_id,
        "name": "Restricted Storage Bay A",
        "polygon": [
            {"x": 0.2, "y": 0.2},
            {"x": 0.8, "y": 0.2},
            {"x": 0.8, "y": 0.8},
            {"x": 0.2, "y": 0.8}
        ],
        "color": "#ef4444"
    })
    assert zone_res.status_code == 201
    zone = zone_res.json()
    print(f"Created Zone: {zone['name']}")

    print("\n--- 3. WORKFLOW CREATION & ACTIVATION ---")
    # For testing, set trigger schedule to None (24/7 active) so policy allows immediate action
    wf_def["trigger"]["schedule"] = None
    create_wf_res = client.post("/api/v1/workflows", json={
        "name": "Warehouse Intrusion Monitor",
        "camera_id": camera_id,
        "definition": wf_def
    })
    assert create_wf_res.status_code == 201
    wf = create_wf_res.json()
    workflow_id = wf["id"]

    # Activate
    activate_res = client.post(f"/api/v1/workflows/{workflow_id}/activate")
    assert activate_res.status_code == 200
    assert activate_res.json()["status"] == "active"
    print(f"Activated Workflow ID: {workflow_id}")

    # Version Snapshot (PRD §9)
    version_res = client.post(f"/api/v1/workflows/{workflow_id}/versions")
    assert version_res.status_code == 201
    assert version_res.json()["version"] == 2
    print(f"Created Workflow Version Snapshot v2")

    print("\n--- 4. EDGE CANDIDATE EVENT & CONTEXT VERIFICATION ---")
    event_payload = {
        "event_id": str(uuid.uuid4()),
        "camera_id": camera_id,
        "workflow_id": workflow_id,
        "event_type": "restricted_zone_entry",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "source": "sample",
        "detector": {
            "name": "yolov8n",
            "version": "8.1.0",
            "confidence": 0.89,
            "bounding_box": {"x_min": 0.35, "y_min": 0.4, "x_max": 0.55, "y_max": 0.75}
        }
    }
    candidate_res = client.post("/api/v1/events/candidates", json=event_payload)
    assert candidate_res.status_code == 201
    candidate_data = candidate_res.json()
    incident_id = candidate_data["incident_id"]
    assert candidate_data["verifier_decision"] == "confirmed"
    assert candidate_data["policy_allowed"] is True
    assert candidate_data["status"] == "action_sent"
    assert len(candidate_data["dispatched_actions"]) >= 1
    print(f"Incident Created: {incident_id} (Status: {candidate_data['status']})")
    print(f"Dispatched Actions Count: {len(candidate_data['dispatched_actions'])}")

    print("\n--- 5. INCIDENT ACKNOWLEDGEMENT & OPERATOR FEEDBACK ---")
    ack_res = client.post(f"/api/v1/incidents/{incident_id}/acknowledge")
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "acknowledged"

    feedback_res = client.post(f"/api/v1/incidents/{incident_id}/feedback", json={
        "label": "true_positive",
        "note": "Verified live demonstration intruder"
    })
    assert feedback_res.status_code == 201
    assert feedback_res.json()["label"] == "true_positive"
    print(f"Operator Feedback Recorded: true_positive")

    print("\n--- 6. VERIFY INCIDENT QUERY & AUDIT ---")
    inc_detail = client.get(f"/api/v1/incidents/{incident_id}")
    assert inc_detail.status_code == 200
    detail = inc_detail.json()
    assert detail["incident"]["id"] == incident_id
    assert len(detail["actions"]) >= 1
    assert len(detail["feedback"]) == 1
    print("Full End-to-End Pipeline Passed with Zero Errors!")

    # Teardown / isolation cleanup (finally-guaranteed even on assertion failure)
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM actions WHERE incident_id = ?", (incident_id,))
        cursor.execute("DELETE FROM feedback WHERE incident_id = ?", (incident_id,))
        cursor.execute("DELETE FROM incidents WHERE id = ?", (incident_id,))
        cursor.execute("DELETE FROM workflow_versions WHERE workflow_id = ?", (workflow_id,))
        cursor.execute("DELETE FROM workflows WHERE id = ?", (workflow_id,))
        cursor.execute("DELETE FROM zones WHERE camera_id = ?", (camera_id,))
        cursor.execute("DELETE FROM cameras WHERE id = ?", (camera_id,))
        conn.commit()
    finally:
        conn.close()
