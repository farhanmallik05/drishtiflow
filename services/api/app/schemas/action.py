from pydantic import BaseModel, Field
from typing import Optional, Literal

ActionStatus = Literal['queued', 'sent', 'delivered', 'failed', 'suppressed']
ActionType = Literal['dashboard_alert', 'whatsapp_message', 'voice_call', 'local_siren']

class ActionResponse(BaseModel):
    id: str
    incident_id: str
    action_type: ActionType
    status: ActionStatus
    idempotency_key: str
    recipient_ref: Optional[str] = None
    provider_reference: Optional[str] = None
    attempts: int
    last_error: Optional[str] = None
    created_at: str
    updated_at: str

class TestActionRequest(BaseModel):
    action_type: ActionType
    recipient_phone: Optional[str] = None
    incident_id: Optional[str] = None
    message: Optional[str] = "DrishtiFlow Test Alert: Perimeter check verified."

