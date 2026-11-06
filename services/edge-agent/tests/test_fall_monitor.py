"""
Unit tests for the fall state machine (TSK-R1-02).

Tests fall state transitions:
- standing → fallen_detected (person goes down)
- fallen_detected → standing (person gets back up before timer = no alert)
- fallen_detected → emergency_trigger (still fallen after 3-5s = alert)
- Timer boundary: 2.9s = no alert, 3.0s = alert, 5.0s = alert
"""
import sys
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

import pytest
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tracking"))

from fall_monitor import (
    FallStateMachine,
    PersonTrack,
    FallEvent,
    STATE_STANDING,
    STATE_FALLEN_DETECTED,
    STATE_EMERGENCY_TRIGGER,
    DEFAULT_FALL_CONFIRM_SECONDS,
)


def _make_keypoint_array(fallen: bool) -> np.ndarray:
    """Create a mock keypoint array (17, 3) with x, y, confidence.
    
    If fallen: shoulders and hips at same y-level (horizontal body).
    If standing: shoulders above hips (vertical body).
    """
    kpts = np.zeros((17, 3), dtype=np.float32)
    kpts[:, 2] = 1.0

    if fallen:
        # Horizontal body: shoulders at left, hips at right (person lying down)
        kpts[5] = [0.3, 0.5, 1.0]   # left_shoulder
        kpts[6] = [0.5, 0.5, 1.0]   # right_shoulder
        kpts[11] = [0.5, 0.5, 1.0]  # left_hip
        kpts[12] = [0.7, 0.5, 1.0]  # right_hip
    else:
        # Vertical body: shoulders above hips
        kpts[5] = [0.4, 0.3, 1.0]   # left_shoulder
        kpts[6] = [0.6, 0.3, 1.0]   # right_shoulder
        kpts[11] = [0.4, 0.7, 1.0]  # left_hip
        kpts[12] = [0.6, 0.7, 1.0]  # right_hip

    return kpts


def _make_detection(fallen: bool, confidence: float = 0.9) -> Dict[str, Any]:
    """Create a mock detection dict."""
    keypoint_array = _make_keypoint_array(fallen)
    return {
        "confidence": confidence,
        "bounding_box": {"x_min": 0.3, "y_min": 0.2, "x_max": 0.7, "y_max": 0.8},
        "keypoint_array": keypoint_array,
        "is_fallen": fallen,
    }


def test_state_machine_initial_state():
    """New track starts in standing state."""
    fsm = FallStateMachine(camera_id="cam-1")
    assert len(fsm.tracks) == 0
    assert len(fsm.events) == 0


def test_person_falls_and_gets_up_no_emergency():
    """Person falls then gets up before 3s -> no emergency trigger."""
    fsm = FallStateMachine(camera_id="cam-1", fall_confirm_seconds=3.0)

    events = fsm.process_frame([_make_detection(fallen=False)], frame_idx=1)
    assert len(events) == 0
    track_id = list(fsm.tracks.keys())[0]
    assert fsm.tracks[track_id].state == STATE_STANDING

    events = fsm.process_frame([_make_detection(fallen=True)], frame_idx=2)
    assert len(events) == 1
    assert events[0].state == STATE_FALLEN_DETECTED
    assert fsm.tracks[track_id].state == STATE_FALLEN_DETECTED

    events = fsm.process_frame([_make_detection(fallen=False)], frame_idx=3)
    assert len(events) == 0
    assert fsm.tracks[track_id].state == STATE_STANDING


def test_person_falls_and_stays_triggers_emergency():
    """Person falls and stays fallen for 3s -> emergency trigger."""
    fsm = FallStateMachine(camera_id="cam-1", fall_confirm_seconds=3.0)

    fsm.process_frame([_make_detection(fallen=False)], frame_idx=1)
    track_id = list(fsm.tracks.keys())[0]

    fsm.process_frame([_make_detection(fallen=True)], frame_idx=2)
    assert fsm.tracks[track_id].state == STATE_FALLEN_DETECTED

    track = fsm.tracks[track_id]
    track.entered_fallen_at = datetime.now(timezone.utc) - timedelta(seconds=2.0)
    events = fsm.process_frame([_make_detection(fallen=True)], frame_idx=3)
    assert len(events) == 0
    assert fsm.tracks[track_id].state == STATE_FALLEN_DETECTED

    track.entered_fallen_at = datetime.now(timezone.utc) - timedelta(seconds=3.1)
    events = fsm.process_frame([_make_detection(fallen=True)], frame_idx=4)
    assert len(events) == 1
    assert events[0].state == STATE_EMERGENCY_TRIGGER
    assert fsm.tracks[track_id].state == STATE_EMERGENCY_TRIGGER


def test_timer_boundary_2_9_seconds_no_alert():
    """2.9 seconds fallen should NOT trigger emergency."""
    fsm = FallStateMachine(camera_id="cam-1", fall_confirm_seconds=3.0)

    fsm.process_frame([_make_detection(fallen=False)], frame_idx=1)
    track_id = list(fsm.tracks.keys())[0]
    fsm.process_frame([_make_detection(fallen=True)], frame_idx=2)

    track = fsm.tracks[track_id]
    track.entered_fallen_at = datetime.now(timezone.utc) - timedelta(seconds=2.9)
    events = fsm.process_frame([_make_detection(fallen=True)], frame_idx=3)
    assert len(events) == 0
    assert fsm.tracks[track_id].state == STATE_FALLEN_DETECTED


def test_timer_boundary_3_0_seconds_alert():
    """3.0 seconds fallen SHOULD trigger emergency."""
    fsm = FallStateMachine(camera_id="cam-1", fall_confirm_seconds=3.0)

    fsm.process_frame([_make_detection(fallen=False)], frame_idx=1)
    track_id = list(fsm.tracks.keys())[0]
    fsm.process_frame([_make_detection(fallen=True)], frame_idx=2)

    track = fsm.tracks[track_id]
    track.entered_fallen_at = datetime.now(timezone.utc) - timedelta(seconds=3.0)
    events = fsm.process_frame([_make_detection(fallen=True)], frame_idx=3)
    assert len(events) == 1
    assert events[0].state == STATE_EMERGENCY_TRIGGER


def test_person_leaves_frame_track_removed():
    """Person leaving frame removes the track after max_disappear_frames."""
    fsm = FallStateMachine(camera_id="cam-1", max_disappear_frames=2)

    fsm.process_frame([_make_detection(fallen=False)], frame_idx=1)
    track_id = list(fsm.tracks.keys())[0]
    assert track_id in fsm.tracks

    fsm.process_frame([], frame_idx=2)
    fsm.process_frame([], frame_idx=3)
    assert track_id not in fsm.tracks


def test_get_active_falls():
    """get_active_falls returns tracks in fallen or emergency state."""
    fsm = FallStateMachine(camera_id="cam-1")

    fsm.process_frame([_make_detection(fallen=False)], frame_idx=1)
    track_id = list(fsm.tracks.keys())[0]

    fsm.process_frame([_make_detection(fallen=True)], frame_idx=2)

    active = fsm.get_active_falls()
    assert len(active) == 1
    assert active[0]["track_id"] == track_id
    assert active[0]["state"] == STATE_FALLEN_DETECTED


def test_multiple_persons_independent_tracks():
    """Two persons in frame get independent tracks and states."""
    fsm = FallStateMachine(camera_id="cam-1")

    det1 = _make_detection(fallen=False)
    det1["bounding_box"] = {"x_min": 0.1, "y_min": 0.2, "x_max": 0.3, "y_max": 0.6}
    det2 = _make_detection(fallen=False)
    det2["bounding_box"] = {"x_min": 0.7, "y_min": 0.2, "x_max": 0.9, "y_max": 0.6}

    fsm.process_frame([det1, det2], frame_idx=1)
    assert len(fsm.tracks) == 2

    det1_fallen = _make_detection(fallen=True)
    det1_fallen["bounding_box"] = {"x_min": 0.1, "y_min": 0.2, "x_max": 0.3, "y_max": 0.6}
    det2_standing = _make_detection(fallen=False)
    det2_standing["bounding_box"] = {"x_min": 0.7, "y_min": 0.2, "x_max": 0.9, "y_max": 0.6}

    fsm.process_frame([det1_fallen, det2_standing], frame_idx=2)
    track1_id = [
        t for t in fsm.tracks.values()
        if t.bounding_box == {"x_min": 0.1, "y_min": 0.2, "x_max": 0.3, "y_max": 0.6}
    ][0].track_id
    fsm.tracks[track1_id].entered_fallen_at = datetime.now(timezone.utc) - timedelta(seconds=3.1)

    events = fsm.process_frame([det1_fallen, det2_standing], frame_idx=3)
    emergency_events = [e for e in events if e.state == STATE_EMERGENCY_TRIGGER]
    assert len(emergency_events) == 1
    assert emergency_events[0].track_id == track1_id

    track2_id = [t for t in fsm.tracks.values() if t.track_id != track1_id][0].track_id
    assert fsm.tracks[track2_id].state == STATE_STANDING


def test_fall_event_serialization():
    """FallEvent can be created with all fields."""
    event = FallEvent(
        event_id="test-1",
        camera_id="cam-1",
        track_id="person-1",
        state=STATE_EMERGENCY_TRIGGER,
        entered_fallen_at="2026-11-06T03:00:00+00:00",
        emergency_triggered_at="2026-11-06T03:00:03+00:00",
        duration_fallen_seconds=3.0,
        confidence=0.95,
        bounding_box={"x_min": 0.3, "y_min": 0.2, "x_max": 0.7, "y_max": 0.8},
        logged_at="2026-11-06T03:00:03+00:00",
    )
    assert event.event_id == "test-1"
    assert event.state == STATE_EMERGENCY_TRIGGER
    assert event.duration_fallen_seconds == 3.0