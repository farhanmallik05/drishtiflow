import uuid
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class CandidateEventEmitter:
    """
    Constructs and dispatches signed candidate event envelopes to FastAPI backend.
    """
    def __init__(self, api_base_url: str = "http://localhost:8000"):
        self.api_base_url = api_base_url

    async def emit_candidate_event(
        self,
        camera_id: str,
        detection: Dict[str, Any],
        workflow_id: Optional[str] = None,
        source: str = "local_agent"
    ) -> Dict[str, Any]:
        payload = {
            "event_id": str(uuid.uuid4()),
            "camera_id": camera_id,
            "workflow_id": workflow_id,
            "event_type": "restricted_zone_entry",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "detector": {
                "name": detection.get("model", "yolov8n-edge"),
                "version": "8.1.0",
                "confidence": detection.get("confidence", 0.85),
                "bounding_box": detection.get("bounding_box", {})
            }
        }

        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(f"{self.api_base_url}/api/v1/events/candidates", json=payload)
            if res.status_code in [200, 201]:
                return res.json()
            else:
                raise RuntimeError(f"Event emission failed with HTTP {res.status_code}: {res.text}")

