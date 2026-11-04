from pydantic import BaseModel, Field
from typing import List, Optional, Literal

VerificationDecision = Literal[
    'confirmed',
    'not_confirmed',
    'uncertain',
    'needs_human_review',
    'processing_failed'
]

class VerificationResult(BaseModel):
    decision: VerificationDecision
    event_type: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence_summary: str
    limitations: List[str] = []
    requires_human_review: bool = False
    model_provider: str
    model_version: str

class VerificationRequest(BaseModel):
    evidence_frame_base64: Optional[str] = None
    verification_instruction: Optional[str] = None
    event_type: Optional[str] = "restricted_zone_entry"
