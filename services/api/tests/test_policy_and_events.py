import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from services.api.app.main import app
from services.api.app.database import get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_test_data():
    """
    This suite writes directly into the shared demo database (test-cam-01
    candidate events and simulator actions). Purge them after every test so
    repeated pytest runs stay deterministic and leave no debris behind.
    """
    yield
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM actions
            WHERE incident_id = 'test-incident-demo'
               OR incident_id NOT IN (SELECT id FROM incidents)
        """)
        cursor.execute("DELETE FROM feedback WHERE incident_id = 'test-incident-demo'")
        cursor.execute("DELETE FROM incidents WHERE camera_id = 'test-cam-01'")
        conn.commit()
    finally:
        conn.close()


def test_candidate_event_lifecycle():
    event_payload = {
        "event_id": str(uuid.uuid4()),
        "camera_id": "test-cam-01",
        "event_type": "restricted_zone_entry",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "source": "sample",
        "detector": {
            "name": "yolov8n",
            "version": "8.0.0",
            "confidence": 0.88,
            "bounding_box": {"x_min": 0.3, "y_min": 0.4, "x_max": 0.5, "y_max": 0.8}
        }
    }

    response = client.post("/api/v1/events/candidates", json=event_payload)
    assert response.status_code == 201
    data = response.json()
    assert "incident_id" in data
    assert data["verifier_decision"] == "confirmed"
    assert data["status"] in ["action_sent", "confirmed"]

def test_action_test_endpoint():
    payload = {
        "action_type": "whatsapp_message",
        "recipient_phone": "+919876543210",
        "message": "Automated verification test"
    }
    response = client.post("/api/v1/actions/test", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["status"] in ["sent", "delivered"]
    assert "idempotency_key" in res

