"""
Fall Monitoring API Router for DrishtiFlow R1.

Endpoints:
- GET /api/v1/fall-monitor          - Fall status per camera
- POST /api/v1/fall-monitor/events   - Ingest fall detection events from edge agent
- POST /api/v1/fall-monitor/emergency - Manual emergency trigger to hospital reception
"""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/v1/fall-monitor", tags=["Fall Monitoring"])

# Fall state constants
STATE_STANDING = "standing"
STATE_FALLEN_DETECTED = "fallen_detected"
STATE_EMERGENCY_TRIGGER = "emergency_trigger"

# In-memory store for fall events (in production, this would be a database table)
_fall_events: List[Dict[str, Any]] = []
_fall_status: Dict[str, Dict[str, Any]] = {}  # camera_id -> latest status


class FallEventIngest(BaseModel):
    """Candidate fall event from edge agent."""
    event_id: str
    camera_id: str
    track_id: str
    state: str  # standing | fallen_detected | emergency_trigger
    entered_fallen_at: Optional[str] = None
    emergency_triggered_at: Optional[str] = None
    duration_fallen_seconds: Optional[float] = None
    confidence: float = 0.0
    bounding_box: Optional[Dict[str, float]] = None
    occurred_at: str


class EmergencyTrigger(BaseModel):
    """Manual emergency trigger from Fall Monitor UI."""
    camera_id: str
    track_id: Optional[str] = None
    message: Optional[str] = None


class FallStatus(BaseModel):
    """Current fall status for a camera."""
    camera_id: str
    active_falls: List[Dict[str, Any]]
    total_events: int
    last_emergency_at: Optional[str] = None


@router.get("", response_model=List[FallStatus])
def list_fall_status():
    """Get current fall status for all cameras with active falls."""
    results = []
    for cam_id, status in _fall_status.items():
        results.append(FallStatus(
            camera_id=cam_id,
            active_falls=status.get("active_falls", []),
            total_events=status.get("total_events", 0),
            last_emergency_at=status.get("last_emergency_at"),
        ))
    return results


@router.get("/{camera_id}", response_model=FallStatus)
def get_fall_status(camera_id: str):
    """Get fall status for a specific camera."""
    if camera_id not in _fall_status:
        return FallStatus(
            camera_id=camera_id,
            active_falls=[],
            total_events=0,
            last_emergency_at=None,
        )
    status = _fall_status[camera_id]
    return FallStatus(
        camera_id=camera_id,
        active_falls=status.get("active_falls", []),
        total_events=status.get("total_events", 0),
        last_emergency_at=status.get("last_emergency_at"),
    )


@router.post("/events", status_code=201)
def ingest_fall_event(event: FallEventIngest):
    """Ingest a fall detection event from the edge agent."""
    event_dict = event.model_dump()
    event_dict["received_at"] = datetime.now(timezone.utc).isoformat()
    _fall_events.append(event_dict)

    # Update camera status
    if event.camera_id not in _fall_status:
        _fall_status[event.camera_id] = {
            "active_falls": [],
            "total_events": 0,
            "last_emergency_at": None,
        }
    cam_status = _fall_status[event.camera_id]
    cam_status["total_events"] += 1

    if event.state == STATE_FALLEN_DETECTED:
        # Add to active falls
        active = cam_status.get("active_falls", [])
        active.append({
            "track_id": event.track_id,
            "state": event.state,
            "entered_fallen_at": event.entered_fallen_at,
            "confidence": event.confidence,
            "bounding_box": event.bounding_box,
        })
        cam_status["active_falls"] = active

    elif event.state == STATE_EMERGENCY_TRIGGER:
        cam_status["last_emergency_at"] = event.emergency_triggered_at or event.occurred_at
        # Update active fall to emergency state
        for fall in cam_status.get("active_falls", []):
            if fall["track_id"] == event.track_id:
                fall["state"] = STATE_EMERGENCY_TRIGGER
                fall["emergency_triggered_at"] = event.emergency_triggered_at
                fall["duration_fallen_seconds"] = event.duration_fallen_seconds
                break

    return {"status": "ok", "event_id": event.event_id}


@router.post("/emergency", status_code=201)
def trigger_emergency(req: EmergencyTrigger):
    """Manually trigger a hospital reception emergency alert."""
    event_id = f"emergency-manual-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    # If camera_id not in status, initialize
    if req.camera_id not in _fall_status:
        _fall_status[req.camera_id] = {
            "active_falls": [],
            "total_events": 0,
            "last_emergency_at": None,
        }
    cam_status = _fall_status[req.camera_id]
    cam_status["last_emergency_at"] = now
    cam_status["total_events"] += 1

    # Record the emergency event
    _fall_events.append({
        "event_id": event_id,
        "camera_id": req.camera_id,
        "track_id": req.track_id,
        "state": STATE_EMERGENCY_TRIGGER,
        "entered_fallen_at": None,
        "emergency_triggered_at": now,
        "duration_fallen_seconds": None,
        "confidence": 1.0,
        "bounding_box": None,
        "occurred_at": now,
        "received_at": now,
        "manual_trigger": True,
        "message": req.message,
    })

    # Add to active falls
    cam_status["active_falls"].append({
        "track_id": req.track_id or "manual",
        "state": STATE_EMERGENCY_TRIGGER,
        "entered_fallen_at": now,
        "confidence": 1.0,
        "bounding_box": None,
        "emergency_triggered_at": now,
    })

    return {
        "event_id": event_id,
        "camera_id": req.camera_id,
        "state": STATE_EMERGENCY_TRIGGER,
        "triggered_at": now,
        "message": "Emergency dispatched to hospital reception",
    }


@router.get("/events", response_model=List[Dict[str, Any]])
def list_fall_events(limit: int = 50):
    """List recent fall events (most recent first)."""
    return list(reversed(_fall_events[-limit:]))
