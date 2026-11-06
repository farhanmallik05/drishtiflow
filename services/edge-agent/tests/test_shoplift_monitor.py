"""
Unit tests for the shoplifting detection monitor (TSK-D2-06).

The YOLOv8n detector is stubbed out so tests are fast, deterministic, and do not
require downloading model weights. Tests verify that the monitor:

- records entry_time when a person first enters the shop zone,
- records exit_time when the person leaves / disappears from the shop zone,
- flags theft_suspected only when shelf interaction precedes exit,
- captures exactly one evidence photo per suspected-theft incident,
- emits a pandas DataFrame/CSV with entry_time, exit_time, and photo_path.
"""
import os
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
pytest.importorskip("ultralytics")

# Add services/edge-agent to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tracking.shoplift_monitor import ShopliftMonitor  # noqa: E402


# Shop zone covers most of the frame; shelf zone is the right half.
SHOP_ZONE = [(0.05, 0.20), (0.95, 0.20), (0.95, 0.85), (0.05, 0.85)]
SHELF_ZONE = [(0.50, 0.20), (0.95, 0.20), (0.95, 0.85), (0.50, 0.85)]


def _person_det(center_x: float, center_y: float, conf: float = 0.9) -> dict:
    """Build a person detection dict with a small bbox centered at (x, y)."""
    half = 0.08
    return {
        "class": "person",
        "confidence": conf,
        "bounding_box": {
            "x_min": round(max(0.0, center_x - half), 4),
            "y_min": round(max(0.0, center_y - half), 4),
            "x_max": round(min(1.0, center_x + half), 4),
            "y_max": round(min(1.0, center_y + half), 4),
        },
    }


class _StubDetector:
    """Returns a fixed list of detections; ``detections`` can be mutated between
    calls to simulate a person entering, dwelling, and leaving the frame."""

    def __init__(self, detections):
        self.detections = list(detections)
        self.call_count = 0

    def detect(self, frame):  # noqa: ARG002
        self.call_count += 1
        return list(self.detections)


@pytest.fixture
def monitor(tmp_path):
    """Fresh monitor with a temp CSV and evidence dir."""
    csv_path = tmp_path / "shop_theft_log.csv"
    evidence_dir = tmp_path / "evidence"
    m = ShopliftMonitor(
        camera_id="cam-test",
        shop_zone=SHOP_ZONE,
        shelf_zone=SHELF_ZONE,
        max_disappear_frames=3,
        evidence_dir=str(evidence_dir),
        csv_path=str(csv_path),
    )
    return m


def _disappear(monitor, start_frame=2):
    """Feed empty detections so every in-shop track disappears and finalizes."""
    monitor.detector.detections = []
    for _ in range(monitor.max_disappear_frames + 2):
        monitor.process_frame(np.zeros((360, 640, 3), dtype=np.uint8), frame_idx=start_frame)


def test_entry_and_exit_times_recorded(monitor):
    """A person entering then leaving the shop produces entry_time + exit_time."""
    monitor.detector = _StubDetector([_person_det(0.10, 0.50)])  # inside shop, outside shelf

    # Frame 1: person enters shop zone -> entry_time set, not yet finalized.
    summary = monitor.process_frame(np.zeros((360, 640, 3), dtype=np.uint8), frame_idx=1)
    assert len(summary) == 1
    track = summary[0]
    assert track["in_shop"] is True
    assert track["entry_time"] is not None
    assert track["exit_time"] is None
    assert monitor.finished_records == []

    # Person leaves / disappears -> track finalized with exit_time.
    _disappear(monitor)

    assert len(monitor.finished_records) == 1
    rec = monitor.finished_records[0]
    assert rec.entry_time != ""
    assert rec.exit_time != ""
    assert rec.duration_seconds >= 0
    assert rec.theft_suspected is False  # never touched the shelf zone


def test_theft_suspected_when_shelf_interaction_before_exit(monitor):
    """Dwelling in the shelf zone then exiting flags theft_suspected=True."""
    monitor.detector = _StubDetector([_person_det(0.70, 0.50)])  # inside shelf zone

    # Person dwells in shelf zone -> shelf_interaction flagged.
    monitor.process_frame(np.zeros((360, 640, 3), dtype=np.uint8), frame_idx=1)
    track_summary = monitor.process_frame(np.zeros((360, 640, 3), dtype=np.uint8), frame_idx=2)
    assert track_summary[0]["shelf_interaction"] is True

    # Person disappears -> finalized as exit with theft suspected.
    _disappear(monitor)

    assert len(monitor.finished_records) == 1
    rec = monitor.finished_records[0]
    assert rec.shelf_interaction is True
    assert rec.theft_suspected is True
    assert rec.exit_time != ""
    assert rec.photo_path != ""  # one evidence photo captured


def test_no_theft_flag_without_exit(monitor):
    """Shelf interaction without exiting the shop does not flag theft."""
    monitor.detector = _StubDetector([_person_det(0.70, 0.50)])

    # Person stays in shelf zone; never exits -> nothing finalized yet.
    for i in range(1, 6):
        monitor.process_frame(np.zeros((360, 640, 3), dtype=np.uint8), frame_idx=i)

    assert monitor.finished_records == []
    active = monitor.get_active_tracks()
    assert len(active) == 1
    assert active[0]["shelf_interaction"] is True
    assert active[0]["theft_suspected"] is False


def test_one_photo_per_theft_incident(monitor, tmp_path):
    """Exactly one evidence photo (JPEG) is saved per suspected-theft incident."""
    frame = np.zeros((360, 640, 3), dtype=np.uint8)
    # Colored blob so the person crop is non-empty.
    frame[150:210, 440:500] = [0, 255, 0]
    monitor.detector = _StubDetector([_person_det(0.75, 0.50)])

    monitor.process_frame(frame, frame_idx=1)
    _disappear(monitor)

    assert len(monitor.finished_records) == 1
    rec = monitor.finished_records[0]
    assert rec.theft_suspected is True
    assert rec.photo_path != ""
    assert rec.photo_path.endswith(".jpg")

    jpgs = list(Path(monitor.evidence_dir).glob("*.jpg"))
    assert len(jpgs) == 1, f"expected exactly one photo, got {len(jpgs)}: {jpgs}"


def test_dataframe_columns_and_types(monitor):
    """The pandas DataFrame exposes entry_time, exit_time, and photo_path columns."""
    expected_columns = [
        "track_id", "camera_id", "entry_time", "exit_time", "duration_seconds",
        "shelf_interaction", "theft_suspected", "detector_confidence",
        "photo_path", "logged_at",
    ]

    # Empty monitor -> empty DataFrame with correct columns.
    df = monitor.to_dataframe()
    assert list(df.columns) == expected_columns
    assert len(df) == 0

    # After finalizing a record, the DataFrame gains a row.
    monitor.detector = _StubDetector([_person_det(0.70, 0.50)])
    monitor.process_frame(np.zeros((360, 640, 3), dtype=np.uint8), frame_idx=1)
    _disappear(monitor)

    df = monitor.to_dataframe()
    assert len(df) == 1
    assert list(df.columns) == expected_columns
    assert df.iloc[0]["entry_time"] != ""
    assert df.iloc[0]["exit_time"] != ""
    assert df.iloc[0]["photo_path"] != ""
    assert isinstance(df.iloc[0]["duration_seconds"], float)


def test_save_dataframe_writes_csv(monitor, tmp_path):
    """save_dataframe() persists the DataFrame to CSV on disk."""
    monitor.detector = _StubDetector([_person_det(0.70, 0.50)])
    monitor.process_frame(np.zeros((360, 640, 3), dtype=np.uint8), frame_idx=1)
    _disappear(monitor)

    out_path = tmp_path / "exported.csv"
    saved = monitor.save_dataframe(str(out_path))
    assert saved == str(out_path)
    assert out_path.exists()

    df = pd.read_csv(out_path)
    assert len(df) == 1
    assert "entry_time" in df.columns
    assert "exit_time" in df.columns
    assert "photo_path" in df.columns


def test_multiple_persons_each_get_a_row(monitor):
    """Two distinct persons produce two rows, each with entry and exit times."""
    monitor.detector = _StubDetector([_person_det(0.15, 0.50), _person_det(0.80, 0.50)])

    for i in range(1, 4):
        monitor.process_frame(np.zeros((360, 640, 3), dtype=np.uint8), frame_idx=i)

    # Remove detections so both tracks disappear and finalize.
    _disappear(monitor, start_frame=4)

    assert len(monitor.finished_records) == 2
    df = monitor.to_dataframe()
    assert len(df) == 2
    assert all(t != "" for t in df["entry_time"])
    assert all(t != "" for t in df["exit_time"])
    assert set(df["track_id"]) == {"person-1", "person-2"}
