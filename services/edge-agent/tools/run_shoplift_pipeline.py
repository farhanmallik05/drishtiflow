"""
Demo pipeline: shoplifting detection -> entry/exit times -> evidence photo -> pandas CSV.

Flow (PRD-aligned):
    real/sample video -> YOLOv8n person detection -> shop zone PiP -> shelf-zone
    interaction -> exit -> suspected-theft flag -> one evidence photo -> pandas
    DataFrame persisted as CSV (shop_theft_log.csv).

Usage (from repo root):
    # Process the real CCTV footage already downloaded for R0:
    python services/edge-agent/tools/run_shoplift_pipeline.py

    # Process a different video:
    python services/edge-agent/tools/run_shoplift_pipeline.py \
        --video path/to/your/video.mp4 \
        --camera cam-shop-01 \
        --out services/edge-agent/assets/shop_theft_log.csv

The CSV log gains one row per person:
    track_id, camera_id, entry_time, exit_time, duration_seconds,
    shelf_interaction, theft_suspected, detector_confidence, photo_path, logged_at
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import cv2

# Allow running both as a script and as a module inside services/edge-agent.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tracking.shoplift_monitor import ShopliftMonitor

DEFAULT_VIDEO = Path("services/edge-agent/assets/videos/cctv_intrusion_1.mp4")
DEFAULT_CSV = Path("services/edge-agent/assets/shop_theft_log.csv")
DEFAULT_EVIDENCE_DIR = Path("services/edge-agent/assets/evidence")

# Shop floor zone (normalized [0,1] coords) covering the area where customers
# move through the shop.
SHOP_ZONE = [
    (0.05, 0.20),
    (0.95, 0.20),
    (0.95, 0.85),
    (0.05, 0.85),
]

# Shelves / items zone where item-handling (and thus suspected theft) occurs.
SHELF_ZONE = [
    (0.30, 0.35),
    (0.70, 0.35),
    (0.70, 0.75),
    (0.30, 0.75),
]

CAMERA_ID = "cam-shop-01"
FRAME_STRIDE = 3  # run YOLO every 3rd frame (~10 fps effective on 30fps source)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run shoplifting detection on a video and write a pandas CSV log."
    )
    parser.add_argument(
        "--video",
        type=str,
        default=str(DEFAULT_VIDEO),
        help="Path to input video file.",
    )
    parser.add_argument(
        "--camera",
        type=str,
        default=CAMERA_ID,
        help="Camera id stamped on every record.",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=str(DEFAULT_CSV),
        help="Path to the pandas CSV log file.",
    )
    parser.add_argument(
        "--evidence-dir",
        type=str,
        default=str(DEFAULT_EVIDENCE_DIR),
        help="Directory for the one evidence photo per incident.",
    )
    parser.add_argument(
        "--stride",
        type=int,
        default=FRAME_STRIDE,
        help="Run detection every Nth frame.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    video_path = Path(args.video)

    if not video_path.exists():
        print(f"ERROR: video not found: {video_path}")
        return 1

    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(
        f"Video: {video_path} | {total_frames} frames @ {fps:.1f} FPS | "
        f"camera={args.camera} stride={args.stride}"
    )

    monitor = ShopliftMonitor(
        camera_id=args.camera,
        shop_zone=SHOP_ZONE,
        shelf_zone=SHELF_ZONE,
        evidence_dir=args.evidence_dir,
        csv_path=args.out,
    )

    frame_idx = 0
    processed = 0
    t0 = time.perf_counter()
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame_idx += 1
            if frame_idx % args.stride != 0:
                continue
            processed += 1

            secs = frame_idx / fps
            summaries = monitor.process_frame(frame, frame_idx=frame_idx)

            if frame_idx % 300 == 0:
                active = len(monitor.get_active_tracks())
                finished = len(monitor.finished_records)
                thefts = sum(1 for r in monitor.finished_records if r.theft_suspected)
                print(
                    f"  ... frame {frame_idx} ({secs:.1f}s) | processed={processed} | "
                    f"active={active} | finalized={finished} | thefts={thefts}"
                )
    finally:
        cap.release()

    # Finalize any tracks still inside the shop at end of video.
    finalized = monitor.flush(frame=None)
    if finalized:
        print(f"  flushed {len(finalized)} remaining track(s) at end of video.")

    # Persist the pandas DataFrame to CSV.
    csv_path = monitor.save_dataframe()
    df = monitor.to_dataframe()

    dt = time.perf_counter() - t0
    print("\n=== Shoplifting pipeline summary ===")
    print(f"Frames processed: {processed} of {total_frames} (stride {args.stride})")
    print(f"Wall-clock: {dt:.1f}s ({frame_idx / dt:.1f} frames/s real-time)")
    print(f"Persons finalized: {len(df)}")
    print(f"  - shelf_interaction=True : {int(df['shelf_interaction'].sum()) if len(df) else 0}")
    print(f"  - theft_suspected=True   : {int(df['theft_suspected'].sum()) if len(df) else 0}")
    print(f"CSV log: {csv_path}")
    print(f"Evidence dir: {args.evidence_dir}")
    if len(df):
        print("\nFirst rows of the pandas DataFrame:")
        print(
            df[
                [
                    "track_id",
                    "entry_time",
                    "exit_time",
                    "duration_seconds",
                    "theft_suspected",
                    "photo_path",
                ]
            ].head().to_string(index=False)
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
