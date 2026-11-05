from fastapi import APIRouter
from ..schemas.action import TestActionRequest
from ..services.action_dispatcher import ActionDispatcher

router = APIRouter(prefix="/api/v1/actions", tags=["Actions & Notification Testing"])

@router.post("/test")
async def test_action(req: TestActionRequest):
    """
    Dispatch a test action (WhatsApp, Voice call, or Dashboard alert)
    to a verified test recipient without emergency escalation.
    """
    mock_incident_id = req.incident_id or "test-incident-demo"
    result = await ActionDispatcher.dispatch(
        incident_id=mock_incident_id,
        action_type=req.action_type,
        recipient_phone=req.recipient_phone,
        message=req.message
    )
    return result

