from fastapi import APIRouter, HTTPException
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from ..schemas.incident import IncidentResponse, FeedbackCreate
from ..schemas.verification import VerificationRequest, VerificationResult
from ..services.verifier import verify_context
from ..database import get_db

router = APIRouter(prefix="/api/v1/incidents", tags=["Incidents & Operator Feedback"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(limit: int = 50):
    """Query recent incidents with camera metadata."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT i.*, c.name as camera_name
        FROM incidents i
        LEFT JOIN cameras c ON i.camera_id = c.id
        ORDER BY i.occurred_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()

    result = []
    for r in rows:
        result.append(IncidentResponse(
            id=r["id"],
            organization_id=r["organization_id"],
            site_id=r["site_id"],
            camera_id=r["camera_id"],
            camera_name=r["camera_name"],
            workflow_id=r["workflow_id"],
            workflow_version=r["workflow_version"],
            event_type=r["event_type"],
            status=r["status"],
            detector_confidence=r["detector_confidence"],
            verifier_confidence=r["verifier_confidence"],
            reason=r["reason"],
            evidence_frame_base64=r["evidence_frame_base64"],
            evidence_url=r["evidence_url"],
            occurred_at=r["occurred_at"],
            created_at=r["created_at"]
        ))
    conn.close()
    return result

@router.get("/{incident_id}")
def get_incident(incident_id: str):
    """Retrieve full incident details, associated actions, and feedback."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT i.*, c.name as camera_name
        FROM incidents i
        LEFT JOIN cameras c ON i.camera_id = c.id
        WHERE i.id = ?
    """, (incident_id,))
    inc = cursor.fetchone()
    if not inc:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    cursor.execute("SELECT * FROM actions WHERE incident_id = ? ORDER BY created_at DESC", (incident_id,))
    actions = [dict(a) for a in cursor.fetchall()]

    cursor.execute("SELECT * FROM feedback WHERE incident_id = ? ORDER BY created_at DESC", (incident_id,))
    feedback = [dict(f) for f in cursor.fetchall()]

    conn.close()

    return {
        "incident": dict(inc),
        "actions": actions,
        "feedback": feedback
    }

@router.post("/{incident_id}/verify", response_model=VerificationResult)
async def trigger_verification(incident_id: str, req: VerificationRequest):
    """Explicitly run or re-run contextual VLM verification."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    inc = cursor.fetchone()
    if not inc:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    result = await verify_context(
        evidence_frame_base64=req.evidence_frame_base64 or inc["evidence_frame_base64"],
        verification_instruction=req.verification_instruction,
        event_type=req.event_type or inc["event_type"],
        detector_confidence=inc["detector_confidence"]
    )

    new_status = "confirmed" if result.decision == "confirmed" else "uncertain"
    cursor.execute(
        "UPDATE incidents SET verifier_confidence = ?, reason = ?, status = ? WHERE id = ?",
        (result.confidence, result.evidence_summary, new_status, incident_id)
    )
    conn.commit()
    conn.close()

    return result

@router.post("/{incident_id}/acknowledge")
def acknowledge_incident(incident_id: str):
    """Operator acknowledges an incident."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE incidents SET status = 'acknowledged' WHERE id = ?", (incident_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")
    conn.commit()
    conn.close()
    return {"id": incident_id, "status": "acknowledged"}

@router.post("/{incident_id}/feedback", status_code=201)
def submit_feedback(incident_id: str, fb: FeedbackCreate):
    """Record operator evaluation feedback (True/False Positive, etc)."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM incidents WHERE id = ?", (incident_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    feedback_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        """
        INSERT INTO feedback (id, incident_id, label, note, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (feedback_id, incident_id, fb.label, fb.note, fb.created_by or "operator", now)
    )
    conn.commit()
    conn.close()

    return {
        "id": feedback_id,
        "incident_id": incident_id,
        "label": fb.label,
        "created_at": now
    }
