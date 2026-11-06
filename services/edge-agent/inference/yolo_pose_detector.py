"""
Real-time YOLOv8n-Pose edge detector for DrishtiFlow fall detection.

Wraps Ultralytics YOLOv8n-Pose (pose estimation model) and converts raw
model output into normalized keypoints (x, y, confidence in [0,1]) that feed
into the fall state machine for posture classification.

Restricted to person class (COCO class 0) for fall detection use case.
"""
from __future__ import annotations

import time
from typing import Dict, Any, List, Optional

import cv2
import numpy as np
try:
    from ultralytics import YOLO
except (ImportError, OSError):
    YOLO = None

# COCO keypoint indices (17 keypoints per person)
# 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear,
# 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow,
# 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip,
# 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle

KEYPOINT_NAMES = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle",
]

# Keypoint indices used for fall detection posture analysis
KEYPOINT_SHOULDER_LEFT = 5
KEYPOINT_SHOULDER_RIGHT = 6
KEYPOINT_HIP_LEFT = 11
KEYPOINT_HIP_RIGHT = 12
KEYPOINT_KNEE_LEFT = 13
KEYPOINT_KNEE_RIGHT = 14
KEYPOINT_ANKLE_LEFT = 15
KEYPOINT_ANKLE_RIGHT = 16
KEYPOINT_NOSE = 0


class YOLOPoseDetector:
    """
    Edge-vision pose detector backed by Ultralytics YOLOv8n-Pose.

    Parameters
    ----------
    model_path : str
        Path to ``yolov8n-pose.pt`` (auto-downloaded by Ultralytics on first run if absent).
    confidence_threshold : float
        Minimum per-keypoint confidence to consider a keypoint valid (default 0.5).
    person_confidence_threshold : float
        Minimum overall person detection confidence (default 0.5).
    device : str
        Inference device (e.g. ``'cpu'`` or ``'0'`` for CUDA). Defaults to ``'cpu'``.
    """

    def __init__(
        self,
        model_path: str = "yolov8n-pose.pt",
        confidence_threshold: float = 0.5,
        person_confidence_threshold: float = 0.5,
        device: str = "cpu",
        fall_angle_threshold: float = 0.8,
    ):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.person_confidence_threshold = person_confidence_threshold
        self.device = device
        self.fall_angle_threshold = fall_angle_threshold

        # Lazy-loaded on first inference so module import stays cheap.
        self._model: Optional[YOLO] = None
        self.inference_ms: List[float] = []

    @property
    def model(self) -> YOLO:
        if self._model is None:
            self._model = YOLO(self.model_path)
        return self._model

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Run YOLOv8n-Pose inference on a single BGR frame.

        Returns a list of person poses shaped for the fall detection pipeline:
            {
                "confidence": float,              # overall person detection confidence
                "bounding_box": {...},             # [0,1]-normalized bbox
                "keypoints": {                     # [0,1]-normalized keypoints
                    "nose": {"x": float, "y": float, "confidence": float},
                    ...
                },
                "keypoint_array": np.ndarray,      # (17, 3) array of [x, y, confidence]
                "is_fallen": bool,                 # quick posture heuristic
            }
        """
        if self._model is None:
            self._model = YOLO(self.model_path)

        t0 = time.perf_counter()
        results = self.model.predict(frame, device=self.device, verbose=False)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        self.inference_ms.append(elapsed_ms)
        if len(self.inference_ms) > 1000:
            self.inference_ms = self.inference_ms[-1000:]

        detections: List[Dict[str, Any]] = []
        if not results or len(results[0].keypoints) == 0:
            return detections

        h, w = frame.shape[:2]
        keypoints_data = results[0].keypoints
        boxes = results[0].boxes

        num_people = len(keypoints_data.data)
        for i in range(num_people):
            # Overall person confidence from box
            person_conf = float(boxes.conf[i].item()) if boxes is not None else 1.0
            if person_conf < self.person_confidence_threshold:
                continue

            # Bounding box (normalized)
            xyxy = boxes.xyxy[i].tolist() if boxes is not None else [0, 0, w, h]
            bbox = {
                "x_min": round(xyxy[0] / w, 4),
                "y_min": round(xyxy[1] / h, 4),
                "x_max": round(xyxy[2] / w, 4),
                "y_max": round(xyxy[3] / h, 4),
            }

            # Keypoints (normalized)
            kpts = keypoints_data.data[i]  # (17, 3) tensor: [x, y, conf]
            kpts_np = kpts.cpu().numpy() if hasattr(kpts, 'cpu') else np.array(kpts)

            keypoints_dict: Dict[str, Any] = {}
            keypoint_array = np.zeros((17, 3), dtype=np.float32)

            for kp_idx in range(17):
                x = float(kpts_np[kp_idx, 0]) / w
                y = float(kpts_np[kp_idx, 1]) / h
                conf = float(kpts_np[kp_idx, 2])
                keypoint_array[kp_idx] = [x, y, conf]

                if conf >= self.confidence_threshold:
                    keypoints_dict[KEYPOINT_NAMES[kp_idx]] = {
                        "x": round(x, 4),
                        "y": round(y, 4),
                        "confidence": round(conf, 4),
                    }

            # Quick posture heuristic: is the person fallen?
            is_fallen = self._is_person_fallen(keypoint_array)

            detections.append(
                {
                    "confidence": round(person_conf, 4),
                    "bounding_box": bbox,
                    "keypoints": keypoints_dict,
                    "keypoint_array": keypoint_array,
                    "is_fallen": is_fallen,
                }
            )

        return detections

    def _is_person_fallen(self, keypoint_array: np.ndarray) -> bool:
        """
        Quick heuristic: person is fallen if body is horizontal.
        Compares shoulder-hip line angle to horizontal.
        """
        # Get shoulder and hip centers (average of left/right)
        sh_l = keypoint_array[KEYPOINT_SHOULDER_LEFT]
        sh_r = keypoint_array[KEYPOINT_SHOULDER_RIGHT]
        hip_l = keypoint_array[KEYPOINT_HIP_LEFT]
        hip_r = keypoint_array[KEYPOINT_HIP_RIGHT]

        # Check if keypoints are valid (confidence > 0)
        if sh_l[2] <= 0 or sh_r[2] <= 0 or hip_l[2] <= 0 or hip_r[2] <= 0:
            return False

        shoulder_center_y = (sh_l[1] + sh_r[1]) / 2.0
        hip_center_y = (hip_l[1] + hip_r[1]) / 2.0
        shoulder_center_x = (sh_l[0] + sh_r[0]) / 2.0
        hip_center_x = (hip_l[0] + hip_r[0]) / 2.0

        # Body is vertical if shoulder_y < hip_y (shoulder above hip in image coords)
        # Body is horizontal if shoulder_y ≈ hip_y (fallen)
        # Use y-difference relative to body width
        body_height = abs(shoulder_center_y - hip_center_y)
        body_width = abs(shoulder_center_x - hip_center_x)

        # Person is fallen if body is wider than tall (horizontal aspect ratio)
        # body_height >= 0 always (can be 0 for perfectly horizontal)
        if body_height > 0:
            aspect_ratio = body_width / body_height
        else:
            # Perfectly horizontal: height is 0, width > 0 → definitely fallen
            aspect_ratio = float("inf") if body_width > 0 else 0.0

        # Threshold: if width > height * 0.8, likely fallen
        return bool(aspect_ratio > self.fall_angle_threshold)

    def avg_inference_ms(self) -> float:
        return float(sum(self.inference_ms) / len(self.inference_ms)) if self.inference_ms else 0.0

    def fps(self) -> float:
        avg = self.avg_inference_ms()
        return round(1000.0 / avg, 1) if avg > 0 else 0.0
