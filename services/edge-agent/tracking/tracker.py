import time
from typing import Dict, Any, Optional

class DwellTracker:
    """
    Tracks persistence of candidate detections within restricted zones
    to eliminate boundary flicker and false positives (PRD §6.4).
    """
    def __init__(self, required_dwell_seconds: float = 1.5):
        self.required_dwell_seconds = required_dwell_seconds
        self.active_tracks: Dict[str, float] = {}

    def update(self, object_id: str) -> bool:
        """
        Record observation. Returns True if object has resided in zone
        for >= required_dwell_seconds.
        """
        now = time.time()
        if object_id not in self.active_tracks:
            self.active_tracks[object_id] = now
            return False

        first_seen = self.active_tracks[object_id]
        dwell_duration = now - first_seen

        return dwell_duration >= self.required_dwell_seconds

    def reset(self, object_id: Optional[str] = None):
        if object_id:
            self.active_tracks.pop(object_id, None)
        else:
            self.active_tracks.clear()

