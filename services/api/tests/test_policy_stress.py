import uuid
import time
import json
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.app.database import get_db
from services.api.app.services.policy import PolicyEngine
from services.api.app.schemas.verification import VerificationResult
from services.api.app.schemas.workflow import (
    WorkflowDefinition,
    TriggerConfig,
    VerificationConfig,
    SafetyConfig,
    ActionItem
)

client = TestClient(app)

def _cleanup_db():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM actions WHERE incident_id IN (
                SELECT id FROM incidents WHERE camera_id LIKE 'stress-%'
            ) OR idempotency_key LIKE 'stress-%'
        """)
        cursor.execute("DELETE FROM incidents WHERE camera_id LIKE 'stress-%' OR id LIKE 'stress-%'")
        cursor.execute("DELETE FROM workflow_versions WHERE workflow_id LIKE 'stress-%'")
        cursor.execute("DELETE FROM workflows WHERE id LIKE 'stress-%' OR camera_id LIKE 'stress-%'")
        cursor.execute("DELETE FROM zones WHERE camera_id LIKE 'stress-%'")
        cursor.execute("DELETE FROM cameras WHERE id LIKE 'stress-%'")
        conn.commit()
    finally:
        conn.close()

@pytest.fixture(autouse=True)
def clean_stress_test_data():
    """Ensure clean database state before and after stress tests."""
    _cleanup_db()
    yield
    _cleanup_db()


def _create_mock_verification(decision: str = "confirmed", confidence: float = 0.92) -> VerificationResult:
    return VerificationResult(
        decision=decision,
        event_type="restricted_zone_entry",
        confidence=confidence,
        evidence_summary="Empirical stress test subject in restricted zone",
        requires_human_review=False,
        model_provider="mock_heuristic",
        model_version="1.0"
    )


def _seed_camera(camera_id: str, name: str = "Stress Test Camera"):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, organization_id, site_id FROM cameras LIMIT 1")
        sample = cursor.fetchone()
        org_id = sample["organization_id"]
        site_id = sample["site_id"]
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            """
            INSERT OR REPLACE INTO cameras (id, organization_id, site_id, name, source_type, status, created_at)
            VALUES (?, ?, ?, ?, 'sample', 'online', ?)
            """,
            (camera_id, org_id, site_id, name, now)
        )
        conn.commit()
    finally:
        conn.close()


def _seed_incident_and_action(camera_id: str, incident_id: str, action_id: str, occurred_at: str, action_created_at: str, action_status: str = "sent"):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, organization_id, site_id FROM cameras WHERE id = ?", (camera_id,))
        cam = cursor.fetchone()
        org_id = cam["organization_id"] if cam else "test-org"
        site_id = cam["site_id"] if cam else "test-site"

        cursor.execute(
            """
            INSERT INTO incidents (
                id, organization_id, site_id, camera_id, event_type, status,
                detector_confidence, verifier_confidence, reason, occurred_at, created_at
            ) VALUES (?, ?, ?, ?, 'restricted_zone_entry', 'action_sent', 0.9, 0.95, 'Stress seed', ?, ?)
            """,
            (incident_id, org_id, site_id, camera_id, occurred_at, occurred_at)
        )
        cursor.execute(
            """
            INSERT INTO actions (
                id, incident_id, action_type, status, idempotency_key, recipient_ref, attempts, created_at, updated_at
            ) VALUES (?, ?, 'dashboard_alert', ?, ?, '+919999999999', 1, ?, ?)
            """,
            (action_id, incident_id, action_status, f"stress-{action_id}", action_created_at, action_created_at)
        )
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Test Suite 1: Cooldown Suppression
# ---------------------------------------------------------------------------

def test_cooldown_rapid_sequential_events_suppressed():
    """Verify that rapid sequential events for the same camera are suppressed within cooldown window."""
    cam_a = "stress-cam-cooldown-a"
    _seed_camera(cam_a)

    verif = _create_mock_verification("confirmed")

    # Event 1 at T=0
    inc_1 = "stress-inc-cd-1"
    now_iso = datetime.now(timezone.utc).isoformat()
    # Direct evaluation before insertion
    allowed, reason, actions = PolicyEngine.evaluate(inc_1, cam_a, verif)
    assert allowed is True
    assert "Policy approved" in reason

    # Persist Event 1 as completed action
    _seed_incident_and_action(cam_a, inc_1, "stress-act-cd-1", now_iso, now_iso)

    # Event 2 immediately (0s delta)
    inc_2 = "stress-inc-cd-2"
    allowed2, reason2, actions2 = PolicyEngine.evaluate(inc_2, cam_a, verif)
    assert allowed2 is False
    assert "Suppressed by Cooldown" in reason2
    assert actions2 == []

    # Event 3 with another camera (Cam B) should NOT be suppressed by Cam A's cooldown
    cam_b = "stress-cam-cooldown-b"
    _seed_camera(cam_b)
    inc_3 = "stress-inc-cd-3"
    allowed3, reason3, actions3 = PolicyEngine.evaluate(inc_3, cam_b, verif)
    assert allowed3 is True
    assert "Policy approved" in reason3


def test_cooldown_expired_allows_subsequent_event():
    """Verify that after cooldown_seconds has elapsed, a new event is permitted."""
    cam = "stress-cam-cd-expired"
    _seed_camera(cam)

    verif = _create_mock_verification("confirmed")

    # Seed an incident from 65 seconds ago (default cooldown is 60s)
    past_iso = (datetime.now(timezone.utc) - timedelta(seconds=65)).isoformat()
    inc_past = "stress-inc-past"
    _seed_incident_and_action(cam, inc_past, "stress-act-past", past_iso, past_iso)

    # New event now
    inc_new = "stress-inc-now"
    allowed, reason, actions = PolicyEngine.evaluate(inc_new, cam, verif)
    assert allowed is True
    assert "Policy approved" in reason


def test_cooldown_unconfirmed_prior_incident_does_not_suppress():
    """Prior events with status 'not_confirmed' or 'uncertain' must not trigger cooldown."""
    cam = "stress-cam-unconfirmed"
    _seed_camera(cam)

    conn = get_db()
    try:
        cursor = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            """
            INSERT INTO incidents (
                id, organization_id, site_id, camera_id, event_type, status,
                detector_confidence, verifier_confidence, reason, occurred_at, created_at
            ) VALUES ('stress-inc-unconf', 'test-org', 'test-site', ?, 'restricted_zone_entry', 'not_confirmed', 0.5, 0.2, 'False positive', ?, ?)
            """,
            (cam, now_iso, now_iso)
        )
        conn.commit()
    finally:
        conn.close()

    verif = _create_mock_verification("confirmed")
    allowed, reason, _ = PolicyEngine.evaluate("stress-inc-new-eval", cam, verif)
    assert allowed is True


# ---------------------------------------------------------------------------
# Test Suite 2: Rate Limiting Per-Camera Scoping & Cross-Camera Isolation
# ---------------------------------------------------------------------------

def test_rate_limiting_per_camera_isolation():
    """
    Empirically verify:
    1. Exhausting Camera A's rate limit (5 actions/hour) blocks Camera A.
    2. Camera B's rate limit is completely unaffected (0/5 used).
    3. Actions for Camera A do not leak into Camera B's quota.
    """
    cam_a = "stress-cam-rate-a"
    cam_b = "stress-cam-rate-b"
    _seed_camera(cam_a, "Camera A")
    _seed_camera(cam_b, "Camera B")

    verif = _create_mock_verification("confirmed")

    # Seed 5 actions for Camera A within the last 30 minutes
    now = datetime.now(timezone.utc)
    for i in range(5):
        t_iso = (now - timedelta(minutes=30 - i * 5)).isoformat()
        _seed_incident_and_action(
            camera_id=cam_a,
            incident_id=f"stress-inc-a-{i}",
            action_id=f"stress-act-a-{i}",
            occurred_at=t_iso,
            action_created_at=t_iso,
            action_status="sent"
        )

    # 1. Camera A should now be BLOCKED by rate limit
    allowed_a, reason_a, _ = PolicyEngine.evaluate("stress-inc-a-test", cam_a, verif)
    assert allowed_a is False
    assert "Suppressed by Rate Limit: Reached 5/5 actions per hour" in reason_a

    # 2. Camera B must be ALLOWED (0 actions in last hour)
    allowed_b, reason_b, _ = PolicyEngine.evaluate("stress-inc-b-test", cam_b, verif)
    assert allowed_b is True
    assert "Policy approved" in reason_b

    # 3. Seed 4 actions for Camera B
    for i in range(4):
        t_iso = (now - timedelta(minutes=20 - i * 4)).isoformat()
        _seed_incident_and_action(
            camera_id=cam_b,
            incident_id=f"stress-inc-b-{i}",
            action_id=f"stress-act-b-{i}",
            occurred_at=t_iso,
            action_created_at=t_iso,
            action_status="delivered"
        )

    # Camera B (4 actions) should still be allowed
    allowed_b2, reason_b2, _ = PolicyEngine.evaluate("stress-inc-b-test2", cam_b, verif)
    assert allowed_b2 is True

    # Add 5th action for Camera B
    t_iso5 = (now - timedelta(minutes=1)).isoformat()
    _seed_incident_and_action(
        camera_id=cam_b,
        incident_id="stress-inc-b-4",
        action_id="stress-act-b-4",
        occurred_at=t_iso5,
        action_created_at=t_iso5,
        action_status="delivered"
    )

    # Now Camera B is also BLOCKED
    allowed_b3, reason_b3, _ = PolicyEngine.evaluate("stress-inc-b-test3", cam_b, verif)
    assert allowed_b3 is False
    assert "Suppressed by Rate Limit: Reached 5/5 actions per hour" in reason_b3

    # Camera A is still blocked
    allowed_a2, reason_a2, _ = PolicyEngine.evaluate("stress-inc-a-test2", cam_a, verif)
    assert allowed_a2 is False


def test_rate_limit_ignores_failed_or_queued_actions():
    """Verify that only 'sent' or 'delivered' actions count towards rate limit."""
    cam = "stress-cam-statuses"
    _seed_camera(cam)
    verif = _create_mock_verification("confirmed")

    now = datetime.now(timezone.utc)
    # Seed 5 failed actions and 5 queued actions
    for i in range(5):
        t_iso = (now - timedelta(minutes=10 + i)).isoformat()
        _seed_incident_and_action(cam, f"stress-inc-fail-{i}", f"stress-act-fail-{i}", t_iso, t_iso, action_status="failed")
        _seed_incident_and_action(cam, f"stress-inc-queue-{i}", f"stress-act-queue-{i}", t_iso, t_iso, action_status="queued")

    # Should NOT be rate limited
    allowed, reason, _ = PolicyEngine.evaluate("stress-inc-status-test", cam, verif)
    assert allowed is True


# ---------------------------------------------------------------------------
# Test Suite 3: True Expired Actions (>1 Hour) Boundary Testing
# ---------------------------------------------------------------------------

def test_expired_actions_do_not_block_new_actions():
    """
    Verify that actions strictly older than 1 hour (> 3600s) do not exhaust rate limit:
    - 61 minutes ago
    - 65 minutes ago
    - 90 minutes ago
    - 2 hours ago
    - 5 hours ago
    - 24 hours ago
    - 7 days ago
    """
    cam = "stress-cam-expired-rate"
    _seed_camera(cam)
    verif = _create_mock_verification("confirmed")

    now = datetime.now(timezone.utc)
    expired_deltas = [
        timedelta(minutes=61),
        timedelta(minutes=65),
        timedelta(minutes=90),
        timedelta(hours=2),
        timedelta(hours=5),
        timedelta(days=1),
        timedelta(days=7),
    ]

    for idx, delta in enumerate(expired_deltas):
        t_iso = (now - delta).isoformat()
        _seed_incident_and_action(
            camera_id=cam,
            incident_id=f"stress-inc-exp-{idx}",
            action_id=f"stress-act-exp-{idx}",
            occurred_at=t_iso,
            action_created_at=t_iso,
            action_status="sent"
        )

    # 7 expired actions in DB for this camera. Policy must evaluate allowed=True
    allowed, reason, _ = PolicyEngine.evaluate("stress-inc-exp-test", cam, verif)
    assert allowed is True
    assert "Policy approved" in reason


def test_rate_limit_precise_boundary_cutoff():
    """
    Test microsecond/second precision around 3600s:
    - Action at 3605 seconds ago (> 1 hour): EXPIRED, should NOT count.
    - Action at 3595 seconds ago (< 1 hour): ACTIVE, SHOULD count.
    """
    cam = "stress-cam-boundary"
    _seed_camera(cam)
    verif = _create_mock_verification("confirmed")

    now = datetime.now(timezone.utc)

    # Insert 4 actions well within the hour (e.g. 10 mins ago)
    for i in range(4):
        t_iso = (now - timedelta(minutes=10 + i)).isoformat()
        _seed_incident_and_action(cam, f"stress-inc-bnd-{i}", f"stress-act-bnd-{i}", t_iso, t_iso, "sent")

    # Insert 1 action at 3605s ago (1h 5s ago) -> expired
    t_expired = (now - timedelta(seconds=3605)).isoformat()
    _seed_incident_and_action(cam, "stress-inc-bnd-exp", "stress-act-bnd-exp", t_expired, t_expired, "sent")

    # Current count in window should be 4, so evaluation must be ALLOWED
    allowed1, reason1, _ = PolicyEngine.evaluate("stress-inc-bnd-check1", cam, verif)
    assert allowed1 is True, f"Expected allowed=True with 4 active and 1 expired action, got reason: {reason1}"

    # Now insert 1 action at 3595s ago (59m 55s ago) -> active
    t_active = (now - timedelta(seconds=3595)).isoformat()
    _seed_incident_and_action(cam, "stress-inc-bnd-act", "stress-act-bnd-act", t_active, t_active, "sent")

    # Current count in window is now 4 + 1 = 5, so evaluation must be SUPPRESSED
    allowed2, reason2, _ = PolicyEngine.evaluate("stress-inc-bnd-check2", cam, verif)
    assert allowed2 is False, "Expected allowed=False with 5 active actions"
    assert "Suppressed by Rate Limit: Reached 5/5" in reason2


# ---------------------------------------------------------------------------
# Test Suite 4: Full End-to-End API Integration & Concurrency Stress
# ---------------------------------------------------------------------------

def test_e2e_api_rapid_events_cooldown_and_rate_limit():
    """
    E2E API stress test simulating edge device sending rapid candidate events to /api/v1/events/candidates.
    1. First event succeeds with action_sent.
    2. Immediate second event is suppressed by cooldown.
    3. Events with updated occurred_at allow testing rate limit up to max_actions_per_hour.
    4. Second camera is unaffected by first camera reaching rate limit.
    """
    cam_1 = "stress-e2e-cam-1"
    cam_2 = "stress-e2e-cam-2"
    _seed_camera(cam_1, "E2E Cam 1")
    _seed_camera(cam_2, "E2E Cam 2")

    # Register workflow with cooldown_seconds=5 and max 3 actions/hour
    wf_id = "stress-wf-custom"
    conn = get_db()
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            """
            INSERT INTO workflows (id, organization_id, site_id, camera_id, name, active_version, status, created_at, updated_at)
            VALUES (?, 'test-org', 'test-site', ?, 'Stress Custom Workflow', 1, 'active', ?, ?)
            """,
            (wf_id, cam_1, now, now)
        )
        wf_def = {
            "schema_version": "1.0",
            "title": {"en": "Stress Monitor", "hi": "तनाव निगरानी"},
            "source_text": "Empirical stress test rule",
            "status": "active",
            "trigger": {
                "type": "object_in_zone",
                "classes": ["person"],
                "zone_id": None,
                "schedule": None,
                "minimum_confidence": 0.55,
                "dwell_seconds": 1.5
            },
            "verification": {
                "type": "temporal_scene_check",
                "instruction": "Verify unauthorized person present",
                "evidence_window_seconds": 2.0,
                "human_review_required": False
            },
            "safety": {
                "cooldown_seconds": 5,
                "max_actions_per_hour": 3
            },
            "actions": [
                {"type": "dashboard_alert", "enabled": True}
            ]
        }
        cursor.execute(
            """
            INSERT INTO workflow_versions (id, workflow_id, version, schema_version, definition, created_at)
            VALUES (?, ?, 1, 'v1', ?, ?)
            """,
            (str(uuid.uuid4()), wf_id, json.dumps(wf_def), now)
        )
        conn.commit()
    finally:
        conn.close()

    def make_event(camera_id: str, workflow_id: str = None):
        return {
            "event_id": str(uuid.uuid4()),
            "camera_id": camera_id,
            "workflow_id": workflow_id,
            "event_type": "restricted_zone_entry",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "source": "sample",
            "detector": {
                "name": "yolov8n",
                "version": "8.1.0",
                "confidence": 0.91,
                "bounding_box": {"x_min": 0.3, "y_min": 0.3, "x_max": 0.6, "y_max": 0.7}
            }
        }

    # Dispatch Event 1 for Cam 1 -> Approved
    res1 = client.post("/api/v1/events/candidates", json=make_event(cam_1, wf_id))
    assert res1.status_code == 201
    d1 = res1.json()
    assert d1["policy_allowed"] is True, f"Policy allowed is False, reason: {d1.get('policy_reason')}"
    assert d1["status"] == "action_sent"

    # Dispatch Event 2 for Cam 1 IMMEDIATELY (0s delta) -> Suppressed by Cooldown!
    res2 = client.post("/api/v1/events/candidates", json=make_event(cam_1, wf_id))
    assert res2.status_code == 201
    d2 = res2.json()
    assert d2["policy_allowed"] is False
    assert "Suppressed by Cooldown" in d2["policy_reason"]
    assert d2["status"] == "confirmed"

    # Simulate 10s passing by updating previous incident occurred_at
    conn = get_db()
    try:
        cursor = conn.cursor()
        t_shift = (datetime.now(timezone.utc) - timedelta(seconds=10)).isoformat()
        cursor.execute("UPDATE incidents SET occurred_at = ? WHERE camera_id = ?", (t_shift, cam_1))
        conn.commit()
    finally:
        conn.close()

    # Dispatch Event 3 for Cam 1 -> Approved (cooldown elapsed, actions=1 < 3)
    res3 = client.post("/api/v1/events/candidates", json=make_event(cam_1, wf_id))
    assert res3.status_code == 201
    d3 = res3.json()
    assert d3["policy_allowed"] is True
    assert d3["status"] == "action_sent"

    # Shift again to bypass cooldown
    conn = get_db()
    try:
        cursor = conn.cursor()
        t_shift = (datetime.now(timezone.utc) - timedelta(seconds=10)).isoformat()
        cursor.execute("UPDATE incidents SET occurred_at = ? WHERE camera_id = ?", (t_shift, cam_1))
        conn.commit()
    finally:
        conn.close()

    # Dispatch Event 4 for Cam 1 -> Approved (reaches 3 actions)
    res4 = client.post("/api/v1/events/candidates", json=make_event(cam_1, wf_id))
    assert res4.status_code == 201
    d4 = res4.json()
    assert d4["policy_allowed"] is True, f"Event 4 policy_allowed is False, reason: {d4.get('policy_reason')}"
    assert d4["status"] == "action_sent"

    # Shift again to bypass cooldown, but now rate limit (3/3) is reached!
    conn = get_db()
    try:
        cursor = conn.cursor()
        t_shift = (datetime.now(timezone.utc) - timedelta(seconds=10)).isoformat()
        cursor.execute("UPDATE incidents SET occurred_at = ? WHERE camera_id = ?", (t_shift, cam_1))
        conn.commit()
    finally:
        conn.close()

    # Dispatch Event 5 for Cam 1 -> Suppressed by Rate Limit!
    res5 = client.post("/api/v1/events/candidates", json=make_event(cam_1, wf_id))
    assert res5.status_code == 201
    d5 = res5.json()
    assert d5["policy_allowed"] is False
    assert "Suppressed by Rate Limit: Reached 3/3 actions per hour" in d5["policy_reason"]

    # Dispatch Event for Cam 2 (unaffected by Cam 1 rate limit) -> Approved!
    res_cam2 = client.post("/api/v1/events/candidates", json=make_event(cam_2, wf_id))
    assert res_cam2.status_code == 201
    d_cam2 = res_cam2.json()
    assert d_cam2["policy_allowed"] is True
    assert d_cam2["status"] == "action_sent"
