from fastapi import APIRouter, HTTPException
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from ..schemas.workflow import CompileRequest, WorkflowDefinition, WorkflowCreateRequest
from ..services.compiler import compile_prompt
from ..database import get_db

router = APIRouter(prefix="/api/v1/workflows", tags=["Workflows"])

@router.post("/compile", response_model=WorkflowDefinition)
async def compile_workflow(req: CompileRequest):
    """Compile natural language Hindi/Hinglish/English into structured workflow."""
    return await compile_prompt(req.prompt, camera_id=req.camera_id, zone_id=req.zone_id)

@router.post("", status_code=201)
def create_workflow(req: WorkflowCreateRequest):
    """Save a new draft workflow."""
    conn = get_db()
    cursor = conn.cursor()

    # Get default org and site
    cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
    site = cursor.fetchone()
    if not site:
        conn.close()
        raise HTTPException(status_code=500, detail="No site found in database")

    workflow_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        INSERT INTO workflows (id, organization_id, site_id, camera_id, name, active_version, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, 'draft', ?, ?)
        """,
        (workflow_id, site["organization_id"], site["id"], req.camera_id, req.name, now, now)
    )

    cursor.execute(
        """
        INSERT INTO workflow_versions (id, workflow_id, version, schema_version, definition, created_at)
        VALUES (?, ?, 1, '1.0', ?, ?)
        """,
        (version_id, workflow_id, json.dumps(req.definition.model_dump()), now)
    )

    conn.commit()
    conn.close()

    return {
        "id": workflow_id,
        "name": req.name,
        "version": 1,
        "status": "draft",
        "created_at": now
    }

@router.get("")
def list_workflows():
    """List workflows."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT w.id, w.name, w.camera_id, w.active_version, w.status, w.created_at, w.updated_at,
               c.name as camera_name
        FROM workflows w
        LEFT JOIN cameras c ON w.camera_id = c.id
        ORDER BY w.updated_at DESC
    """)
    rows = cursor.fetchall()
    workflows = []
    for r in rows:
        workflows.append({
            "id": r["id"],
            "name": r["name"],
            "camera_id": r["camera_id"],
            "camera_name": r["camera_name"],
            "active_version": r["active_version"],
            "status": r["status"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"]
        })
    conn.close()
    return workflows

@router.get("/{workflow_id}")
def get_workflow(workflow_id: str):
    """Retrieve workflow and active version definition."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,))
    workflow = cursor.fetchone()
    if not workflow:
        conn.close()
        raise HTTPException(status_code=404, detail="Workflow not found")

    cursor.execute(
        "SELECT * FROM workflow_versions WHERE workflow_id = ? AND version = ?",
        (workflow_id, workflow["active_version"] or 1)
    )
    version = cursor.fetchone()
    conn.close()

    definition = json.loads(version["definition"]) if version else None

    return {
        "id": workflow["id"],
        "name": workflow["name"],
        "status": workflow["status"],
        "active_version": workflow["active_version"],
        "definition": definition,
        "created_at": workflow["created_at"]
    }

@router.post("/{workflow_id}/activate")
def activate_workflow(workflow_id: str):
    """Activate a workflow."""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "UPDATE workflows SET status = 'active', updated_at = ? WHERE id = ?",
        (now, workflow_id)
    )
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Workflow not found")
    conn.commit()
    conn.close()
    return {"id": workflow_id, "status": "active"}

@router.post("/{workflow_id}/pause")
def pause_workflow(workflow_id: str):
    """Pause an active workflow."""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "UPDATE workflows SET status = 'paused', updated_at = ? WHERE id = ?",
        (now, workflow_id)
    )
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Workflow not found")
    conn.commit()
    conn.close()
    return {"id": workflow_id, "status": "paused"}
