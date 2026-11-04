from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class Point(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)

class ZoneCreate(BaseModel):
    camera_id: str
    name: str
    polygon: List[Point] = Field(..., min_length=3)
    color: Optional[str] = "#ef4444"

class ZoneResponse(BaseModel):
    id: str
    camera_id: str
    name: str
    polygon: List[Point]
    color: str
    created_at: str

class CameraCreate(BaseModel):
    name: str
    source_type: Literal['webcam', 'webrtc_gateway', 'local_agent', 'sample'] = "sample"
    stream_url: Optional[str] = None
    credential_ref: Optional[str] = None

class CameraResponse(BaseModel):
    id: str
    organization_id: str
    site_id: str
    name: str
    source_type: str
    stream_url: Optional[str] = None
    status: Literal['pending', 'online', 'degraded', 'offline']
    last_heartbeat_at: Optional[str] = None
    zones: List[ZoneResponse] = []
    created_at: str
