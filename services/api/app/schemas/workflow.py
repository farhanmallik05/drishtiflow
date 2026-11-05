from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

DetectorClass = Literal['person', 'vehicle', 'car', 'truck', 'motorcycle', 'animal']
TriggerType = Literal['object_in_zone', 'schedule_match', 'dwell_time_exceeded']
VerificationType = Literal['temporal_scene_check', 'semantic_vlm_verification', 'human_confirmation']
ActionType = Literal['dashboard_alert', 'whatsapp_message', 'voice_call', 'local_siren']

class ScheduleConfig(BaseModel):
    timezone: str = "Asia/Kolkata"
    days: List[Literal['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']] = [
        'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
    ]
    start: str = Field(..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    end: str = Field(..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")

class TriggerConfig(BaseModel):
    type: TriggerType = "object_in_zone"
    classes: List[DetectorClass] = ["person"]
    zone_id: Optional[str] = None
    schedule: Optional[ScheduleConfig] = None
    minimum_confidence: float = Field(0.55, ge=0.0, le=1.0)
    dwell_seconds: float = Field(1.5, ge=0.0)

class VerificationConfig(BaseModel):
    type: VerificationType = "temporal_scene_check"
    instruction: str = Field(..., min_length=5)
    evidence_window_seconds: float = Field(2.0, ge=0.5, le=10.0)
    human_review_required: bool = False

class ActionItem(BaseModel):
    type: ActionType
    enabled: bool = True
    recipient_ids: List[str] = []
    parameters: Optional[Dict[str, Any]] = None

class SafetyConfig(BaseModel):
    cooldown_seconds: int = Field(60, ge=5)
    max_actions_per_hour: int = Field(5, ge=1, le=100)
    escalation_policy_id: Optional[str] = None

class WorkflowDefinition(BaseModel):
    schema_version: str = "1.0"
    title: Dict[str, str] = Field(..., description="e.g. {'en': 'After-hours entry', 'hi': 'गोदाम में अनधिकृत प्रवेश'}")
    source_text: str
    status: Literal['draft', 'needs_review', 'active', 'paused'] = "needs_review"
    assumptions: List[str] = []
    clarification_questions: List[str] = []
    trigger: TriggerConfig
    verification: VerificationConfig
    actions: List[ActionItem] = Field(..., min_length=1)
    safety: SafetyConfig = Field(default_factory=SafetyConfig)

class CompileRequest(BaseModel):
    prompt: str = Field(..., min_length=3, description="Hindi, Hinglish, or English rule instruction")
    camera_id: Optional[str] = None
    zone_id: Optional[str] = None

class WorkflowCreateRequest(BaseModel):
    name: str
    camera_id: Optional[str] = None
    definition: WorkflowDefinition

