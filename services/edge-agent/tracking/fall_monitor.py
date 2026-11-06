"""
Fall state machine for DrishtiFlow fall detection.

Tracks person posture across frames and triggers emergency when a person
remains fallen for 3-5 seconds. States:

    standing ── person falls ──> fallen_detected ── 3-5s elapsed ──> emergency_trigger
         ↑                                          │
         │                                          └─ person gets up ──┘
         └──────────────────── person leaves frame ──────────────────┘

All timestamps are UTC ISO-8601.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional

import numpy as np

# Fall state values
STATE_STANDING = "standing"
STATE_FALLEN_DETECTED = "fallen_detected"
STATE_EMERGENCY_TRIGGER = "emergency_trigger"

# Default thresholds
DEFAULT_FALL_CONFIRM_SECONDS = 3.0      # seconds person must be fallen before emergency
DEFAULT_MAX_DISAPPEAR_FRAMES = 15       # frames a person can go undetected before track ends
DEFAULT_FALL_ANGLE_THRESHOLD = 0.8      # body width/height ratio for fallen classification


@dataclass
class PersonTrack:
    """Live track for a single person detected across consecutive frames."""

    track_id: str
    camera_id: str
    state: str = STATE_STANDING  # standing | fallen_detected | emergency_trigger
    entered_fallen_at: Optional[datetime] = None  # when person first detected as fallen
    emergency_triggered_at: Optional[datetime] = None  # when emergency was dispatched
    last_seen_frame: int = 0
    disappear_count: int = 0
    confidence: float = 0.0
    bounding_box: Optional[Dict[str, float]] = None
    keypoint_array: Optional[np.ndarray] = None
    # Internal bookkeeping (not part of exported record).
    seen_this_frame: bool = field(default=False, compare=False)


@dataclass
class FallEvent:
    """Finalized fall event record."""

    event_id: str
    camera_id: str
    track_id: str
    state: str  # standing | fallen_detected | emergency_trigger
    entered_fallen_at: Optional[str] = None  # UTC ISO-8601
    emergency_triggered_at: Optional[str] = None  # UTC ISO-8601
    duration_fallen_seconds: Optional[float] = None
    confidence: float = 0.0
    bounding_box: Optional[Dict[str, float]] = None
    logged_at: str = ""  # UTC ISO-8601 when the record was finalized


class FallStateMachine:
    """
    Manages fall detection state machine across multiple person tracks.

    Parameters
    ----------
    camera_id : str
        Identifier of the camera being monitored.
    fall_confirm_seconds : float
        Seconds a person must remain fallen before triggering emergency (default 3.0).
    max_disappear_frames : int
        Frames a person can go undetected before the track is finalized (default 15).
    fall_angle_threshold : float
        Body width/height ratio threshold for fallen classification (default 0.8).
    """

    def __init__(
        self,
        camera_id: str,
        fall_confirm_seconds: float = DEFAULT_FALL_CONFIRM_SECONDS,
        max_disappear_frames: int = DEFAULT_MAX_DISAPPEAR_FRAMES,
        fall_angle_threshold: float = DEFAULT_FALL_ANGLE_THRESHOLD,
    ):
        self.camera_id = camera_id
        self.fall_confirm_seconds = fall_confirm_seconds
        self.max_disappear_frames = max_disappear_frames
        self.fall_angle_threshold = fall_angle_threshold

        self.tracks: Dict[str, PersonTrack] = {}
        self.events: List[FallEvent] = []
        self._next_track_id = 1
        self._frame_idx = 0

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _iso(self, dt: Optional[datetime]) -> Optional[str]:
        return dt.isoformat() if dt else None

    def _match_or_create_track(
        self, keypoint_array: np.ndarray, confidence: float, bbox: Dict[str, float]
    ) -> str:
        """Match a detection to an existing track by IoU, or create a new track."""
        best_id: Optional[str] = None
        best_iou = 0.30  # matching threshold
        used_ids: set = set()

        candidates = []
        for track_id, track in self.tracks.items():
            if track_id in used_ids or track.bounding_box is None:
                continue
            iou = self._iou(bbox, track.bounding_box)
            if iou > best_iou:
                candidates.append((iou, track_id))

        if candidates:
            candidates.sort(reverse=True)
            for iou, track_id in candidates:
                if track_id not in used_ids:
                    best_id = track_id
                    used_ids.add(track_id)
                    break

        if best_id is None:
            track_id = f"person-{self._next_track_id}"
            self._next_track_id += 1
            self.tracks[track_id] = PersonTrack(
                track_id=track_id,
                camera_id=self.camera_id,
                state=STATE_STANDING,
                confidence=confidence,
                bounding_box=bbox,
                keypoint_array=keypoint_array,
                last_seen_frame=self._frame_idx,
            )
            best_id = track_id
        else:
            used_ids.add(best_id)

        track = self.tracks[best_id]
        track.bounding_box = bbox
        track.confidence = confidence
        track.keypoint_array = keypoint_array
        track.last_seen_frame = self._frame_idx
        track.seen_this_frame = True
        return best_id

    @staticmethod
    def _iou(a: Dict[str, float], b: Dict[str, float]) -> float:
        ax_min, ay_min, ax_max, ay_max = (
            a["x_min"], a["y_min"], a["x_max"], a["y_max"]
        )
        bx_min, by_min, bx_max, by_max = (
            b["x_min"], b["y_min"], b["x_max"], b["y_max"]
        )
        inter_x_min = max(ax_min, bx_min)
        inter_y_min = max(ay_min, by_min)
        inter_x_max = min(ax_max, bx_max)
        inter_y_max = min(ay_max, by_max)
        inter_w = max(0.0, inter_x_max - inter_x_min)
        inter_h = max(0.0, inter_y_max - inter_y_min)
        inter = inter_w * inter_h
        area_a = max(0.0, ax_max - ax_min) * max(0.0, ay_max - ay_min)
        area_b = max(0.0, bx_max - bx_min) * max(0.0, by_max - by_min)
        union = area_a + area_b - inter
        return inter / union if union > 0 else 0.0

    def _classify_posture(self, keypoint_array: np.ndarray) -> bool:
        """Classify whether a person is fallen based on keypoint geometry."""
        # Use shoulder and hip centers
        sh_l = keypoint_array[5]   # left_shoulder
        sh_r = keypoint_array[6]   # right_shoulder
        hip_l = keypoint_array[11] # left_hip
        hip_r = keypoint_array[12] # right_hip

        if sh_l[2] <= 0 or sh_r[2] <= 0 or hip_l[2] <= 0 or hip_r[2] <= 0:
            return False

        shoulder_center_y = (sh_l[1] + sh_r[1]) / 2.0
        hip_center_y = (hip_l[1] + hip_r[1]) / 2.0
        shoulder_center_x = (sh_l[0] + sh_r[0]) / 2.0
        hip_center_x = (hip_l[0] + hip_r[0]) / 2.0

        body_height = abs(shoulder_center_y - hip_center_y)
        body_width = abs(shoulder_center_x - hip_center_x)

        if body_height > 0:
            aspect_ratio = body_width / (body_height + 1e-6)
        else:
            aspect_ratio = 0.0

        return aspect_ratio > self.fall_angle_threshold and body_height > 0.05

    def process_frame(
        self, keypoint_detections: List[Dict[str, Any]], frame_idx: Optional[int] = None
    ) -> List[FallEvent]:
        """
        Process one frame through the fall state machine.

        Parameters
        ----------
        keypoint_detections : List[Dict]
            Detections from YOLOPoseDetector.detect(), each with keypoint_array,
            confidence, bounding_box, is_fallen fields.
        frame_idx : int, optional
            Frame index. Auto-increments if not provided.

        Returns
        -------
        List[FallEvent]
            Newly generated fall events (state changes and emergency triggers).
        """
        if frame_idx is not None:
            self._frame_idx = frame_idx
        else:
            self._frame_idx += 1

        # Mark every existing track as not-seen this frame.
        for track in self.tracks.values():
            track.seen_this_frame = False

        current_ids: set = set()
        new_events: List[FallEvent] = []

        # --- Match detections to tracks / create new tracks ---
        for det in keypoint_detections:
            keypoint_array = det.get("keypoint_array")
            if keypoint_array is None:
                continue
            bbox = det.get("bounding_box", {})
            conf = float(det.get("confidence", 0.0))
            track_id = self._match_or_create_track(keypoint_array, conf, bbox)
            current_ids.add(track_id)
            track = self.tracks[track_id]

            # --- State machine transitions ---
            is_fallen = det.get("is_fallen", False)
            now = self._now()

            if track.state == STATE_STANDING:
                if is_fallen:
                    track.state = STATE_FALLEN_DETECTED
                    track.entered_fallen_at = now
                    new_events.append(
                        FallEvent(
                            event_id=f"fall-{self._frame_idx}-{track_id}",
                            camera_id=self.camera_id,
                            track_id=track_id,
                            state=STATE_FALLEN_DETECTED,
                            entered_fallen_at=self._iso(now),
                            confidence=conf,
                            bounding_box=bbox,
                            logged_at=self._iso(now),
                        )
                    )

            elif track.state == STATE_FALLEN_DETECTED:
                if not is_fallen:
                    # Person got back up
                    track.state = STATE_STANDING
                    track.entered_fallen_at = None
                else:
                    # Still fallen - check if emergency timer elapsed
                    if track.entered_fallen_at is not None:
                        elapsed = (now - track.entered_fallen_at).total_seconds()
                        if elapsed >= self.fall_confirm_seconds:
                            track.state = STATE_EMERGENCY_TRIGGER
                            track.emergency_triggered_at = now
                            new_events.append(
                                FallEvent(
                                    event_id=f"emergency-{self._frame_idx}-{track_id}",
                                    camera_id=self.camera_id,
                                    track_id=track_id,
                                    state=STATE_EMERGENCY_TRIGGER,
                                    entered_fallen_at=self._iso(track.entered_fallen_at),
                                    emergency_triggered_at=self._iso(now),
                                    duration_fallen_seconds=elapsed,
                                    confidence=conf,
                                    bounding_box=bbox,
                                    logged_at=self._iso(now),
                                )
                            )

            elif track.state == STATE_EMERGENCY_TRIGGER:
                # Already triggered, keep tracking but don't re-trigger
                if not is_fallen:
                    track.state = STATE_STANDING
                    track.entered_fallen_at = None
                    track.emergency_triggered_at = None

        # --- Finalize tracks that disappeared ---
        to_finalize: List[str] = []
        for track_id, track in list(self.tracks.items()):
            if track_id not in current_ids:
                track.disappear_count += 1
                if track.disappear_count >= self.max_disappear_frames:
                    to_finalize.append(track_id)
            else:
                track.disappear_count = 0

        for track_id in to_finalize:
            self.tracks.pop(track_id, None)

        return new_events

    def get_active_falls(self) -> List[Dict[str, Any]]:
        """Return summary of tracks currently in fallen or emergency state."""
        summaries = []
        for track in self.tracks.values():
            if track.state in (STATE_FALLEN_DETECTED, STATE_EMERGENCY_TRIGGER):
                summaries.append(
                    {
                        "track_id": track.track_id,
                        "camera_id": track.camera_id,
                        "state": track.state,
                        "entered_fallen_at": self._iso(track.entered_fallen_at),
                        "emergency_triggered_at": self._iso(track.emergency_triggered_at),
                        "confidence": track.confidence,
                        "bounding_box": track.bounding_box,
                    }
                )
        return summaries

    def get_all_events(self) -> List[FallEvent]:
        """Return all fall events."""
        return self.events

    def record_event(self, event: FallEvent) -> None:
        """Manually record a fall event (e.g., from external source)."""
        self.events.append(event)
