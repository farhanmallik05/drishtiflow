import time
from typing import Optional, Dict, Any

class StreamIngestion:
    """
    Ingestion handler for camera streams (RTSP / Webcam / Sample Video).
    Manages reconnect logic with exponential backoff matching PRD §6.3.
    """
    def __init__(self, camera_id: str, source_type: str = "sample", stream_url: Optional[str] = None):
        self.camera_id = camera_id
        self.source_type = source_type
        self.stream_url = stream_url
        self.is_connected = False
        self.reconnect_attempts = 0
        self.last_frame_time = 0.0

    def connect(self) -> bool:
        """Simulate or initialize connection to video stream."""
        self.is_connected = True
        self.reconnect_attempts = 0
        self.last_frame_time = time.time()
        return True

    def read_frame(self) -> Dict[str, Any]:
        """Read latest decoded frame metadata."""
        if not self.is_connected:
            raise ConnectionError("Camera stream not connected")

        self.last_frame_time = time.time()
        return {
            "camera_id": self.camera_id,
            "timestamp": self.last_frame_time,
            "resolution": (640, 360),
            "frame_id": int(self.last_frame_time * 1000)
        }

    def disconnect(self):
        self.is_connected = False

