#!/usr/bin/env python3
"""
DrishtiFlow (दृष्टि-प्रवाह) — Hackathon Demo Launcher
Build with Bharat 5.0

Starts both the FastAPI Backend and Next.js Web Console concurrently,
ensuring database seeding and clean process lifecycle handling.
"""

from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
API_DIR = ROOT_DIR / "services" / "api"
WEB_DIR = ROOT_DIR / "apps" / "web"
DB_PATH = API_DIR / "drishtiflow.db"

BANNER = r"""
================================================================================
  ____       _     _     _   _ _____ _               
 |  _ \ _ __(_)___| |__ | |_(_)  ___| | _____      __
 | | | | '__| / __| '_ \| __| | |_  | |/ _ \ \ /\ / / 
 | |_| | |  | \__ \ | | | |_| |  _| | | (_) \ V  V /  
 |____/|_|  |_|___/_| |_|\__|_|_|   |_|\___/ \_/\_/   
   DrishtiFlow (दृष्टि-फ़्लो) — Build with Bharat 5.0
   Autonomous Edge Vision & Vernacular VLM Verification Platform
================================================================================
"""


def seed_database_if_empty() -> None:
    """Ensures database schema and seeds a default camera & zone if empty."""
    sys.path.insert(0, str(API_DIR))
    try:
        from app.database import get_db, init_db

        init_db()
        conn = get_db()
        cursor = conn.cursor()

        # Check existing cameras
        cursor.execute("SELECT COUNT(*) as cnt FROM cameras")
        count = cursor.fetchone()["cnt"]

        if count == 0:
            now = datetime.now(timezone.utc).isoformat()
            org_id = "org-bharat-01"
            site_id = "site-mumbai-01"
            cam_id = "cam-shop-01"
            zone_id = "zone-shelf-01"

            cursor.execute(
                "INSERT OR IGNORE INTO organizations (id, name, slug, created_at) VALUES (?, ?, ?, ?)",
                (org_id, "Bharat Retail & Logistics", "bharat-retail", now),
            )
            cursor.execute(
                "INSERT OR IGNORE INTO sites (id, organization_id, name, timezone, created_at) VALUES (?, ?, ?, ?, ?)",
                (site_id, org_id, "Mumbai Kurla Kirana Store", "Asia/Kolkata", now),
            )
            cursor.execute(
                """
                INSERT INTO cameras (id, organization_id, site_id, name, source_type, stream_url, status, created_at)
                VALUES (?, ?, ?, ?, 'rtsp', '0', 'online', ?)
                """,
                (cam_id, org_id, site_id, "Kirana Main Aisle Cam", now),
            )
            zone_polygon = json.dumps([
                {"x": 0.25, "y": 0.25},
                {"x": 0.75, "y": 0.25},
                {"x": 0.75, "y": 0.85},
                {"x": 0.25, "y": 0.85},
            ])
            cursor.execute(
                """
                INSERT INTO zones (id, camera_id, name, polygon, color, created_at)
                VALUES (?, ?, ?, ?, '#f97316', ?)
                """,
                (zone_id, cam_id, "High-Value Shelf Zone", zone_polygon, now),
            )
            conn.commit()
            print("[DB] Seeded default camera 'cam-shop-01' and 'High-Value Shelf Zone'.")
        else:
            print(f"[DB] Preserving {count} existing camera(s) in drishtiflow.db.")

        conn.close()
    except Exception as exc:
        print(f"[DB WARNING] Seeding check failed (non-fatal): {exc}")


def main() -> int:
    print(BANNER)
    seed_database_if_empty()

    processes: list[subprocess.Popen] = []

    def shutdown(signum=None, frame=None):
        print("\n[LAUNCHER] Shutting down DrishtiFlow services...")
        for p in processes:
            if p.poll() is None:
                try:
                    p.terminate()
                except Exception:
                    pass
        time.sleep(1)
        for p in processes:
            if p.poll() is None:
                try:
                    p.kill()
                except Exception:
                    pass
        print("[LAUNCHER] All processes terminated cleanly. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["PYTHONPATH"] = str(API_DIR)

    # 1. Start FastAPI Backend
    print("[1/2] Starting FastAPI Backend on http://localhost:8000 ...")
    fastapi_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
    ]
    p_api = subprocess.Popen(
        fastapi_cmd,
        cwd=str(API_DIR),
        env=env,
    )
    processes.append(p_api)

    # 2. Start Next.js Frontend
    print("[2/2] Starting Next.js Web Console on http://localhost:3000 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    web_cmd = [npm_cmd, "run", "dev:web"]
    p_web = subprocess.Popen(
        web_cmd,
        cwd=str(ROOT_DIR),
        env=env,
    )
    processes.append(p_web)

    print("\n" + "=" * 60)
    print("  🚀 DRISHTIFLOW IS RUNNING!")
    print("  • Web Console:        http://localhost:3000")
    print("  • API Swagger Docs:   http://localhost:8000/docs")
    print("  • Camera MJPEG Feed:  http://localhost:8000/api/v1/cameras/cam-shop-01/stream")
    print("  • Fall Monitor API:   http://localhost:8000/api/v1/fall-monitor")
    print("  • Shoplifting Log:    http://localhost:8000/api/v1/shoplifting/records")
    print("  Press Ctrl+C to shut down all services.")
    print("=" * 60 + "\n")

    try:
        while True:
            time.sleep(1)
            for p in processes:
                code = p.poll()
                if code is not None:
                    print(f"[LAUNCHER ERROR] Process {p.args} exited unexpectedly with code {code}.")
                    shutdown()
    except KeyboardInterrupt:
        shutdown()

    return 0


if __name__ == "__main__":
    sys.exit(main())
