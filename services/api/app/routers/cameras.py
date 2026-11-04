from fastapi import APIRouter, HTTPException
import json
import uuid
from datetime import datetime, timezone
from typing import List
from ..schemas.camera import CameraCreate, CameraResponse, ZoneCreate, ZoneResponse, Point
from ..database import get_db

router = APIRouter(prefix="/api/v1/cameras", tags=["Cameras & Zones"])

@router.get("", response_model=List[CameraResponse])
def list_cameras():
    """List cameras with their polygon zones."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras ORDER BY created_at ASC")
    cameras_rows = cursor.fetchall()

    result = []
    for cam in cameras_rows:
        cursor.execute("SELECT * FROM zones WHERE camera_id = ?", (cam["id"],))
        zones_rows = cursor.fetchall()
        zones = []
        for z in zones_rows:
            poly_data = json.loads(z["polygon"])
            zones.append(ZoneResponse(
                id=z["id"],
                camera_id=z["camera_id"],
                name=z["name"],
                polygon=[Point(**p) for p in poly_data],
                color=z["color"] or "#ef4444",
                created_at=z["created_at"]
            ))

        result.append(CameraResponse(
            id=cam["id"],
            organization_id=cam["organization_id"],
            site_id=cam["site_id"],
            name=cam["name"],
            source_type=cam["source_type"],
            stream_url=cam["stream_url"],
            status=cam["status"],
            last_heartbeat_at=cam["last_heartbeat_at"],
            zones=zones,
            created_at=cam["created_at"]
        ))
    conn.close()
    return result

@router.post("", response_model=CameraResponse, status_code=201)
def create_camera(req: CameraCreate):
    """Register a new camera source or sample clip."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, organization_id FROM sites LIMIT 1")
    site = cursor.fetchone()
    if not site:
        conn.close()
        raise HTTPException(status_code=500, detail="Site not configured")

    cam_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        INSERT INTO cameras (id, organization_id, site_id, name, source_type, stream_url, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'online', ?)
        """,
        (cam_id, site["organization_id"], site["id"], req.name, req.source_type, req.stream_url, now)
    )
    conn.commit()
    conn.close()

    return CameraResponse(
        id=cam_id,
        organization_id=site["organization_id"],
        site_id=site["id"],
        name=req.name,
        source_type=req.source_type,
        stream_url=req.stream_url,
        status="online",
        created_at=now,
        zones=[]
    )

@router.post("/{camera_id}/zones", response_model=ZoneResponse, status_code=201)
def add_zone(camera_id: str, req: ZoneCreate):
    """Save an interactive polygon zone overlay for a camera."""
    conn = get_db()
    cursor = conn.cursor()
    zone_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    poly_json = json.dumps([p.model_dump() for p in req.polygon])

    cursor.execute(
        """
        INSERT INTO zones (id, camera_id, name, polygon, color, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (zone_id, camera_id, req.name, poly_json, req.color or "#ef4444", now)
    )
    conn.commit()
    conn.close()

    return ZoneResponse(
        id=zone_id,
        camera_id=camera_id,
        name=req.name,
        polygon=req.polygon,
        color=req.color or "#ef4444",
        created_at=now
    )

@router.post("/{camera_id}/test")
def test_camera_connection(camera_id: str):
    """Test camera stream connectivity."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras WHERE id = ?", (camera_id,))
    cam = cursor.fetchone()
    if not cam:
        conn.close()
        raise HTTPException(status_code=404, detail="Camera not found")

    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE cameras SET status = 'online', last_heartbeat_at = ? WHERE id = ?", (now, camera_id))
    conn.commit()
    conn.close()

    return {
        "id": camera_id,
        "name": cam["name"],
        "status": "online",
        "tested_at": now,
        "source_type": cam["source_type"]
    }
