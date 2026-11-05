"""
End-to-end edge-vision pipeline test using real CCTV footage.

Flow (PRD §6.4):
    real video -> YOLOv8n person detection -> zone polygon PiP ->
    dwell persistence (1.5s) -> candidate event envelope -> FastAPI backend
    -> verifier -> policy -> action dispatch.

Usage:
    # Start the API first:
    cd services/api && python -m uvicorn app.main:app --port 8000

    # Then run (from repo root):
    python services/edge-agent/tools/run_real_video_pipeline.py

Emits candidate events to http://localhost:8000/api/v1/events/candidates
whenever a person dwells inside the restricted zone for >= 1.5 seconds.
"""
from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path

import cv2

# Allow running both as a script and as a module inside services/edge-agent.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from inference.yolo_detector import YOLOEdgeDetector
from tracking.tracker import DwellTracker
from events.emitter import CandidateEventEmitter

VIDEO_PATH = Path("services/edge-agent/assets/videos/cctv_intrusion_1.mp4")

# Restricted zone polygon (normalized [0..1] coords), covering the left-side
# entry corridor where intrusions appear in the footage (persons at
# x~0.12-0.32, y~0.3-0.8 observed across the scan).
ZONE_POLYGON = [
    (0.05, 0.25),
    (0.45, 0.25),
    (0.45, 0.80),
    (0.05, 0.80),
]

CAMERA_ID = "real-cctv-01"
WORKFLOW_ID = None  # set to a real workflow id after backend activation
FRAME_STRIDE = 3  # run YOLO every 3rd frame (~10 fps effective on 30fps source)


def detection_in_zone(det: dict, polygon: list[tuple[float, float]]) -> bool:
    """Bottom-center point of bbox inside polygon (reuses EdgeDetector logic)."""
    from inference.detector import is_point_in_polygon

    bb = det["bounding_box"]
    feet = ((bb["x_min"] + bb["x_max"]) / 2.0, bb["y_max"])
    return is_point_in_polygon(feet, polygon)


async def main() -> None:
    if not VIDEO_PATH.exists():
        raise FileNotFoundError(f"Video not found: {VIDEO_PATH}")

    cap = cv2.VideoCapture(str(VIDEO_PATH))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Video: {VIDEO_PATH} | {total_frames} frames @ {fps:.1f} FPS")

    det = YOLOEdgeDetector(confidence_threshold=0.5, device="cpu")
    tracker = DwellTracker(required_dwell_seconds=1.5)
    emitter = CandidateEventEmitter(api_base_url="http://localhost:8000")

    frame_idx = 0
    emitted = 0
    in_zone_frames = 0
    dwell_armed = False
    dwell_start_frame = None

    t0 = time.perf_counter()
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame_idx += 1
            if frame_idx % FRAME_STRIDE != 0:
                continue

            secs = frame_idx / fps
            dets = det.detect(frame)
            people_in_zone = [
                d for d in dets if d["class"] == "person" and detection_in_zone(d, ZONE_POLYGON)
            ]

            if people_in_zone:
                in_zone_frames += 1
                # Dwell tracker keyed on the zone presence; simplest robust model:
                # continuous person-in-zone accumulates dwell.
                if not dwell_armed:
                    dwell_armed = True
                    dwell_start_frame = frame_idx
                dwell_seconds = (frame_idx - dwell_start_frame) / fps
                if dwell_seconds >= 1.5 and not getattr(main, "dwell_reported", False):
                    main.dwell_reported = True
                    person = people_in_zone[0]
                    print(
                        f"[{secs:6.1f}s] DWELL MET: person conf={person['confidence']:.2f} "
                        f"bbox={person['bounding_box']} -> emitting candidate event"
                    )
                    try:
                        res = await emitter.emit_candidate_event(
                            camera_id=CAMERA_ID,
                            detection={
                                "model": "yolov8n",
                                "version": "8.1.0",
                                "confidence": person["confidence"],
                                "bounding_box": person["bounding_box"],
                            },
                            workflow_id=WORKFLOW_ID,
                            source="local_agent",
                        )
                        emitted += 1
                        print(f"       -> API accepted: incident_id={res['incident_id']} "
                              f"status={res['status']} verifier={res['verifier_decision']}")
                    except Exception as exc:  # noqa: BLE001
                        print(f"       -> API emission failed: {exc}")
            else:
                dwell_armed = False
                main.dwell_reported = False
                dwell_start_frame = None

            if frame_idx % 300 == 0:
                print(f"  ... processed frame {frame_idx} ({secs:.1f}s), "
                      f"{in_zone_frames} in-zone frames, {emitted} events emitted")

    finally:
        cap.release()

    dt = time.perf_counter() - t0
    print("\n=== Pipeline summary ===")
    print(f"Frames processed: {frame_idx // FRAME_STRIDE} of {total_frames} "
          f"(stride {FRAME_STRIDE})")
    print(f"In-zone frames: {in_zone_frames}")
    print(f"Candidate events emitted: {emitted}")
    print(f"Wall-clock: {dt:.1f}s ({frame_idx/dt:.1f} frames/s real-time)")
    print(f"YOLO avg inference: {det.avg_inference_ms():.0f} ms ({det.fps()} FPS)")


if __name__ == "__main__":
    asyncio.run(main())
