from fastapi import APIRouter, HTTPException
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
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

@router.post("/{workflow_id}/versions", status_code=201)
def create_workflow_version(workflow_id: str, payload: Optional[Dict[str, Any]] = None):
    """Save a version snapshot for a workflow (PRD §9)."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,))
    workflow = cursor.fetchone()
    if not workflow:
        conn.close()
        raise HTTPException(status_code=404, detail="Workflow not found")

    cursor.execute("SELECT MAX(version) as max_v FROM workflow_versions WHERE workflow_id = ?", (workflow_id,))
    max_row = cursor.fetchone()
    next_version = (max_row["max_v"] or 0) + 1

    definition_json: Optional[str] = None
    schema_version = "1.0"

    # If payload provided, extract definition
    if payload:
        if "definition" in payload and isinstance(payload["definition"], dict):
            try:
                wf_def = WorkflowDefinition.model_validate(payload["definition"])
                definition_json = json.dumps(wf_def.model_dump())
                schema_version = wf_def.schema_version
            except Exception as e:
                conn.close()
                raise HTTPException(status_code=400, detail=f"Invalid workflow definition: {str(e)}")
        elif "trigger" in payload and "actions" in payload:
            try:
                wf_def = WorkflowDefinition.model_validate(payload)
                definition_json = json.dumps(wf_def.model_dump())
                schema_version = wf_def.schema_version
            except Exception as e:
                conn.close()
                raise HTTPException(status_code=400, detail=f"Invalid workflow definition: {str(e)}")

    if not definition_json:
        cursor.execute(
            "SELECT definition, schema_version FROM workflow_versions WHERE workflow_id = ? ORDER BY version DESC LIMIT 1",
            (workflow_id,)
        )
        base_version = cursor.fetchone()
        if not base_version:
            conn.close()
            raise HTTPException(status_code=400, detail="Cannot create version snapshot: no base version exists")
        definition_json = base_version["definition"]
        schema_version = base_version["schema_version"]

    version_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        INSERT INTO workflow_versions (id, workflow_id, version, schema_version, definition, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (version_id, workflow_id, next_version, schema_version, definition_json, now)
    )

    cursor.execute(
        "UPDATE workflows SET active_version = ?, updated_at = ? WHERE id = ?",
        (next_version, now, workflow_id)
    )

    conn.commit()
    conn.close()

    return {
        "id": version_id,
        "workflow_id": workflow_id,
        "version": next_version,
        "schema_version": schema_version,
        "created_at": now
    }

@router.post("/{workflow_id}/activate")
def activate_workflow(workflow_id: str):
    """Validate and activate a workflow (PRD §6.2 FR-W-08, §9)."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,))
    workflow = cursor.fetchone()
    if not workflow:
        conn.close()
        raise HTTPException(status_code=404, detail="Workflow not found")

    target_version = workflow["active_version"] or 1
    cursor.execute(
        "SELECT definition FROM workflow_versions WHERE workflow_id = ? AND version = ?",
        (workflow_id, target_version)
    )
    version_row = cursor.fetchone()
    if not version_row:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot activate workflow: no version definition found")

    try:
        def_dict = json.loads(version_row["definition"])
        wf_def = WorkflowDefinition.model_validate(def_dict)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Cannot activate workflow: invalid definition ({str(e)})")

    # Validate trigger and actions exist and are valid
    if not wf_def.trigger:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot activate workflow: trigger configuration is missing")

    if not wf_def.actions or len(wf_def.actions) == 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot activate workflow: at least one action is required")

    enabled_actions = [a for a in wf_def.actions if a.enabled]
    if not enabled_actions:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot activate workflow: at least one action must be enabled")

    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "UPDATE workflows SET status = 'active', updated_at = ? WHERE id = ?",
        (now, workflow_id)
    )
    conn.commit()
    conn.close()
    return {"id": workflow_id, "status": "active", "version": target_version}

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

