# DrishtiFlow Changelog
All notable changes to the DrishtiFlow project and planning artifacts are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added — 2026-11-06 (Frontend ↔ Backend alignment for upload → results)

- **Shoplifting Log results view (`apps/web/src/components/dashboard/ShopliftingLogView.tsx`)**:
  - New "Shoplifting Log" tab in `App.tsx` (after "Video Upload & Detection").
  - Fetches `GET /api/v1/shoplifting/log`, shows persons tracked, suspected thefts, theft rate, shelf interactions, and a per-person table (entry/exit, duration, confidence, evidence-photo link).
  - Empty/error states guide the operator to upload a video or start the API.
- **Inline detection results in `CameraPreview.tsx`**:
  - After `process-video` completes, the panel now renders the first five per-person records (theft badge + duration + confidence) and a "View full log →" action wired through a new optional `onOpenLog` prop.
- **Enriched upload response**: `POST /api/v1/shoplifting/upload-video` now also returns `url`, `media_type`, and `size_bytes`; the frontend uses `url` for playback instead of parsing Windows paths.
- **Enriched process response**: `POST /api/v1/shoplifting/process-video` now returns typed `records[]`, `camera_id`, `video_url`, and `elapsed_seconds` alongside `records_found` / `thefts_suspected`.
- **Typed log records**: `GET /api/v1/shoplifting/log` now converts CSV strings to real booleans/floats and adds `photo_url` so the UI can render evidence photos directly (also exposes `thefts_suspected` and an optional `camera_id` filter).

### Fixed — 2026-11-06

- **CORS blocked the Vite frontend**: `CORSMiddleware` only allowed `settings.FRONTEND_ORIGIN` (default `http://localhost:3000`), so browser requests from Vite ports 5173–5176 failed with "Disallowed CORS origin" / "unable to fetch". Allowed ports 5173–5176 + 3000 and disabled credentialed wildcard handling in `services/api/app/main.py`.
- **Misleading `duration_seconds`**: the shoplifting monitor used wall-clock processing time (≈40s) instead of video time for a 22s clip. `process_frame()` now accepts `timestamp_seconds`, and the pipeline passes `frame_idx / fps`; durations now stay within the clip (17.7s / 21.3s / 2.6s on `Shoplifting.mp4`). Existing monitor tests still pass (7/7).
- **Video playback MIME**: `GET /api/v1/shoplifting/videos/{filename}` now infers the media type from the file suffix instead of hardcoding `video/mp4`, and path resolution is hardened with `.resolve()`.

### Added
- **Frontend Migration — LandingPage from GitHub (`apps/web/`)**:
  - Replaced Next.js frontend with Vite + React + Tailwind CSS LandingPage from `farhanmallik05/drishtiflow` GitHub repo.
  - Features: Landing page with hero section, 3D camera preview, shoplifting/police demo, 3-pillar architecture, competitor benchmark table, team attribution.
  - Dashboard: Overview, Live Cameras, AI Detection, Emergency Center, Voice Assistant, Automation Rules, Notifications, History, Analytics, Camera Management, Settings.
  - Full backend integration: API calls to `http://localhost:8000` for health, incidents, shoplifting, fall monitoring, etc.
  - 105 kB First Load JS bundle.

### Fixed
- **Frontend migration**: Replaced Next.js apps/web with Vite + React LandingPage from GitHub repo (farhanmallik05/drishtiflow)
- All API endpoints connect to backend at http://localhost:8000
- **Backend health 404**: Added root-level `GET /health` alias in `services/api/app/main.py` so `/health` returns 200 OK.
- **React version mismatch**: Installed matching `react@18.3.1` + `react-dom@18.3.1` in `apps/web/` (was mixing 18.3.1 root with 19.3.1 local).
- **Missing ZoneCanvas**: Created `apps/web/src/components/camera/ZoneCanvas.tsx` with `Point`, `isPointInPolygon`, and `ZoneCanvas` component (imported by friend's `CameraPreview.tsx`).
- **Vite env fix**: Changed `process.env.NEXT_PUBLIC_API_URL` to `import.meta.env.VITE_API_URL` in `CameraPreview.tsx` (Vite doesn't define `process`).
- **Video upload tab**: Added "Video Upload & Detection" tab in `App.tsx` connecting friend's `CameraPreview.tsx` to the dashboard.
- Frontend runs on Vite port 5173+ (not port 3000/Next.js as INSTALL.md incorrectly states).

---
  - `ShopliftMonitor` composes the existing YOLOv8n person detector + zone point-in-polygon filter to track persons across frames.
  - Records shop `entry_time` (first entry into shop zone) and `exit_time` (exit or disappearance) per person.
  - Flags `theft_suspected=True` when a person dwells near shelves/items and then exits the shop zone.
  - Captures ONE evidence photo (person bounding-box crop JPEG) per suspected-theft incident in `assets/evidence/`.
  - Appends one row per person to a pandas DataFrame persisted as `assets/shop_theft_log.csv` with columns: track_id, camera_id, entry_time, exit_time, duration_seconds, shelf_interaction, theft_suspected, detector_confidence, photo_path, logged_at.
  - `to_dataframe()` / `save_dataframe()` helpers; `flush()` finalizes active tracks at end of video.
- **Demo pipeline runner (`services/edge-agent/tools/run_shoplift_pipeline.py`)** (`TSK-D2-06`): processes a video through the monitor and writes the pandas CSV log; CLI flags for video, camera, output path, evidence dir, and stride.
- **Unit tests (`services/edge-agent/tests/test_shoplift_monitor.py`)** (`TSK-D2-06`): 7 tests covering entry/exit times, theft-flag logic, one-photo-per-incident, DataFrame schema, CSV export, and multi-person rows (stubbed detector for deterministic, fast runs).
- **Shoplifting Log tab (`apps/web/src/components/incidents/ShopliftingLog.tsx`)** (`TSK-D4-05`):
  - Table-based log showing every person tracked by the edge agent: track id, entry time, exit time, duration, "Near Items" flag, detection confidence, and a "Suspected Theft" badge with the person's evidence photo.
  - Reads `/api/v1/shoplifting/log` generated by the edge agent's `shop_theft_log.csv`.
- **Plain-language UI (`apps/web/src/app/page.tsx`, `apps/web/src/components/camera/CameraPreview.tsx`)** (`TSK-D4-05`):
  - Tab labels rewritten: "Live Monitor", "Set Up Rules", "Recent Events", "Shoplifting Log".
  - Monitor status badge: "PERSON IN RESTRICTED AREA" instead of "ZONE BREACH DETECTED".
  - Footer instructions and header subtitle rewritten in plain language.
- **Shoplifting API router (`services/api/app/routers/shoplifting.py`)** (`TSK-D4-05`):
  - `GET /api/v1/shoplifting/log` returns every person tracked (entry_time, exit_time, duration_seconds, shelf_interaction, theft_suspected, detector_confidence, photo_path).
  - `GET /api/v1/shoplifting/evidence/{filename}` serves a single evidence photo (person crop JPEG).
  - Registered in `services/api/app/main.py`.
- **UI animations removed** (`TSK-D4-06`): Removed `animate-spin`, `animate-pulse`, `animate-ping` from CameraPreview.tsx, page.tsx, IncidentFeed.tsx, RuleBuilder.tsx for a clean non-distracting UI.
- **Video upload & processing (`TSK-D4-06`)**:
  - Frontend: "Upload Shop Video" section in the monitor tab with file input, upload button, and process button (`apps/web/src/components/camera/CameraPreview.tsx`).
  - Backend (`services/api/app/routers/shoplifting.py`): `POST /api/v1/shoplifting/upload-video` accepts multipart video uploads and saves to `assets/videos/`; `POST /api/v1/shoplifting/process-video` runs the full YOLOv8n + shoplifting monitor pipeline on an uploaded video and returns entry/exit times and theft counts. Registered in `services/api/app/main.py`.

### Fixed
- **Next.js hydration error (`CameraPreview.tsx`)**:
  - `new Date().toLocaleDateString()` / `toLocaleTimeString()` produced different strings on server ("5/11/2026") vs client ("05/11/2026"), causing "Text content does not match server-rendered HTML" on page load. Added `suppressHydrationWarning` to the date span.
- **Video upload crash via YOLO model path (`yolo_detector.py`)**:
  - `YOLOEdgeDetector(model_path="yolov8n.pt")` used a relative path that only worked from the repo root. When `POST /api/v1/shoplifting/process-video` ran the pipeline as a subprocess from `services/api/`, the model file was not found and the upload/process flow crashed. Added robust path resolution: checks as-is, then relative to repo root, falling back to Ultralytics auto-download.
- **Frontend API base URL (`.env.example`)**:
  - Added `NEXT_PUBLIC_API_URL=http://localhost:8000` so the browser-side `fetch()` calls in `CameraPreview.tsx` and `ShopliftingLog.tsx` resolve correctly (Next.js only exposes `NEXT_PUBLIC_*` vars to the client).
- **`POST /api/v1/shoplifting/process-video` 422 error (`shoplifting.py`)**:
  - `video_path: str` was treated as a query parameter by FastAPI, but the frontend sends `{"video_path": "..."}` as a JSON body, causing `422 Unprocessable Entity`. Changed to `video_path: str = Body(..., embed=True)` so FastAPI reads it from the JSON body, matching the frontend's `fetch()` payload.

### Verified
- `pytest services/edge-agent/tests/ services/api/tests/ -q`: **48/48 passed** (7 new shoplift tests + existing suites, no regressions).
- End-to-end smoke on real CCTV footage: `shop_theft_log.csv` produced (109 rows, 18 theft-suspected incidents, 18 evidence photos).
- `npm run build --workspace=apps/web`: UI compiles successfully.

---

## [0.1.0-alpha.5] - 2026-11-05 (Real YOLOv8n Edge Inference on Live CCTV Footage)

### Added
- **Real YOLOv8n detector (`services/edge-agent/inference/yolo_detector.py`)**:
  - Replaced mock `yolov8n` labels with live Ultralytics YOLOv8n inference (`yolov8n.pt`, 6.2 MB weights auto-downloaded on first run).
  - Normalizes COCO detections into the shared allowlisted enum (`person`, `vehicle`, `car`, `truck`, `motorcycle`, `animal`) with [0,1]-normalized bboxes.
  - Exposes rolling telemetry: average inference ms and FPS.
- **Real CCTV test footage**: `services/edge-agent/assets/videos/cctv_intrusion_1.mp4` (640×360 @30 FPS, ~10 min) downloaded via `yt-dlp` — real intrusion video with persons entering restricted areas.
- **End-to-end real-video pipeline tool (`services/edge-agent/tools/run_real_video_pipeline.py`)**:
  - YOLOv8n detection → zone PiP filter → dwell tracker (1.5s) → candidate event emitter → FastAPI backend → verifier → policy → action dispatch.
  - Validated: 14 candidate events emitted to live API over a full ~10-minute video run; verifier returned `confirmed`/`uncertain`; policy dispatched `action_sent` for confirmed incidents.
- **YOLO detector unit tests (`services/edge-agent/tests/test_yolo_detector.py`)**: 4 tests covering model load, detection schema compliance, confidence threshold filtering, and inference performance floor.

### Fixed
- **Test `test_inference_performance_budget`**: pins `torch` to 1 thread and uses real video frames so the measurement is stable under shared pytest CPU load (isolated dedicated-CPU runs hit 27.5 FPS, exceeding the 20 FPS PRD budget).
- **Missing `python-multipart` dependency (`requirements.txt`)**:
  - `UploadFile = File(...)` in `POST /api/v1/shoplifting/upload-video` requires `python-multipart` for form parsing. Without it, the API crashes on startup with `RuntimeError: Form data requires "python-multipart" to be installed`. Added `python-multipart>=0.0.32` to `services/api/requirements.txt`.
- **Removed animated person figure and zone box from Camera Preview when viewing uploaded video (`CameraPreview.tsx`)**:
  - Disabled the animated stick figure person simulation when `uploadedVideoPath` is set — no more orange walking figure or moving bounding box on real footage.
  - Disabled dwell detection / zone alarm when viewing uploaded video — no more "IN ZONE" badge or red polygon overlay on real video.
  - Hidden zone drawing controls (Draw Zone, Clear Zone, Reset) when viewing uploaded video — no zone selection needed for pre-recorded footage.
  - The viewport now plays the uploaded video cleanly via `GET /api/v1/shoplifting/videos/{filename}` with no overlays.

### Verified
- `pytest services/api/tests/ services/edge-agent/tests/ -q`: **48/48 passed** in 17.50s.
- YOLOv8n isolated benchmark: 36 ms/frame (27.5 FPS CPU) on real content — exceeds the 20 FPS edge-vision budget.
- Full pipeline run on real CCTV footage emitted 14 candidate events; all accepted by live API (201 Created); demo DB left clean after test runs.
- `npm run lint --workspace=apps/web`: 0 errors 0 warnings; `npm run build --workspace=apps/web`: success, 104 kB First Load JS.

---

### Fixed
- **API List Endpoint 500s (schema resilience — `services/api/app/schemas/`)**:
  - `IncidentResponse.detector_confidence` changed from required `float` to `Optional[float]`: legacy rows with `NULL` detector confidence (`inc-stress-*`, seeded by an older stress-test naming scheme) previously invalidated the entire `GET /api/v1/incidents` collection with Pydantic `ValidationError` → HTTP 500.
  - `CameraResponse.status` changed from strict `Literal['pending','online','degraded','offline']` to tolerant `str`: legacy `cam-test-*` rows with `status='active'` previously 500-ed the entire `GET /api/v1/cameras` collection.
  - Aligns with AGENTS.md §3 principle: degraded/legacy data must fail-safe, not take down the read path.
- **Legacy Test Debris Purge (`services/api/drishtiflow.db`)**:
  - Removed test debris written into the live demo database by earlier test versions that lacked cleanup: 4 direct test cameras (`cam-test-*`, `cam-stress-*`), 12 duplicate `Bhiwandi Bay A Camera` rows, 38 orphan incidents (`test-cam-01`, `dummy`, orphaned camera ids), 31 orphan actions, 7 orphan feedback rows, 12 duplicate `Warehouse Intrusion Monitor` workflows, 12 orphan zones and 16 orphan workflow versions.
  - Final clean state: 2 cameras, 2 zones, 1 incident, 1 action, 1 feedback, 1 workflow, 2 versions.
- **Test Isolation Gaps (`services/api/tests/`)**:
  - `test_policy_and_events.py`: added autouse post-test cleanup fixture (previously wrote untracked `test-cam-01` incidents and simulator actions into the shared demo DB on every run).
  - `test_e2e_pipeline.py`: added autouse cleanup fixture deduplicating seed fingerprints (`Bhiwandi Bay A Camera`, `Warehouse Intrusion Monitor`, `test-cam-01`) so mid-test assertion failures can no longer leak rows; inline teardown unchanged.

- **README.md (`README.md`)**:
  - Comprehensive project README with architecture diagrams, system flows, tech stack, directory structure, installation, API endpoints, testing, team ownership, security, and roadmap (R0→R4).
- **Regression tests (`services/api/tests/test_legacy_resilience.py`)**:
  - 2 tests seeding exactly the legacy values that broke the API (NULL `detector_confidence`, out-of-enum camera status) and asserting both list endpoints return 200.

### Verified
- `pytest services/api/tests/ services/edge-agent/tests/ -q`: **37/37 passed** in 11.95s (was 35/35).
- Full repeated pytest run leaves demo DB clean (row counts stable: cameras=2, incidents=1, workflows=1).
- Live uvicorn smoke test: `GET /api/v1/incidents`, `GET /api/v1/cameras`, `GET /api/v1/workflows` all 200 OK; full write-path E2E (`compile → workflow → camera → zone → activate → candidate event → verify → policy → dispatch`) reached `verified=confirmed, policy=approved, status=action_sent` with sandbox WhatsApp dispatch; 404 handling verified on unknown incident ids.
- `npm run lint --workspace=apps/web`: 0 errors 0 warnings; `npm run build --workspace=apps/web`: success, 102 kB First Load JS.

---

## [0.1.0-alpha.3] - 2026-11-04 (Roadmap Milestone Restructuring)

### Changed
- **Planning Roadmap Restructuring (`plan/ROADMAP.md` & `plan/README.md`)**:
  - Reorganized the build execution structure from a day-based sequence ("10-Day Build Sequence") into a formal milestone-based execution framework (**Milestones 1 through 10** under Milestone R0 Prototype).
  - Aligned each milestone (M1 through M10) with verified exit gates, explicit deliverables, and completed validation evidence.
  - Updated planning center references in `plan/README.md` to reflect the milestone-based execution model.

---

## [0.1.0-alpha.2] - 2026-11-04 (Remediation & Integration Polish)

### Fixed
- **Policy Engine Rate Limiting (`services/api/app/services/policy.py`)**:
  - Scoped the hourly rate limit to `camera_id` by joining the `actions` table with `incidents` (`WHERE i.camera_id = ? AND a.status in ('sent', 'delivered') AND a.created_at >= ?`).
  - Replaced SQLite string literal `datetime('now', '-1 hour')` with a UTC ISO-8601 parameter computed via `(datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()`, preventing character-set comparison mismatches.
- **Workflow Versioning & Activation Validation (`services/api/app/routers/workflows.py`)**:
  - Implemented `POST /api/v1/workflows/{id}/versions` (PRD §9) to create immutable version snapshots with automatic version incrementing.
  - Added server-side schema pre-validation in `POST /api/v1/workflows/{id}/activate` (PRD §6.2 FR-W-08), ensuring workflows have valid definitions, triggers, and at least one enabled action before activation.
- **Frontend ESLint Configuration (`apps/web/.eslintrc.json`)**:
  - Configured Next.js ESLint configuration extending `next/core-web-vitals` with compatibility for ESLint 8.
  - Achieved `✔ No ESLint warnings or errors` on `npm run lint --workspace=apps/web`.
- **API Routing Resilience & Frontend Integration (`apps/web/src/components/`)**:
  - Replaced hardcoded `http://localhost:8000` URLs across `RuleBuilder.tsx`, `WorkflowGraph.tsx`, `CameraPreview.tsx`, `ActionTester.tsx`, and `IncidentFeed.tsx` with environment-configurable `/api/v1/...` relative routes leveraging Next.js rewrites.
  - In `RuleBuilder.tsx`, persisted compiled workflows to backend via `POST /api/v1/workflows` and updated state with the saved ID.
  - In `WorkflowGraph.tsx`, integrated live activation and pausing via `POST /api/v1/workflows/{id}/activate` and `/pause` with user-facing validation error banners.
  - In `CameraPreview.tsx`, dynamically generated and attached base64 keyframe evidence snapshots to candidate event envelopes for both webcam and simulation modes.
  - In `IncidentFeed.tsx`, rendered keyframe evidence image thumbnails for incident cards possessing base64 snapshots or evidence URLs.
- **Test Isolation & Determinism (`services/api/tests/test_e2e_pipeline.py`)**:
  - Added workflow versioning snapshot verification assertions (`assert version_res.json()["version"] == 2`).
  - Added teardown cleanup fixture to remove test incidents, actions, feedback, zones, cameras, and workflows, ensuring 100% deterministic test execution on repeated runs.

### Verified
- `pytest services/api/tests/ -v`: 8/8 passed in 4.62s.
- `pytest services/edge-agent/tests/ -v`: 4/4 passed in 0.29s.
- `npm run lint --workspace=apps/web`: 0 errors, 0 warnings.
- `npm run build --workspace=apps/web`: 0 errors, 102 kB bundle size.

---

## [0.1.0-alpha.1] - 2026-11-04 (Milestone R0 Complete)

### Added
- **Monorepo Foundation & Schemas (`packages/`)**:
  - `packages/workflow-schema`: Shared Zod schemas and TypeScript models for `WorkflowDefinition`, `TriggerConfig`, `VerificationConfig`, `ActionConfig`, `CandidateEvent`, `VerificationResult`.
  - `packages/shared-types`: Domain interfaces for `Camera`, `Zone`, `Incident`, `Action`, `Feedback`, `Site`, `Organization`.
- **FastAPI Application Backend (`services/api/`)**:
  - `services/api/app/main.py`: Gateway server with CORS, structured error schemas, and auto database migration.
  - `services/api/app/database.py`: SQLite/PostgreSQL-compatible data store with multi-tenant schema matching PRD §8.
  - `services/api/app/routers/`: Routers for `/api/v1/health`, `/api/v1/workflows`, `/api/v1/cameras`, `/api/v1/events/candidates`, `/api/v1/incidents`, `/api/v1/actions/test`.
  - `services/api/app/services/compiler.py`: Vernacular rule compiler supporting Hindi, Hinglish, and English inputs, with allowlist enforcement and `needs_review` clarification questions.
  - `services/api/app/services/verifier.py`: 5-state contextual VLM verifier (`confirmed`, `not_confirmed`, `uncertain`, `needs_human_review`, `processing_failed`) with deterministic mock fallback.
  - `services/api/app/services/policy.py`: Deterministic policy engine enforcing cooldown suppression (60s), rate limits (5/hr), and schedule windows.
  - `services/api/app/services/action_dispatcher.py`: Idempotent action worker with SHA-256 keys, WhatsApp Cloud API, and Vapi Voice calling adapters.
- **Edge Agent Ingestion & Detection (`services/edge-agent/`)**:
  - `services/edge-agent/ingest/stream.py`: Reconnecting video stream handler with backoff.
  - `services/edge-agent/inference/detector.py`: Edge object detector with ray-casting point-in-polygon algorithm.
  - `services/edge-agent/tracking/tracker.py`: 1.5-second persistent dwell tracker.
  - `services/edge-agent/events/emitter.py`: Signed candidate event envelope emitter.
- **Next.js 14 Web Application (`apps/web/`)**:
  - `apps/web/src/app/page.tsx`: Full responsive web UI with bilingual DrishtiFlow branding and 3 tab navigation (Command Center, Workflow Graph, Incident Center).
  - `components/camera/CameraPreview.tsx`: Live webcam preview + high-fidelity warehouse bay simulation scene with FPS telemetry and breach visualizer.
  - `components/camera/ZoneCanvas.tsx`: Interactive HTML5 Canvas overlay for click-to-draw polygon zones with point anchors and ray-casting PIP.
  - `components/workflow/RuleBuilder.tsx`: Vernacular rule creation with audio visualizer, 4 Bharat presets, and live compiler integration.
  - `components/workflow/WorkflowGraph.tsx`: Visual 3-node flowchart (Trigger -> Verify -> Action) with interactive runtime parameter drawers.
  - `components/incidents/IncidentFeed.tsx`: Live incident cards showing detector vs verifier confidence meters, plain language explanations, and operator feedback controls.
  - `components/incidents/ActionTester.tsx`: Modal to trigger safe test WhatsApp messages and outbound voice calls.
- **Automated Test Suites (`services/api/tests/`, `services/edge-agent/tests/`)**:
  - `test_compiler.py`: Tests Hindi and English prompt compilation.
  - `test_health.py`: Tests `/api/v1/health` and `/api/v1/ready`.
  - `test_policy_and_events.py`: Tests policy evaluation and idempotency keys.
  - `test_evaluation_harness.py`: Benchmark on 10 evaluation samples (100% precision and recall).
  - `test_edge_agent.py`: Tests stream reconnect, PIP geometry, and dwell tracker (4/4 passed).
  - `test_e2e_pipeline.py`: Full end-to-end integration test across all 6 stages (passed in 0.68s).

### Verified
- 12/12 pytest unit and integration tests passing cleanly in 4.36s.
- `next build` compiled with 0 errors (100 kB First Load JS).
- All 27 tasks across 7 tracks marked `[x] DONE` in `plan/TASKS.md`.
- Milestone R0 scope 100% fulfilled.

---

## [0.1.0-alpha.0] - 2026-11-04

#### Added
- **Planning Infrastructure (`plan/`)**: Initialized planning center and PFCP protocol rules.
- **Repository Setup**: Initialized Git repository, `.gitignore`, and `.env.example`.
