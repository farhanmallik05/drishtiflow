"""
Shoplifting detection monitor for the DrishtiFlow edge agent.

Composes the existing YOLOv8n person detector
(``services/edge-agent/inference/yolo_detector.py``) and the zone point-in-polygon
filter (``services/edge-agent/inference/detector.py``) to:

1. Track persons across video frames (simple IoU-based tracker).
2. Record shop ``entry_time`` when a person first enters the shop zone and
   ``exit_time`` when they leave (or disappear for too many frames).
3. Flag suspected item-theft: a person who dwells near shelves/items and then
   exits the shop zone is marked ``theft_suspected = True``.
4. Capture ONE evidence photo (person bounding-box crop, JPEG) per incident.
5. Append one row per person to a pandas DataFrame persisted as CSV
   (``shop_theft_log.csv``) with columns:
   track_id, camera_id, entry_time, exit_time, duration_seconds,
   shelf_interaction, theft_suspected, detector_confidence, photo_path, logged_at.

Designed to run standalone on recorded CCTV footage or inside a live camera
loop. All timestamps are UTC ISO-8601.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

import cv2
import numpy as np
import pandas as pd

from inference.detector import is_point_in_polygon
from inference.yolo_detector import YOLOEdgeDetector


Point = Tuple[float, float]
BBox = Dict[str, float]  # x_min, y_min, x_max, y_max in normalized [0, 1]


@dataclass
class PersonTrack:
    """Live track for a single person detected across consecutive frames."""

    track_id: str
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    in_shop: bool = False
    shelf_interaction: bool = False
    theft_suspected: bool = False
    photo_path: str = ""
    last_seen_frame: int = 0
    last_bbox: Optional[BBox] = None
    confidence: float = 0.0
    # Internal bookkeeping (not part of the exported record).
    seen_this_frame: bool = field(default=False, compare=False)
    disappear_count: int = field(default=0, compare=False)


@dataclass
class TheftRecord:
    """Finalized per-person record written to the pandas CSV log."""

    track_id: str
    camera_id: str
    entry_time: str  # UTC ISO-8601
    exit_time: str   # UTC ISO-8601 ("" when the person never left / still inside)
    duration_seconds: float
    shelf_interaction: bool
    theft_suspected: bool
    detector_confidence: float
    photo_path: str
    logged_at: str   # UTC ISO-8601 when the record was finalized


class ShopliftMonitor:
    """
    Monitors a camera stream for shoplifting behavior.

    Parameters
    ----------
    camera_id : str
        Identifier of the camera being monitored.
    shop_zone : List[Point]
        Polygon (normalized [0, 1] coords) defining the shop floor area.
        Entering this polygon starts a person track (entry_time).
    shelf_zone : List[Point]
        Polygon (normalized [0, 1] coords) defining the shelves / items area.
        Dwelling here flags ``shelf_interaction`` for the track.
    max_disappear_frames : int
        Frames a person can go undetected before the track is finalized as
        having exited the shop.
    evidence_dir : str | Path
        Directory where the single evidence photo per incident is saved (JPEG).
    csv_path : str | Path
        Path to the pandas CSV log file (``shop_theft_log.csv`` by default).
    """

    def __init__(
        self,
        camera_id: str,
        shop_zone: List[Point],
        shelf_zone: List[Point],
        max_disappear_frames: int = 15,
        evidence_dir: str = "services/edge-agent/assets/evidence",
        csv_path: str = "services/edge-agent/assets/shop_theft_log.csv",
    ):
        self.camera_id = camera_id
        self.shop_zone = shop_zone
        self.shelf_zone = shelf_zone
        self.max_disappear_frames = max_disappear_frames
        self.evidence_dir = Path(evidence_dir)
        self.csv_path = Path(csv_path)

        self.evidence_dir.mkdir(parents=True, exist_ok=True)
        self.csv_path.parent.mkdir(parents=True, exist_ok=True)

        self.tracks: Dict[str, PersonTrack] = {}
        self.finished_records: List[TheftRecord] = []
        self._next_track_id = 1
        self._frame_idx = 0

        # Lazy-loaded on first frame so module import stays cheap.
        self._detector: Optional[YOLOEdgeDetector] = None

        # Initialize the CSV log with a header row if it does not yet exist.
        self._ensure_csv_header()

    # ------------------------------------------------------------------ #
    # Detector access
    # ------------------------------------------------------------------ #
    @property
    def detector(self) -> YOLOEdgeDetector:
        """Lazily construct the YOLOv8n edge detector."""
        if self._detector is None:
            self._detector = YOLOEdgeDetector(confidence_threshold=0.5, device="cpu")
        return self._detector

    @detector.setter
    def detector(self, value: YOLOEdgeDetector) -> None:
        """Inject a detector (useful for stubbing/mocking in tests)."""
        self._detector = value

    # ------------------------------------------------------------------ #
    # CSV persistence
    # ------------------------------------------------------------------ #
    def _ensure_csv_header(self) -> None:
        """Create the CSV log file with a header row if it is absent."""
        if not self.csv_path.exists():
            with open(self.csv_path, "w", newline="", encoding="utf-8") as fh:
                writer = csv.writer(fh)
                writer.writerow(
                    [
                        "track_id",
                        "camera_id",
                        "entry_time",
                        "exit_time",
                        "duration_seconds",
                        "shelf_interaction",
                        "theft_suspected",
                        "detector_confidence",
                        "photo_path",
                        "logged_at",
                    ]
                )

    def _append_record(self, record: TheftRecord) -> None:
        """Append a single finalized theft record row to the CSV log."""
        row = [
            record.track_id,
            record.camera_id,
            record.entry_time,
            record.exit_time,
            round(record.duration_seconds, 2),
            record.shelf_interaction,
            record.theft_suspected,
            record.detector_confidence,
            record.photo_path,
            record.logged_at,
        ]
        with open(self.csv_path, "a", newline="", encoding="utf-8") as fh:
            csv.writer(fh).writerow(row)
        self.finished_records.append(record)

    # ------------------------------------------------------------------ #
    # Tracking helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _bbox_center(bbox: BBox) -> Point:
        return ((bbox["x_min"] + bbox["x_max"]) / 2.0, (bbox["y_min"] + bbox["y_max"]) / 2.0)

    @staticmethod
    def _iou(a: BBox, b: BBox) -> float:
        ax_min, ay_min, ax_max, ay_max = a["x_min"], a["y_min"], a["x_max"], a["y_max"]
        bx_min, by_min, bx_max, by_max = b["x_min"], b["y_min"], b["x_max"], b["y_max"]
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

    def _match_or_create_track(self, detection: BBox, confidence: float) -> str:
        """Match a detection to an existing track by IoU, or create a new track.

        Greedy best-match with an IoU threshold; each track and detection is
        matched at most once per frame.
        """
        best_id: Optional[str] = None
        best_iou = 0.30  # matching threshold

        # Collect already-matched track ids this frame so a detection does not
        # steal a track from a better-matching detection processed earlier.
        used_ids: Set[str] = set()

        # First pass: find best IoU match per detection.
        candidates = []
        for track_id, track in self.tracks.items():
            if track_id in used_ids or track.last_bbox is None:
                continue
            iou = self._iou(detection, track.last_bbox)
            if iou > best_iou:
                candidates.append((iou, track_id))

        if candidates:
            # Pick the highest-IoU candidate not already claimed.
            candidates.sort(reverse=True)
            for iou, track_id in candidates:
                if track_id not in used_ids:
                    best_id = track_id
                    used_ids.add(track_id)
                    break

        if best_id is None:
            track_id = f"person-{self._next_track_id}"
            self._next_track_id += 1
            self.tracks[track_id] = PersonTrack(track_id=track_id)
            best_id = track_id
        else:
            used_ids.add(best_id)

        track = self.tracks[best_id]
        track.last_bbox = detection
        track.confidence = confidence
        track.last_seen_frame = self._frame_idx
        track.seen_this_frame = True
        return best_id

    # ------------------------------------------------------------------ #
    # Core per-frame processing
    # ------------------------------------------------------------------ #
    def process_frame(self, frame: np.ndarray, frame_idx: Optional[int] = None) -> List[Dict]:
        """
        Run one frame through the shoplifting monitor.

        Detects persons, updates tracks, records entry/exit times, flags
        suspected theft, captures one evidence photo per incident, and
        finalizes records for tracks that have exited or disappeared.

        Returns a list of active-track summaries for the current frame.
        """
        if frame_idx is not None:
            self._frame_idx = frame_idx
        else:
            self._frame_idx += 1

        detections = self.detector.detect(frame)
        person_dets = [d for d in detections if d.get("class") == "person"]

        # Mark every existing track as not-seen this frame.
        for track in self.tracks.values():
            track.seen_this_frame = False

        current_ids: Set[str] = set()

        # --- Match detections to tracks / create new tracks ---
        for det in person_dets:
            bbox = det.get("bounding_box", {})
            conf = float(det.get("confidence", 0.0))
            track_id = self._match_or_create_track(bbox, conf)
            current_ids.add(track_id)
            track = self.tracks[track_id]

            center = self._bbox_center(bbox)

            # Entry: person first enters the shop zone.
            if not track.in_shop and is_point_in_polygon(center, self.shop_zone):
                track.in_shop = True
                track.entry_time = datetime.now(timezone.utc)
                print(
                    f"[{self._frame_idx}] ENTRY track={track_id} "
                    f"center=({center[0]:.2f},{center[1]:.2f}) "
                    f"entry_time={track.entry_time.isoformat()}"
                )

            # Shelf interaction: person is near items/shelves.
            if is_point_in_polygon(center, self.shelf_zone):
                track.shelf_interaction = True

        # --- Finalize tracks that exited or disappeared ---
        to_finalize: List[str] = []
        for track_id, track in list(self.tracks.items()):
            if track_id not in current_ids:
                track.disappear_count += 1
                if track.in_shop and track.disappear_count >= self.max_disappear_frames:
                    to_finalize.append(track_id)
            else:
                track.disappear_count = 0

            # Exit: person leaves the shop zone while still being tracked.
            if track.in_shop and track_id in current_ids and track.last_bbox is not None:
                center = self._bbox_center(track.last_bbox)
                if not is_point_in_polygon(center, self.shop_zone):
                    track.in_shop = False
                    track.exit_time = datetime.now(timezone.utc)
                    to_finalize.append(track_id)
                    print(
                        f"[{self._frame_idx}] EXIT track={track_id} "
                        f"center=({center[0]:.2f},{center[1]:.2f}) "
                        f"exit_time={track.exit_time.isoformat()}"
                    )

        for track_id in to_finalize:
            self._finalize_track(track_id, frame)
        finalized_ids = set(to_finalize)

        # --- Return active summaries ---
        summaries = []
        for track_id in sorted(current_ids):
            if track_id in finalized_ids:
                # Track was exited/finalized earlier this frame; already logged.
                continue
            track = self.tracks[track_id]
            summaries.append(
                {
                    "track_id": track_id,
                    "in_shop": track.in_shop,
                    "entry_time": track.entry_time.isoformat() if track.entry_time else None,
                    "exit_time": track.exit_time.isoformat() if track.exit_time else None,
                    "shelf_interaction": track.shelf_interaction,
                    "theft_suspected": track.theft_suspected,
                    "confidence": track.confidence,
                }
            )
        return summaries

    def _finalize_track(self, track_id: str, frame: Optional[np.ndarray]) -> None:
        """Finalize a track: compute exit, flag theft, capture photo, log to CSV."""
        track = self.tracks.pop(track_id, None)
        if track is None:
            return

        # Never actually entered the shop -> nothing to log.
        if not track.in_shop and track.exit_time is None and track.entry_time is None:
            return

        exit_time = track.exit_time or datetime.now(timezone.utc)
        entry_time = track.entry_time or exit_time

        # Theft heuristic: dwelled near shelves/items and then exited the shop.
        # ``_finalize_track`` is only reached on exit or disappearance, i.e. the
        # person has left the shop, so shelf interaction alone implies suspected
        # theft for a track that actually entered.
        theft_suspected = bool(track.shelf_interaction and track.entry_time is not None)
        track.theft_suspected = theft_suspected

        # Capture one evidence photo of the person (best available frame).
        photo_path = track.photo_path
        if theft_suspected and frame is not None and track.last_bbox is not None and not photo_path:
            photo_path = self._capture_photo(frame, track.last_bbox, track_id)
            track.photo_path = photo_path

        duration = (exit_time - entry_time).total_seconds()

        record = TheftRecord(
            track_id=track_id,
            camera_id=self.camera_id,
            entry_time=entry_time.isoformat(),
            exit_time=exit_time.isoformat(),
            duration_seconds=duration,
            shelf_interaction=track.shelf_interaction,
            theft_suspected=theft_suspected,
            detector_confidence=round(track.confidence, 4),
            photo_path=photo_path,
            logged_at=datetime.now(timezone.utc).isoformat(),
        )
        self._append_record(record)
        print(
            f"[FINALIZE] track={track_id} theft_suspected={theft_suspected} "
            f"entry={entry_time.isoformat()} exit={exit_time.isoformat()} "
            f"duration={duration:.1f}s photo={photo_path}"
        )

    def _capture_photo(self, frame: np.ndarray, bbox: BBox, track_id: str) -> str:
        """Crop one evidence photo of the person and save it as JPEG.

        Returns the saved file path (empty string on failure; capture never
        breaks monitoring).
        """
        try:
            h, w = frame.shape[:2]
            x_min = int(bbox["x_min"] * w)
            y_min = int(bbox["y_min"] * h)
            x_max = int(bbox["x_max"] * w)
            y_max = int(bbox["y_max"] * h)
            x_min, y_min = max(0, x_min), max(0, y_min)
            x_max, y_max = min(w, x_max), min(h, y_max)
            if x_max <= x_min or y_max <= y_min:
                return ""
            crop = frame[y_min:y_max, x_min:x_max]
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")[:-3]
            filename = f"{self.camera_id}_{track_id}_{timestamp}.jpg"
            save_path = self.evidence_dir / filename
            cv2.imwrite(str(save_path), crop)
            return str(save_path)
        except Exception:  # noqa: BLE001 - photo capture must never break monitoring
            return ""

    # ------------------------------------------------------------------ #
    # DataFrame / CSV export
    # ------------------------------------------------------------------ #
    def to_dataframe(self) -> pd.DataFrame:
        """Return all finalized records as a pandas DataFrame."""
        columns = [
            "track_id",
            "camera_id",
            "entry_time",
            "exit_time",
            "duration_seconds",
            "shelf_interaction",
            "theft_suspected",
            "detector_confidence",
            "photo_path",
            "logged_at",
        ]
        if not self.finished_records:
            return pd.DataFrame(columns=columns)
        rows = [
            {
                "track_id": r.track_id,
                "camera_id": r.camera_id,
                "entry_time": r.entry_time,
                "exit_time": r.exit_time,
                "duration_seconds": r.duration_seconds,
                "shelf_interaction": r.shelf_interaction,
                "theft_suspected": r.theft_suspected,
                "detector_confidence": r.detector_confidence,
                "photo_path": r.photo_path,
                "logged_at": r.logged_at,
            }
            for r in self.finished_records
        ]
        return pd.DataFrame(rows, columns=columns)

    def save_dataframe(self, path: Optional[str] = None) -> str:
        """Save the finalized records DataFrame to CSV and return the path."""
        target = Path(path) if path else self.csv_path
        target.parent.mkdir(parents=True, exist_ok=True)
        self.to_dataframe().to_csv(target, index=False, encoding="utf-8")
        return str(target)

    def get_active_tracks(self) -> List[Dict]:
        """Return summary of tracks currently inside the shop (not yet exited)."""
        summaries = []
        for track in self.tracks.values():
            if track.in_shop:
                summaries.append(
                    {
                        "track_id": track.track_id,
                        "entry_time": track.entry_time.isoformat() if track.entry_time else None,
                        "shelf_interaction": track.shelf_interaction,
                        "theft_suspected": track.theft_suspected,
                        "confidence": track.confidence,
                    }
                )
        return summaries

    def flush(self, frame: Optional[np.ndarray] = None) -> List[TheftRecord]:
        """Finalize every still-active track (e.g. at end of a video)."""
        finalized: List[TheftRecord] = []
        before = len(self.finished_records)
        for track_id in list(self.tracks.keys()):
            self._finalize_track(track_id, frame)
        if len(self.finished_records) > before:
            finalized = self.finished_records[before:]
        return finalized
