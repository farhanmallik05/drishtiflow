import sys
import os
import time

# Add services/edge-agent to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingest.stream import StreamIngestion
from inference.detector import EdgeDetector, is_point_in_polygon
from tracking.tracker import DwellTracker

def test_stream_ingest():
    stream = StreamIngestion(camera_id="cam-test", source_type="sample")
    assert stream.connect() is True
    frame = stream.read_frame()
    assert frame["camera_id"] == "cam-test"
    assert frame["resolution"] == (640, 360)
    stream.disconnect()
    assert stream.is_connected is False

def test_ray_casting_point_in_polygon():
    # Square zone from (0.2, 0.2) to (0.8, 0.8)
    polygon = [(0.2, 0.2), (0.8, 0.2), (0.8, 0.8), (0.2, 0.8)]

    # Point clearly inside
    assert is_point_in_polygon((0.5, 0.5), polygon) is True
    # Point clearly outside
    assert is_point_in_polygon((0.1, 0.1), polygon) is False
    assert is_point_in_polygon((0.9, 0.5), polygon) is False

def test_edge_detector_zone_evaluation():
    detector = EdgeDetector(confidence_threshold=0.60)
    polygon = [(0.3, 0.3), (0.7, 0.3), (0.7, 0.7), (0.3, 0.7)]

    detections = [
        # Inside polygon (feet at 0.5, 0.6) with confidence 0.85
        {
            "class": "person",
            "confidence": 0.85,
            "bounding_box": {"x_min": 0.45, "y_min": 0.4, "x_max": 0.55, "y_max": 0.6}
        },
        # Outside polygon (feet at 0.15, 0.5)
        {
            "class": "person",
            "confidence": 0.85,
            "bounding_box": {"x_min": 0.1, "y_min": 0.3, "x_max": 0.2, "y_max": 0.5}
        },
        # Inside polygon but low confidence (0.40)
        {
            "class": "person",
            "confidence": 0.40,
            "bounding_box": {"x_min": 0.45, "y_min": 0.4, "x_max": 0.55, "y_max": 0.6}
        }
    ]

    breaches = detector.evaluate_detections_in_zone(detections, polygon)
    assert len(breaches) == 1
    assert breaches[0]["confidence"] == 0.85

def test_dwell_persistence():
    tracker = DwellTracker(required_dwell_seconds=0.2)
    obj_id = "person-track-01"

    # First observation should not trigger
    assert tracker.update(obj_id) is False

    # Wait for dwell window to pass
    time.sleep(0.25)

    # Subsequent observation triggers persistent dwell breach
    assert tracker.update(obj_id) is True
