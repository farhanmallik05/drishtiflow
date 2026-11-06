from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional, Tuple, Union

import numpy as np

try:  # OpenCV is required for real sources, but sample mode must work without it.
    import cv2
except ImportError:  # pragma: no cover - exercised only in minimal installs
    cv2 = None  # type: ignore[assignment]


class StreamIngestion:
    """
    Camera & RTSP stream ingestion handler for the DrishtiFlow Edge Agent.

    Supports:
    - 'sample': Synthetic frame metadata mode (preserves unit-test compatibility without hardware).
    - 'webcam': Local USB / laptop webcam via OpenCV device index (e.g., 0, 1).
    - 'rtsp' / 'http' / 'file': Live RTSP CCTV stream, HTTP IP webcam, or local MP4 file via OpenCV.

    Reconnection uses bounded exponential backoff (PRD §6.3): the delay doubles on each
    failed attempt up to ``max_reconnect_delay_sec``.
    """

    def __init__(
        self,
        camera_id: str,
        source_type: str = "sample",
        stream_url: Optional[str] = None,
        target_resolution: Tuple[int, int] = (640, 360),
        reconnect_delay_sec: float = 2.0,
        max_reconnect_delay_sec: float = 30.0,
    ) -> None:
        self.camera_id = camera_id
        self.source_type = source_type.lower().strip()
        self.stream_url = stream_url
        self.target_resolution = target_resolution
        self.reconnect_delay_sec = reconnect_delay_sec
        self.max_reconnect_delay_sec = max_reconnect_delay_sec

        self.is_connected: bool = False
        self.reconnect_attempts: int = 0
        self.last_frame_time: float = 0.0
        self.frame_count: int = 0
        self._cap: Any = None
        self._yolo_model: Any = None

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    def _resolve_opencv_source(self) -> Union[int, str]:
        """Resolves stream_url and source_type into an OpenCV VideoCapture source."""
        if self.source_type == "webcam":
            if self.stream_url and str(self.stream_url).isdigit():
                return int(str(self.stream_url))
            return 0

        if self.stream_url in (None, "", "webcam"):
            if self.source_type in ("sample", "webcam"):
                return 0
            raise ValueError(
                f"source_type '{self.source_type}' requires an explicit stream_url"
            )

        url = str(self.stream_url).strip()
        if url.isdigit():
            return int(url)
        return url

    def connect(self) -> bool:
        """Connects to the configured video source or initializes synthetic sample mode."""
        if self.source_type == "sample" and not self.stream_url:
            self.is_connected = True
            self.reconnect_attempts = 0
            self.last_frame_time = time.time()
            return True

        if cv2 is None:
            self.is_connected = False
            return False

        try:
            source = self._resolve_opencv_source()
        except ValueError:
            self.is_connected = False
            return False

        self.disconnect()

        cap = cv2.VideoCapture(source)
        if isinstance(source, str) and source.startswith("rtsp://"):
            # Minimize internal OpenCV buffer latency on live RTSP streams
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not cap.isOpened():
            try:
                cap.release()
            except Exception:
                pass
            self.is_connected = False
            self._cap = None
            self.reconnect_attempts += 1
            return False

        self._cap = cap
        self.is_connected = True
        self.reconnect_attempts = 0
        self.last_frame_time = time.time()
        return True

    def _reconnect_with_backoff(self) -> bool:
        """Waits for the next backoff window, then attempts one reconnect."""
        delay = min(
            self.reconnect_delay_sec * (2 ** max(0, self.reconnect_attempts - 1)),
            self.max_reconnect_delay_sec,
        )
        time.sleep(delay)
        return self.connect()

    def disconnect(self) -> None:
        """Releases the underlying OpenCV VideoCapture handle cleanly."""
        if self._cap is not None:
            try:
                self._cap.release()
            except Exception:
                pass
            self._cap = None
        self.is_connected = False

    # ------------------------------------------------------------------
    # Frame reading
    # ------------------------------------------------------------------

    def read_frame(self, include_raw_frame: bool = False) -> Optional[Dict[str, Any]]:
        """
        Reads the next frame from the stream.

        Returns a dictionary compatible with existing DrishtiFlow edge pipelines:
        {
            "camera_id": str,
            "timestamp": float,
            "resolution": (width, height),
            "frame_id": int,
            "frame": np.ndarray (optional, when include_raw_frame=True)
        }

        Raises ``ConnectionError`` when called before a successful ``connect()``,
        preserving the original edge-agent contract.
        """
        if not self.is_connected:
            raise ConnectionError("Camera stream not connected")

        # Preserve fast synthetic behavior when running unit tests in 'sample' mode
        if self.source_type == "sample" and self._cap is None:
            self.last_frame_time = time.time()
            self.frame_count += 1
            payload: Dict[str, Any] = {
                "camera_id": self.camera_id,
                "timestamp": self.last_frame_time,
                "resolution": self.target_resolution,
                "frame_id": int(self.last_frame_time * 1000),
            }
            if include_raw_frame:
                width, height = self.target_resolution
                payload["frame"] = np.zeros((height, width, 3), dtype=np.uint8)
            return payload

        if self._cap is None or not self._cap.isOpened():
            if not self.connect():
                return None

        ok, frame = self._cap.read()
        if not ok or frame is None:
            # Attempt a single backoff reconnect for live RTSP/HTTP streams
            if not self._reconnect_with_backoff() or self._cap is None:
                return None
            ok, frame = self._cap.read()
            if not ok or frame is None:
                return None

        if self.target_resolution and cv2 is not None:
            frame = cv2.resize(frame, self.target_resolution)

        self.last_frame_time = time.time()
        self.frame_count += 1
        height, width = frame.shape[:2]

        result: Dict[str, Any] = {
            "camera_id": self.camera_id,
            "timestamp": self.last_frame_time,
            "resolution": (width, height),
            "frame_id": int(self.last_frame_time * 1000),
        }
        if include_raw_frame:
            result["frame"] = frame
        return result

    # ------------------------------------------------------------------
    # YOLOv8 annotation
    # ------------------------------------------------------------------

    def _load_yolo_model(self, model_path: str = "yolov8n.pt") -> Any:
        """
        Lazily loads Ultralytics YOLOv8 weights for live bounding-box annotation.

        Returns ``None`` when Ultralytics is not installed so that streaming still
        works without the optional edge-vision dependency.
        """
        if self._yolo_model is not None:
            return self._yolo_model

        try:
            from ultralytics import YOLO
        except ImportError:
            return None

        candidate_paths = [
            Path(model_path),
            Path(__file__).resolve().parents[3] / model_path,
            Path(__file__).resolve().parents[1] / model_path,
        ]
        resolved = next((str(p) for p in candidate_paths if p.exists()), model_path)
        self._yolo_model = YOLO(resolved)
        return self._yolo_model

    def annotate_frame_with_yolo(
        self,
        frame: np.ndarray,
        conf_threshold: float = 0.35,
        model_path: str = "yolov8n.pt",
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Runs YOLOv8 inference on a single BGR frame and draws bounding boxes + labels.
        Returns (annotated_frame, detections_list). Degrades to a passthrough when
        Ultralytics or the model weights are unavailable.
        """
        annotated = frame.copy()
        detections: List[Dict[str, Any]] = []

        if cv2 is None:
            return annotated, detections

        model = self._load_yolo_model(model_path=model_path)
        if model is None:
            return annotated, detections

        try:
            results = model.predict(source=annotated, conf=conf_threshold, verbose=False)
        except Exception:
            return annotated, detections

        height, width = annotated.shape[:2]
        for res in results:
            boxes = getattr(res, "boxes", None)
            names = getattr(res, "names", {})
            if boxes is None:
                continue

            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy().astype(int)
                x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                label_name = names.get(cls_id, str(cls_id))

                detections.append(
                    {
                        "label": label_name,
                        "confidence": round(conf, 3),
                        "bbox_norm": {
                            "x_min": round(x1 / max(width, 1), 4),
                            "y_min": round(y1 / max(height, 1), 4),
                            "x_max": round(x2 / max(width, 1), 4),
                            "y_max": round(y2 / max(height, 1), 4),
                        },
                    }
                )

                color = (16, 185, 129) if label_name == "person" else (59, 130, 246)
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                caption = f"{label_name} ({conf:.2f})"
                (tw, th), _ = cv2.getTextSize(caption, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                cv2.rectangle(
                    annotated,
                    (x1, max(0, y1 - th - 8)),
                    (x1 + tw + 6, y1),
                    color,
                    -1,
                )
                cv2.putText(
                    annotated,
                    caption,
                    (x1 + 3, max(12, y1 - 4)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA,
                )

        return annotated, detections

    # ------------------------------------------------------------------
    # MJPEG streaming
    # ------------------------------------------------------------------

    def iter_mjpeg_frames(
        self,
        annotate_yolo: bool = False,
        frame_stride: int = 3,
        jpeg_quality: int = 75,
        max_fps: float = 30.0,
    ) -> Generator[bytes, None, None]:
        """
        Generator yielding multipart MJPEG byte chunks for HTTP StreamingResponse.

        Runs YOLOv8 every ``frame_stride`` frames when ``annotate_yolo=True`` so that
        inference cost does not cap playback FPS, and re-draws cached boxes on the
        frames in between.
        """
        if cv2 is None:
            return

        if not self.is_connected and not self.connect():
            return

        last_detections: List[Dict[str, Any]] = []
        idx = 0
        frame_period = 1.0 / max_fps if max_fps > 0 else 0.0

        try:
            while True:
                started = time.perf_counter()
                try:
                    packet = self.read_frame(include_raw_frame=True)
                except ConnectionError:
                    break

                if packet is None or "frame" not in packet:
                    break

                frame: np.ndarray = packet["frame"]
                if annotate_yolo:
                    if idx % max(1, frame_stride) == 0:
                        frame, last_detections = self.annotate_frame_with_yolo(frame)
                    else:
                        # Re-draw cached detections on intermediate frames for smooth playback
                        height, width = frame.shape[:2]
                        for det in last_detections:
                            b = det["bbox_norm"]
                            x1, y1 = int(b["x_min"] * width), int(b["y_min"] * height)
                            x2, y2 = int(b["x_max"] * width), int(b["y_max"] * height)
                            color = (16, 185, 129) if det["label"] == "person" else (59, 130, 246)
                            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                            cv2.putText(
                                frame,
                                f"{det['label']} ({det['confidence']:.2f})",
                                (x1 + 3, max(14, y1 - 5)),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.5,
                                color,
                                1,
                                cv2.LINE_AA,
                            )

                idx += 1
                ok, encoded = cv2.imencode(
                    ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality]
                )
                if not ok:
                    continue

                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + encoded.tobytes() + b"\r\n"
                )

                # Pace playback so file sources do not peg a CPU core.
                elapsed = time.perf_counter() - started
                if frame_period and elapsed < frame_period:
                    time.sleep(frame_period - elapsed)
        finally:
            self.disconnect()
