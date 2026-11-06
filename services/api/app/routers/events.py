from fastapi import APIRouter, HTTPException
import json
import uuid
from datetime import datetime, timezone
from ..schemas.incident import CandidateEvent, IncidentResponse
from ..schemas.workflow import WorkflowDefinition
from ..services.verifier import verify_context
from ..services.policy import PolicyEngine
from ..services.action_dispatcher import ActionDispatcher
from ..database import get_db
from ..services.evidence import encrypt_evidence

router = APIRouter(prefix="/api/v1/events", tags=["Edge Events"])

@router.post("/candidates", status_code=201)
async def ingest_candidate_event(event: CandidateEvent):
    """
    Ingest a candidate event from edge detector, run contextual verification,
    evaluate deterministic policy, and dispatch idempotent alerts.
    """
    conn = get_db()
    cursor = conn.cursor()

    # Look up camera
    cursor.execute("SELECT id, organization_id, site_id, name, stream_url FROM cameras WHERE id = ?", (event.camera_id,))
    camera = cursor.fetchone()
    camera_stream_url = None
    if not camera:
        # Fall back to default site and org if not found
        cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
        site = cursor.fetchone()
        org_id = site["organization_id"]
        site_id = site["id"]
        camera_name = "Edge Camera"
    else:
        org_id = camera["organization_id"]
        site_id = camera["site_id"]
        camera_name = camera["name"]
        camera_stream_url = camera["stream_url"]

    # Auto-capture evidence frame if omitted and live camera/URL is configured
    evidence_frame_b64 = event.evidence_frame_base64
    if not evidence_frame_b64 and camera_stream_url and str(camera_stream_url).strip():
        try:
            import cv2, base64
            source_target = int(str(camera_stream_url).strip()) if str(camera_stream_url).strip().isdigit() else str(camera_stream_url).strip()
            cap = cv2.VideoCapture(source_target)
            if cap.isOpened():
                ok, frame = cap.read()
                cap.release()
                if ok and frame is not None:
                    frame_resized = cv2.resize(frame, (640, 360))
                    _, buf = cv2.imencode(".jpg", frame_resized, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                    evidence_frame_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode("utf-8")
        except Exception:
            pass

    # Retrieve active workflow if specified
    active_workflow = None
    if event.workflow_id:
        cursor.execute("SELECT * FROM workflow_versions WHERE workflow_id = ? ORDER BY version DESC LIMIT 1", (event.workflow_id,))
        wf_version = cursor.fetchone()
        if wf_version:
            try:
                active_workflow = WorkflowDefinition.model_validate(json.loads(wf_version["definition"]))
            except Exception:
                pass

    # 1. Contextual VLM Verification
    verification_instruction = (
        active_workflow.verification.instruction
        if active_workflow and active_workflow.verification
        else "Verify whether an unauthorized person is present inside the restricted perimeter zone."
    )
    verification = await verify_context(
        evidence_frame_base64=evidence_frame_b64,
        verification_instruction=verification_instruction,
        event_type=event.event_type,
        detector_confidence=event.detector.confidence
    )

    incident_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # 2. Evaluate Deterministic Policy
    allowed, policy_reason, permitted_actions = PolicyEngine.evaluate(
        incident_id=incident_id,
        camera_id=event.camera_id,
        verification=verification,
        workflow=active_workflow
    )

    # Determine incident status
    if verification.decision == "confirmed":
        status = "action_sent" if allowed else "confirmed"
    elif verification.decision == "uncertain":
        status = "uncertain"
    elif verification.decision == "needs_human_review":
        status = "candidate"
    elif verification.decision == "not_confirmed":
        status = "not_confirmed"
    else:
        status = "uncertain"

    # Persist Incident
    cursor.execute(
        """
        INSERT INTO incidents (
            id, organization_id, site_id, camera_id, workflow_id, workflow_version,
            event_type, status, detector_confidence, verifier_confidence, reason,
            evidence_frame_base64, evidence_url, occurred_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            incident_id, org_id, site_id, event.camera_id, event.workflow_id, event.workflow_version,
            event.event_type, status, event.detector.confidence, verification.confidence,
            f"{verification.evidence_summary} ({policy_reason})",
            encrypt_evidence(evidence_frame_b64), event.evidence_url, event.occurred_at, now
        )
    )
    conn.commit()
    conn.close()

    # 3. Dispatch Actions if Approved by Policy
    dispatched_actions = []
    if allowed:
        for action_type in permitted_actions:
            result = await ActionDispatcher.dispatch(
                incident_id=incident_id,
                action_type=action_type,
                message=f"DrishtiFlow Alert: {verification.evidence_summary} at {camera_name}"
            )
            dispatched_actions.append(result)

    return {
        "incident_id": incident_id,
        "camera_name": camera_name,
        "status": status,
        "detector_confidence": event.detector.confidence,
        "verifier_decision": verification.decision,
        "verifier_confidence": verification.confidence,
        "policy_allowed": allowed,
        "policy_reason": policy_reason,
        "dispatched_actions": dispatched_actions,
        "occurred_at": event.occurred_at
    }
