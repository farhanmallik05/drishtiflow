from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any

IncidentStatus = Literal[
    'candidate',
    'verifying',
    'confirmed',
    'not_confirmed',
    'uncertain',
    'action_pending',
    'action_sent',
    'action_failed',
    'acknowledged',
    'resolved'
]

FeedbackLabel = Literal[
    'true_positive',
    'false_positive',
    'missed_event_report',
    'uncertain',
    'poor_evidence',
    'wrong_zone',
    'wrong_rule'
]

class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float

class DetectorMetadata(BaseModel):
    name: str
    version: str
    confidence: float
    bounding_box: Optional[BoundingBox] = None

class CandidateEvent(BaseModel):
    event_id: str
    organization_id: Optional[str] = None
    site_id: Optional[str] = None
    camera_id: str
    workflow_id: Optional[str] = None
    workflow_version: Optional[int] = None
    event_type: str = "restricted_zone_entry"
    occurred_at: str
    source: Literal['webcam', 'webrtc_gateway', 'local_agent', 'sample'] = "sample"
    detector: DetectorMetadata
    evidence_frame_base64: Optional[str] = None
    evidence_url: Optional[str] = None

class FeedbackCreate(BaseModel):
    label: FeedbackLabel
    note: Optional[str] = None
    created_by: Optional[str] = "operator"

class IncidentResponse(BaseModel):
    id: str
    organization_id: str
    site_id: str
    camera_id: str
    camera_name: Optional[str] = None
    workflow_id: Optional[str] = None
    workflow_version: Optional[int] = None
    event_type: str
    status: IncidentStatus
    detector_confidence: float
    verifier_confidence: Optional[float] = None
    reason: Optional[str] = None
    evidence_frame_base64: Optional[str] = None
    evidence_url: Optional[str] = None
    occurred_at: str
    created_at: str
