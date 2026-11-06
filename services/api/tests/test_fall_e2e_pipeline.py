"""
End-to-End Fall Detection and Hospital Emergency Dispatch Pipeline Test (TSK-R1-06).

Validates the full R1 pipeline:
1. Pose keypoints stream -> FallStateMachine posture tracking.
2. Person standing -> normal tracking without alert.
3. Person falls -> state transitions to 'fallen_detected'.
4. 3.0s confirmation timer:
   - At 2.0s: still in fallen_detected state, no emergency alert.
   - At 3.5s: confirms persistent fall -> transitions to 'emergency_trigger'.
5. Event emitted to FastAPI backend (/api/v1/fall-monitor/events).
6. Camera fall status verified (/api/v1/fall-monitor/{camera_id}).
7. False positive prevention: transient bend (falls for 1.5s, stands back up)
   recovers to 'standing' without triggering emergency alert.
8. Manual emergency escalation (/api/v1/fall-monitor/emergency) to hospital reception.
"""
import sys
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

import pytest
import numpy as np
from fastapi.testclient import TestClient

from services.api.app.main import app

# Add edge-agent tracking directory to sys.path
EDGE_TRACKING_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "edge-agent", "tracking")
)
if EDGE_TRACKING_DIR not in sys.path:
    sys.path.insert(0, EDGE_TRACKING_DIR)

from fall_monitor import (
    FallStateMachine,
    STATE_STANDING,
    STATE_FALLEN_DETECTED,
    STATE_EMERGENCY_TRIGGER,
)

client = TestClient(app)


def _make_keypoints(fallen: bool) -> np.ndarray:
    """Create normalized (17, 3) keypoint array with posture orientation."""
    kpts = np.zeros((17, 3), dtype=np.float32)
    kpts[:, 2] = 0.95  # high confidence

    if fallen:
        # Horizontal body: shoulders & hips at equal y-level (lying down)
        kpts[5] = [0.30, 0.60, 0.95]   # left_shoulder
        kpts[6] = [0.50, 0.60, 0.95]   # right_shoulder
        kpts[11] = [0.50, 0.60, 0.95]  # left_hip
        kpts[12] = [0.70, 0.60, 0.95]  # right_hip
    else:
        # Vertical body: shoulders well above hips
        kpts[5] = [0.45, 0.25, 0.95]   # left_shoulder
        kpts[6] = [0.55, 0.25, 0.95]   # right_shoulder
        kpts[11] = [0.45, 0.65, 0.95]  # left_hip
        kpts[12] = [0.55, 0.65, 0.95]  # right_hip

    return kpts


def _make_det(fallen: bool, confidence: float = 0.95) -> Dict[str, Any]:
    return {
        "confidence": confidence,
        "bounding_box": {"x_min": 0.3, "y_min": 0.2, "x_max": 0.7, "y_max": 0.8},
        "keypoint_array": _make_keypoints(fallen),
        "is_fallen": fallen,
    }


def test_fall_detection_e2e_full_lifecycle():
    """Verify full end-to-end flow from pose stream to hospital dispatch."""
    cam_id = f"cam-ward-{uuid.uuid4().hex[:6]}"
    fsm = FallStateMachine(camera_id=cam_id, fall_confirm_seconds=3.0)

    # 1. Person is standing normally for 3 frames
    for i in range(1, 4):
        events = fsm.process_frame([_make_det(fallen=False)], frame_idx=i)
        assert len(events) == 0, "Standing person must not trigger any fall events"

    # Verify track is active and standing
    assert len(fsm.tracks) == 1
    track = list(fsm.tracks.values())[0]
    assert track.state == STATE_STANDING

    # 2. Person collapses onto floor (fallen keypoints)
    events = fsm.process_frame([_make_det(fallen=True)], frame_idx=4)
    assert len(events) == 1
    assert events[0].state == STATE_FALLEN_DETECTED
    assert track.state == STATE_FALLEN_DETECTED

    # Ingest event into FastAPI backend
    ingest_payload = {
        "event_id": events[0].event_id,
        "camera_id": cam_id,
        "track_id": events[0].track_id,
        "state": events[0].state,
        "entered_fallen_at": events[0].entered_fallen_at,
        "emergency_triggered_at": None,
        "duration_fallen_seconds": 0.0,
        "confidence": events[0].confidence,
        "bounding_box": events[0].bounding_box,
        "occurred_at": events[0].logged_at,
    }
    resp = client.post("/api/v1/fall-monitor/events", json=ingest_payload)
    assert resp.status_code == 201

    # Verify camera status shows active fall in progress
    status_resp = client.get(f"/api/v1/fall-monitor/{cam_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert len(status_data["active_falls"]) == 1
    assert status_data["active_falls"][0]["state"] == STATE_FALLEN_DETECTED

    # 3. Time simulation: 2.0s elapsed (under 3.0s threshold) -> still in fallen_detected
    track.entered_fallen_at = datetime.now(timezone.utc) - timedelta(seconds=2.0)
    events_2s = fsm.process_frame([_make_det(fallen=True)], frame_idx=5)
    assert len(events_2s) == 0, "No emergency should fire before 3.0s threshold"
    assert track.state == STATE_FALLEN_DETECTED

    # 4. Time simulation: 3.5s elapsed (exceeds 3.0s threshold) -> transition to emergency_trigger!
    track.entered_fallen_at = datetime.now(timezone.utc) - timedelta(seconds=3.5)
    events_3s = fsm.process_frame([_make_det(fallen=True)], frame_idx=6)
    assert len(events_3s) == 1
    assert events_3s[0].state == STATE_EMERGENCY_TRIGGER
    assert track.state == STATE_EMERGENCY_TRIGGER

    # Ingest emergency trigger event into FastAPI backend
    emergency_payload = {
        "event_id": events_3s[0].event_id,
        "camera_id": cam_id,
        "track_id": events_3s[0].track_id,
        "state": events_3s[0].state,
        "entered_fallen_at": events_3s[0].entered_fallen_at,
        "emergency_triggered_at": events_3s[0].emergency_triggered_at,
        "duration_fallen_seconds": events_3s[0].duration_fallen_seconds,
        "confidence": events_3s[0].confidence,
        "bounding_box": events_3s[0].bounding_box,
        "occurred_at": events_3s[0].logged_at,
    }
    resp = client.post("/api/v1/fall-monitor/events", json=emergency_payload)
    assert resp.status_code == 201

    # Verify status reflects emergency triggered
    status_resp = client.get(f"/api/v1/fall-monitor/{cam_id}")
    status_data = status_resp.json()
    assert status_data["last_emergency_at"] is not None


def test_fall_detection_false_positive_prevention():
    """Verify that a transient bend or short fall (<3.0s) does NOT dispatch emergency."""
    cam_id = f"cam-lobby-{uuid.uuid4().hex[:6]}"
    fsm = FallStateMachine(camera_id=cam_id, fall_confirm_seconds=3.0)

    # Frame 1: Person standing
    fsm.process_frame([_make_det(fallen=False)], frame_idx=1)
    track = list(fsm.tracks.values())[0]

    # Frame 2: Person bends down / falls for 1.5s
    fsm.process_frame([_make_det(fallen=True)], frame_idx=2)
    assert track.state == STATE_FALLEN_DETECTED

    # Frame 3: Person recovers and stands back up at 1.8s
    events_recover = fsm.process_frame([_make_det(fallen=False)], frame_idx=3)

    # State machine must reset state back to standing without triggering emergency
    assert track.state == STATE_STANDING
    assert track.entered_fallen_at is None
    emergency_events = [e for e in events_recover if e.state == STATE_EMERGENCY_TRIGGER]
    assert len(emergency_events) == 0, "Transient bend must not trigger emergency"


def test_manual_hospital_emergency_dispatch():
    """Verify manual emergency trigger endpoint dispatches hospital reception alert."""
    cam_id = f"cam-icu-{uuid.uuid4().hex[:6]}"
    payload = {
        "camera_id": cam_id,
        "track_id": "person-urgent",
        "message": "Nurse station alert: immediate medical assistance needed in ICU corridor.",
    }
    resp = client.post("/api/v1/fall-monitor/emergency", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["state"] == STATE_EMERGENCY_TRIGGER
    assert data["message"] == "Emergency dispatched to hospital reception"
    assert "emergency-manual-" in data["event_id"]

    # Verify status records the manual emergency
    status_resp = client.get(f"/api/v1/fall-monitor/{cam_id}")
    assert status_resp.status_code == 200
    assert status_resp.json()["last_emergency_at"] is not None
