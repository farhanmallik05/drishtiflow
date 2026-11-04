import sqlite3
import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "drishtiflow.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Create tables matching PRD §8 SQL Foundation
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
        created_at TEXT NOT NULL,
        FOREIGN KEY(organization_id) REFERENCES organizations(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cameras (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        stream_url TEXT,
        credential_ref TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        last_heartbeat_at TEXT,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        camera_id TEXT NOT NULL,
        name TEXT NOT NULL,
        polygon TEXT NOT NULL, -- JSON array of points
        color TEXT DEFAULT '#ef4444',
        created_at TEXT NOT NULL,
        FOREIGN KEY(camera_id) REFERENCES cameras(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        camera_id TEXT,
        name TEXT NOT NULL,
        active_version INTEGER,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflow_versions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        schema_version TEXT NOT NULL,
        definition TEXT NOT NULL, -- JSON
        compiler_model TEXT,
        prompt_version TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(workflow_id, version),
        FOREIGN KEY(workflow_id) REFERENCES workflows(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        workflow_id TEXT,
        workflow_version INTEGER,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        detector_confidence REAL,
        verifier_confidence REAL,
        reason TEXT,
        evidence_frame_base64 TEXT,
        evidence_url TEXT,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        idempotency_key TEXT NOT NULL UNIQUE,
        recipient_ref TEXT,
        provider_reference TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(incident_id) REFERENCES incidents(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        label TEXT NOT NULL,
        note TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(incident_id) REFERENCES incidents(id)
    )
    """)

    # Seed default organization and sample camera if empty
    cursor.execute("SELECT COUNT(*) as count FROM organizations")
    if cursor.fetchone()["count"] == 0:
        org_id = str(uuid.uuid4())
        site_id = str(uuid.uuid4())
        cam_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        cursor.execute(
            "INSERT INTO organizations (id, name, slug, created_at) VALUES (?, ?, ?, ?)",
            (org_id, "Bharat Logistics Godown #4", "bharat-logistics-4", now)
        )
        cursor.execute(
            "INSERT INTO sites (id, organization_id, name, timezone, created_at) VALUES (?, ?, ?, ?, ?)",
            (site_id, org_id, "Bhiwandi Central Warehouse", "Asia/Kolkata", now)
        )
        cursor.execute(
            "INSERT INTO cameras (id, organization_id, site_id, name, source_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (cam_id, org_id, site_id, "North Gate Perimeter Cam", "sample", "online", now)
        )
        # Seed a sample polygon zone
        sample_zone = [
            {"x": 0.2, "y": 0.3},
            {"x": 0.8, "y": 0.3},
            {"x": 0.8, "y": 0.85},
            {"x": 0.2, "y": 0.85}
        ]
        cursor.execute(
            "INSERT INTO zones (id, camera_id, name, polygon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), cam_id, "Restricted Storage Bay A", json.dumps(sample_zone), "#ef4444", now)
        )

    conn.commit()
    conn.close()

# Auto-initialize database on module import
init_db()
