"""
Real-time YOLOv8n edge object detector for DrishtiFlow.

Wraps Ultralytics YOLOv8n (6.2 MB, ~39 ms/frame on CPU) and converts raw
model output into normalized bounding boxes (x_min, y_min, x_max, y_max in [0,1])
that feed directly into the existing ``EdgeDetector`` zone-PiP filter and the
``CandidateEventEmitter`` envelope.

Restricted to allowlisted detector classes shared with
``packages/workflow-schema``: person, vehicle, car, truck, motorcycle, animal.
"""
from __future__ import annotations

import time
from pathlib import Path
from typing import Dict, Any, List, Optional

import cv2
import numpy as np
from ultralytics import YOLO

# Map COCO class index -> schema-allowed class name (matches workflow-schema.z.ts)
COCO_CLASS_MAP = {
    0: "person",
    2: "car",
    3: "motorcycle",
    5: "bus",        # -> normalized to 'vehicle'
    7: "truck",      # -> normalized to 'vehicle'
}

VEHICLE_CLASSES = {"car", "motorcycle", "bus", "truck"}

ALLOWED_CLASSES = {"person", "vehicle", "car", "truck", "motorcycle", "animal"}


class YOLOEdgeDetector:
    """
    Edge-vision detector backed by Ultralytics YOLOv8n.

    Parameters
    ----------
    model_path : str
        Path to ``yolov8n.pt`` (auto-downloaded by Ultralytics on first run if absent).
    confidence_threshold : float
        Minimum per-box confidence to emit a detection (default 0.55, matching
        the compiled vernacular rule default).
    device : str
        Inference device (e.g. ``'cpu'`` or ``'0'`` for CUDA). Defaults to ``'cpu'``
        so the hackathon demo runs on any laptop without GPU.
    """

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        confidence_threshold: float = 0.55,
        device: str = "cpu",
    ):
        self.confidence_threshold = confidence_threshold
        self.device = device

        # Resolve the model path robustly: check as-is first, then relative to
        # the repo root (so it works when the pipeline runs as a subprocess
        # from a different working directory, e.g. services/api/).
        resolved = self._resolve_model_path(model_path)
        self.model_path = str(resolved)

        # Lazy-loaded on first inference so module import stays cheap.
        self._model: Optional[YOLO] = None
        self.inference_ms: List[float] = []

    @staticmethod
    def _resolve_model_path(model_path: str) -> Path:
        """Find yolov8n.pt: as-is, or relative to the repo root."""
        p = Path(model_path)
        if p.is_absolute() and p.exists():
            return p
        if p.exists():
            return p.resolve()
        # Try repo root: services/edge-agent/inference/yolo_detector.py -> parents[3]
        repo_root = Path(__file__).resolve().parents[3]
        alt = repo_root / model_path
        if alt.exists():
            return alt
        # Fall back to the original path (Ultralytics will attempt download).
        return p

    @property
    def model(self) -> YOLO:
        if self._model is None:
            self._model = YOLO(self.model_path)
        return self._model

    def _normalize_class(self, coco_id: int, raw_name: str) -> str:
        """Map raw YOLO class names into the shared allowlisted enum."""
        mapped = COCO_CLASS_MAP.get(coco_id, raw_name.lower())
        if mapped in VEHICLE_CLASSES:
            return "vehicle"
        return mapped if mapped in ALLOWED_CLASSES else "person"

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Run YOLOv8n inference on a single BGR frame.

        Returns a list of detections shaped for the rest of the pipeline:
            {
                "class": "person" | "vehicle" | ...,
                "confidence": float,
                "bounding_box": {"x_min": 0..1, "y_min": 0..1, "x_max": 0..1, "y_max": 0..1}
            }
        """
        if self._model is None:
            self._model = YOLO(self.model_path)

        t0 = time.perf_counter()
        results = self.model.predict(frame, device=self.device, verbose=False)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        self.inference_ms.append(elapsed_ms)
        # Keep a rolling window so telemetry stays bounded.
        if len(self.inference_ms) > 1000:
            self.inference_ms = self.inference_ms[-1000:]

        detections: List[Dict[str, Any]] = []
        if not results or len(results[0].boxes) == 0:
            return detections

        h, w = frame.shape[:2]
        boxes = results[0].boxes

        for i in range(len(boxes)):
            conf = float(boxes.conf[i].item())
            if conf < self.confidence_threshold:
                continue

            coco_id = int(boxes.cls[i].item())
            class_name = self._normalize_class(coco_id, results[0].names[coco_id])

            xyxy = boxes.xyxy[i].tolist()  # [x_min, y_min, x_max, y_max] in pixels
            detections.append(
                {
                    "class": class_name,
                    "confidence": round(conf, 4),
                    "bounding_box": {
                        "x_min": round(xyxy[0] / w, 4),
                        "y_min": round(xyxy[1] / h, 4),
                        "x_max": round(xyxy[2] / w, 4),
                        "y_max": round(xyxy[3] / h, 4),
                    },
                }
            )

        return detections

    def avg_inference_ms(self) -> float:
        return float(sum(self.inference_ms) / len(self.inference_ms)) if self.inference_ms else 0.0

    def fps(self) -> float:
        avg = self.avg_inference_ms()
        return round(1000.0 / avg, 1) if avg > 0 else 0.0
