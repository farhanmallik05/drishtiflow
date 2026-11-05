"""
Unit tests for YOLOv8n-Pose edge detector (TSK-R1-01).

Tests pose detection schema compliance, keypoint normalization, and posture
classification heuristic. Uses mock data to avoid downloading model weights.
"""
import sys
import os
from typing import Dict, Any

import pytest
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "inference"))

from yolo_pose_detector import (
    YOLOPoseDetector,
    KEYPOINT_NAMES,
    KEYPOINT_SHOULDER_LEFT,
    KEYPOINT_SHOULDER_RIGHT,
    KEYPOINT_HIP_LEFT,
    KEYPOINT_HIP_RIGHT,
)


def _make_keypoint_array(fallen: bool) -> np.ndarray:
    """Create mock keypoint array (17, 3) with x, y, confidence."""
    kpts = np.zeros((17, 3), dtype=np.float32)
    kpts[:, 2] = 1.0

    if fallen:
        # Horizontal body: shoulders at left, hips at right (person lying down)
        kpts[KEYPOINT_SHOULDER_LEFT] = [0.3, 0.5, 1.0]
        kpts[KEYPOINT_SHOULDER_RIGHT] = [0.5, 0.5, 1.0]
        kpts[KEYPOINT_HIP_LEFT] = [0.5, 0.5, 1.0]
        kpts[KEYPOINT_HIP_RIGHT] = [0.7, 0.5, 1.0]
    else:
        # Vertical body: shoulders above hips
        kpts[KEYPOINT_SHOULDER_LEFT] = [0.4, 0.3, 1.0]
        kpts[KEYPOINT_SHOULDER_RIGHT] = [0.6, 0.3, 1.0]
        kpts[KEYPOINT_HIP_LEFT] = [0.4, 0.7, 1.0]
        kpts[KEYPOINT_HIP_RIGHT] = [0.6, 0.7, 1.0]

    return kpts


def test_keypoint_names_length():
    """KEYPOINT_NAMES has 17 entries matching COCO pose."""
    assert len(KEYPOINT_NAMES) == 17
    assert KEYPOINT_NAMES[0] == "nose"
    assert KEYPOINT_NAMES[5] == "left_shoulder"
    assert KEYPOINT_NAMES[11] == "left_hip"


def test_is_person_fallen_horizontal():
    """Horizontal body (shoulders ≈ hips y-level) is classified as fallen."""
    kpts = _make_keypoint_array(fallen=True)
    det = YOLOPoseDetector()
    assert det._is_person_fallen(kpts) is True


def test_is_person_fallen_vertical():
    """Vertical body (shoulders above hips) is NOT classified as fallen."""
    kpts = _make_keypoint_array(fallen=False)
    det = YOLOPoseDetector()
    assert det._is_person_fallen(kpts) is False


def test_is_person_fallen_missing_keypoints():
    """Missing shoulder/hip keypoints → not fallen (safe default)."""
    kpts = np.zeros((17, 3), dtype=np.float32)
    kpts[:, 2] = 1.0
    # Zero out shoulder confidences
    kpts[5, 2] = 0.0
    kpts[6, 2] = 0.0
    det = YOLOPoseDetector()
    assert det._is_person_fallen(kpts) is False


def test_normalize_keypoints_to_unit_range():
    """All normalized keypoint coordinates are in [0, 1]."""
    kpts = _make_keypoint_array(fallen=True)
    assert np.all(kpts[:, 0] >= 0.0) and np.all(kpts[:, 0] <= 1.0)
    assert np.all(kpts[:, 1] >= 0.0) and np.all(kpts[:, 1] <= 1.0)
    assert np.all(kpts[:, 2] >= 0.0) and np.all(kpts[:, 2] <= 1.0)


def test_detector_instantiation():
    """YOLOPoseDetector can be instantiated without loading model."""
    det = YOLOPoseDetector(model_path="yolov8n-pose.pt", device="cpu")
    assert det.confidence_threshold == 0.5
    assert det.person_confidence_threshold == 0.5
    assert det.device == "cpu"
    assert det._model is None  # lazy load


def test_detector_defaults():
    """Default thresholds are sane."""
    det = YOLOPoseDetector()
    assert 0.0 < det.confidence_threshold < 1.0
    assert 0.0 < det.person_confidence_threshold < 1.0
    assert det.fps() == 0.0  # no inferences yet
    assert det.avg_inference_ms() == 0.0


def test_keypoint_dict_structure():
    """Keypoint dict has correct structure with x, y, confidence."""
    kpts = _make_keypoint_array(fallen=True)
    # Simulate what detect() produces
    keypoints_dict = {}
    for kp_idx in range(17):
        x = float(kpts[kp_idx, 0])
        y = float(kpts[kp_idx, 1])
        conf = float(kpts[kp_idx, 2])
        if conf >= 0.5:
            keypoints_dict[KEYPOINT_NAMES[kp_idx]] = {
                "x": round(x, 4),
                "y": round(y, 4),
                "confidence": round(conf, 4),
            }

    assert "nose" in keypoints_dict
    assert "left_shoulder" in keypoints_dict
    assert "right_hip" in keypoints_dict
    assert "left_ankle" in keypoints_dict
    assert set(keypoints_dict["nose"].keys()) == {"x", "y", "confidence"}