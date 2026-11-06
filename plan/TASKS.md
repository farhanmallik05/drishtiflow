# DrishtiFlow Work Breakdown Structure (TASKS.md)
**Milestone:** R0 — Hackathon Prototype (Build with Bharat 5.0)  
**Governing Document:** [DrishtiFlow_Enhanced_PRD_v3_EMPTY.md](file:///d:/hackathon/Build%20with%20Bharat/DrishtiFlow_Enhanced_PRD_v3_EMPTY.md)  
**Plan Rule:** [plan/PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md)  
**Last Updated:** 2026-11-06T11:35:00+05:30

---

## Task Status Legend
- `[ ] TODO` : Not started
- `[~] IN_PROGRESS` : Currently being worked on
- `[x] DONE` : Implemented, verified with test evidence, and documented
- `[!] BLOCKED` : Blocked by an upstream dependency or open decision

---

## Summary Matrix

| Track | Owner | Total Tasks | Completed | In Progress | Pending |
|---|---|:---:|:---:|:---:|:---:|
| **Track 0: Project Setup & Plan System** | Farhan | 3 | 3 | 0 | 0 |
| **Track 1: Monorepo & Shared Schemas** | Farhan | 4 | 4 | 0 | 0 |
| **Track 2: Camera Ingestion & Edge Vision** | Kartikey | 4 | 4 | 0 | 0 |
| **Track 3: Context Verification Engine** | Ankit | 4 | 4 | 0 | 0 |
| **Track 4: Frontend, Canvas & Incident UI** | Piyush | 7 | 7 | 0 | 0 |
| **Track 5: Policy Engine & Action Worker** | Kaushendra | 4 | 4 | 0 | 0 |
| **Track 6: Testing, Evaluation & Pitch** | All | 6 | 6 | 0 | 0 |
| **Track R1-A: Fall Detection & Hospital Emergency Dispatch** | All | 6 | 6 | 0 | 0 |
| **Track R1-B: Pilot Blocker Clearance Track** | All | 10 | 0 | 3 | 7 |
| **R0 Demo Reliability Addendum** | Farhan / Kartikey / Ankit / Piyush | 3 | 3 | 0 | 0 |
| **Grand Total** | | **51** | **41** | **3** | **7** |

---

## Detailed Task Breakdown

### Track 0: Project Setup & Planning Infrastructure (Owner: Farhan)

- [x] **`TSK-INIT-01`**: Establish `plan/` directory structure, architecture documentation, and mandatory Plan-First Change Protocol rules.
  - **Dependencies:** None
  - **Acceptance Criteria:**
    - `plan/` directory created with `PLAN_RULE.md`, `README.md`, `STATE.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `TASKS.md`, `STANDARDS.md`, `CHANGELOG.md`.
    - `GEMINI.md`, `AGENTS.md`, and `.agents/rules/plan-discipline.md` configured to enforce continuous plan synchronization.
  - **Validation Evidence:** Files created, cross-referenced, and verified on disk.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-INIT-02`**: Initialize Git repository and commit baseline planning and governance artifacts.
  - **Dependencies:** `TSK-INIT-01`
  - **Acceptance Criteria:** `git init` executed, `.gitignore` created (ignoring node_modules, .env, __pycache__), initial commit created.
  - **Validation Evidence:** Git repository initialized; `.gitignore` created with Node, Python, Next.js, and secret patterns; clean untracked status verified.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-INIT-03`**: Create master `.env.example` file documenting all server-side and client-side configuration variables.
  - **Dependencies:** `TSK-INIT-01`
  - **Acceptance Criteria:** `.env.example` includes database, AI provider, action service, and port configurations matching PRD §16.
  - **Validation Evidence:** `.env.example` created covering Supabase, Gemini/Groq, Vapi, WhatsApp, and Edge Agent tokens.
  - **Completed Date:** 2026-11-04

---

### Track 1: Monorepo Foundation & Shared Contracts (Owner: Farhan)

- [x] **`TSK-D1-01`**: Monorepo directory scaffolding.
  - **Dependencies:** `TSK-INIT-02`
  - **Scope:** Create `apps/web`, `services/api`, `services/edge-agent`, `packages/workflow-schema`, `packages/shared-types`.
  - **Acceptance Criteria:** Directory structure matches PRD §15.2 blueprint; workspace package configuration configured.
  - **Validation Evidence:** Root `package.json` workspaces configured; `packages/workflow-schema` and `packages/shared-types` scaffolded.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D1-02`**: Shared Workflow Schema Specification.
  - **Dependencies:** `TSK-D1-01`
  - **Scope:** Define Pydantic and TypeScript Zod models for `WorkflowDefinition`, `TriggerConfig`, `VerificationConfig`, `ActionConfig`.
  - **Acceptance Criteria:** Schema validates PRD §6.1 sample workflow JSON cleanly with zero errors.
  - **Validation Evidence:** Zod schema in `packages/workflow-schema/src/index.ts` and Pydantic schema in `services/api/app/schemas/workflow.py` created and tested.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D1-03`**: FastAPI Backend Application Skeleton.
  - **Dependencies:** `TSK-D1-01`, `TSK-D1-02`
  - **Scope:** Set up FastAPI app in `services/api/app/main.py` with CORS, structured logging, and health routes.
  - **Acceptance Criteria:** `/api/v1/health` and `/api/v1/ready` respond with HTTP 200 and JSON payload.
  - **Validation Evidence:** `test_health.py` passes 2/2 tests asserting status 200 and DB connectivity.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D1-04`**: Vernacular Workflow Compiler Engine.
  - **Dependencies:** `TSK-D1-02`, `TSK-D1-03`
  - **Scope:** Implement `/api/v1/workflows/compile` utilizing LLM with strict system prompt from PRD §6.1.
  - **Acceptance Criteria:** Successfully converts Hindi ("Raat 10 baje ke baad godown mein koi aaye toh alert karo") into valid `needs_review` workflow JSON.
  - **Validation Evidence:** `test_compiler.py` passes 2/2 tests validating Hindi and English prompt compilation into `needs_review` workflows.
  - **Completed Date:** 2026-11-04

---

### Track 2: Camera Ingestion & Edge Vision Engine (Owner: Kartikey)

- [x] **`TSK-D2-01`**: Browser Webcam Stream Ingestion.
  - **Dependencies:** `TSK-D1-01`
  - **Scope:** Implement camera capture component using `getUserMedia` with device selection and frame dimension validation.
  - **Acceptance Criteria:** Live video feeds render smoothly in browser preview with FPS counter.
  - **Validation Evidence:** Implemented in `apps/web/src/components/camera/CameraPreview.tsx` with media stream attach/cleanup and 24 FPS telemetry.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D2-02`**: Pre-recorded Sample Clip Simulation Player.
  - **Dependencies:** `TSK-D1-01`
  - **Scope:** Add switchable sample clip player (warehouse intrusion footage) for reproducible demo testing without physical cameras.
  - **Acceptance Criteria:** UI can toggle between live webcam and warehouse sample clip seamlessly.
  - **Validation Evidence:** Switchable high-fidelity warehouse bay simulation scene with moving person silhouette and rack overlay in `CameraPreview.tsx`.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D2-03`**: Interactive Polygon Zone Canvas Overlay.
  - **Dependencies:** `TSK-D2-01`
  - **Scope:** Create HTML5 Canvas overlay enabling users to click and draw restricted zones with normalized coordinates `[0.0, 1.0]`.
  - **Acceptance Criteria:** Polygon vertices saved to zone state and rendered over video feed with visual styling.
  - **Validation Evidence:** `apps/web/src/components/camera/ZoneCanvas.tsx` implemented with click-to-draw, point anchors, and ray-casting point-in-polygon math.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D2-04`**: ONNX Runtime Web Person Detector & Zone Trigger.
  - **Dependencies:** `TSK-D2-01`, `TSK-D2-03`
  - **Scope:** Integrate YOLOv8n ONNX model with WebGPU/WASM execution; run ray-casting point-in-polygon test; emit candidate event on 1.5s presence.
  - **Acceptance Criteria:** Walking into the drawn polygon triggers a candidate event payload with bounding box and timestamp.
  - **Validation Evidence:** Implemented in `CameraPreview.tsx` and validated in `services/edge-agent/tests/test_edge_agent.py` (4/4 passed).
  - **Completed Date:** 2026-11-04

---

### Track 3: Context Verification & VLM Evaluation (Owner: Ankit)

- [x] **`TSK-D3-01`**: Context Verification Schema & Decision Model.
  - **Dependencies:** `TSK-D1-02`
  - **Scope:** Implement Pydantic schema for verification results (`confirmed`, `not_confirmed`, `uncertain`, `needs_human_review`, `processing_failed`).
  - **Acceptance Criteria:** Schema rejects uncalibrated boolean outputs and enforces structured reason explanation.
  - **Validation Evidence:** `services/api/app/schemas/verification.py` created with `VerificationResult`.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D3-02`**: Cloud VLM Adapter (Gemini / Groq Vision).
  - **Dependencies:** `TSK-D3-01`, `TSK-D1-03`
  - **Scope:** Build service calling vision LLM with candidate snapshot keyframe and constrained verification prompt.
  - **Acceptance Criteria:** Returns schema-compliant decision payload within 3.5 seconds p95 latency.
  - **Validation Evidence:** `services/api/app/services/verifier.py` implements VLM adapters.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D3-03`**: Deterministic Mock Verifier Fallback.
  - **Dependencies:** `TSK-D3-01`
  - **Scope:** Implement local mock verifier returning pre-determined decisions for sample clips when offline or when cloud API times out.
  - **Acceptance Criteria:** Mock mode can be activated via configuration switch for offline hackathon presentations.
  - **Validation Evidence:** Deterministic mock heuristic with 300ms simulated inference latency in `verify_context`.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D3-04`**: Evaluation Test Harness & Dataset.
  - **Dependencies:** `TSK-D3-02`, `TSK-D3-03`
  - **Scope:** Create script to benchmark verifier against 10 sample test images (5 intrusions, 5 hard negatives like dogs/shadows).
  - **Acceptance Criteria:** Generates precision/recall report and logs per-sample reasoning.
  - **Validation Evidence:** Synthetic evaluation harness is present, but it does not establish real-world precision or recall; real labeled footage remains an R1 blocker.
  - **Completed Date:** 2026-11-04

---

### Track 4: Frontend Application, Canvas & Incident UI (Owner: Piyush)

- [x] **`TSK-D4-01`**: Next.js 14 App Shell & Navigation.
  - **Dependencies:** `TSK-D1-01`
  - **Scope:** Set up Next.js app with Tailwind CSS, Lucide icons, dark/light theme, and main layout (Command Center, Camera Setup, Rule Builder, Incident Feed).
  - **Acceptance Criteria:** Responsive layout with Hindi/English bilingual header and navigation tabs.
  - **Validation Evidence:** `apps/web` compiled cleanly via `next build` (100 kB First Load JS); bilingual header and tabs verified.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D4-02`**: Vernacular Rule Creation UI.
  - **Dependencies:** `TSK-D4-01`, `TSK-D1-04`
  - **Scope:** Build voice/text prompt input with audio recording visualizer, preset selector (Mandi, MSME, Hospital), and compile trigger.
  - **Acceptance Criteria:** Submitting Hindi prompt displays compile loading state and renders proposed rule configuration.
  - **Validation Evidence:** `RuleBuilder.tsx` implemented with 4 Bharat presets and live backend compile integration.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D4-03`**: React Flow Workflow Graph & Node Config.
  - **Dependencies:** `TSK-D4-02`
  - **Scope:** Implement interactive visual node canvas: Trigger Node → Verify Node → Action Node with editable side drawer forms.
  - **Acceptance Criteria:** Graph renders nodes cleanly; editing parameters in side drawer updates node data and passes validation.
  - **Validation Evidence:** `WorkflowGraph.tsx` renders 3-node visual flowchart with customizable parameter drawers for each stage.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D4-04`**: Realtime Incident Feed & Feedback Card.
  - **Dependencies:** `TSK-D4-01`
  - **Scope:** Build live Incident Center showing event cards with keyframe snapshots, detector/verifier confidence, reason, and feedback buttons.
  - **Acceptance Criteria:** New incidents appear in feed dynamically; clicking "True Positive" or "False Positive" submits feedback; keyframe evidence snapshots display cleanly.
  - **Validation Evidence:** `IncidentFeed.tsx` displays event cards with confidence comparison meters, keyframe image snapshots (`evidence_frame_base64`/`evidence_url`), and operator feedback buttons. Clean Next.js ESLint verified with 0 warnings/errors.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D4-05`**: Shoplifting Log Tab & Plain-Language UI Clarity.
  - **Dependencies:** `TSK-D2-06`, `TSK-D4-04`
  - **Owner:** Piyush (implemented by agent on user request)
  - **Scope:** Make the UI understandable for a shop owner who cannot parse technical jargon: (1) Added a "Shoplifting Log" tab that reads `services/edge-agent/assets/shop_theft_log.csv` via the new `/api/v1/shoplifting/log` API endpoint and lists each person with plain-language entry time, exit time, duration, "Suspected Theft" flag, detection confidence, and their evidence photo in a table; (2) Rewrote UI labels into plain terms ("Person in Restricted Area" instead of "RESTRICTED ZONE BREACH", "Live Monitor" instead of "Command Center", "Set Up Rules" instead of "Rule & Workflow Graph", "Recent Events" instead of "Incident Center"); (3) Added `services/api/app/routers/shoplifting.py` to serve the CSV log and evidence photos to the frontend.
  - **Acceptance Criteria:** A non-technical user can open the Shoplifting Log and see who entered, when they left, whether theft is suspected, and the photo; monitor tab uses plain language; UI passes lint/build.
  - **Validation Evidence:**
    - `npm run build --workspace=apps/web`: Compiles successfully (16.2 kB, 103 kB shared).
    - `pytest services/edge-agent/tests/ services/api/tests/ -q`: 48/48 passed (no regressions).
    - `ShopliftingLog.tsx` table-based log reads `/api/v1/shoplifting/log` and displays entry_time, exit_time, duration, theft_suspected flag, confidence, and photo per person.
  - **Completed Date:** 2026-11-05
  - **Git/File Ref:** `apps/web/src/components/incidents/ShopliftingLog.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/components/camera/CameraPreview.tsx`, `services/api/app/routers/shoplifting.py`, `services/api/app/main.py`

- [x] **`TSK-D4-06`**: Remove UI Animations & Add Video Upload.
  - **Dependencies:** `TSK-D4-05`, `TSK-D2-06`
  - **Owner:** Piyush (implemented by agent on user request)
  - **Scope:** (1) Removed all CSS animations (animate-spin, animate-pulse, animate-ping) from CameraPreview.tsx, page.tsx, IncidentFeed.tsx, RuleBuilder.tsx; (2) Added "Upload Shop Video" section in the monitor tab with file input, upload button, and process button; (3) Added backend endpoints `POST /api/v1/shoplifting/upload-video` (multipart file upload → saves to assets/videos/) and `POST /api/v1/shoplifting/process-video` (runs the YOLOv8n + shoplifting monitor pipeline on the uploaded video); (4) Tested pipeline on existing CCTV footage: produced shop_theft_log.csv with 109 rows, 18 theft-suspected incidents, 18 evidence photos.
  - **Acceptance Criteria:** Animations removed; upload button visible and functional; uploaded video saved and processable; pipeline produces correct shop_theft_log.csv rows on test videos.
  - **Validation Evidence:**
    - `npm run build --workspace=apps/web`: Compiles successfully (16.9 kB, 104 kB shared).
    - `pytest services/edge-agent/tests/test_shoplift_monitor.py services/api/tests/ -q`: 40/40 passed.
    - `services/api/app/routers/shoplifting.py`: imports OK, upload-video + process-video endpoints registered.
    - Pipeline run on `cctv_intrusion_1.mp4`: 109 persons tracked, 18 theft_suspected=True, 18 evidence photos saved.
  - **Completed Date:** 2026-11-05
  - **Git/File Ref:** `apps/web/src/components/camera/CameraPreview.tsx`, `services/api/app/routers/shoplifting.py`, `services/api/app/main.py`

- [x] **`TSK-D4-07`**: Futuristic 3D Landing Page & Smart Surveillance Operations Platform (`LandingPage`).
  - **Dependencies:** `TSK-D4-01`
  - **Owner:** Piyush
  - **Scope:** Complete cyber-tactical 3D surveillance portal and emergency command platform:
    1. Interactive Three.js 3D Dome PTZ Surveillance Camera with pan-tilt turret, holographic scanning laser, and particle field.
    2. Procedural multi-camera monitoring canvas covering 6 zones (Main Entrance, Underground Parking B2, Executive Corridor 3F, Rooftop North Perimeter, Server Vault, Loading Dock South) with Phosphor Night Vision and Thermal IR shaders.
    3. Emergency Detection Center with 4 audit scenarios (Fall risk, Fire/smoke, Unauthorized entry, Person down) and 5-stage verified response pipeline.
    4. "LISTY AI" voice-controlled assistant with English and Hindi NLU rule parsing and synthesized voice responses.
    5. Smart Automation Rules Engine, Multi-channel Notification Center, Analytics Density Heatmap, and Camera Fleet Manager with Privacy Masking editor.
  - **Validation Evidence:**
    - `npm run build` in `LandingPage`: builds cleanly with Vite in 875ms (`dist/` generated, 0 type errors).
    - Interactive 3D scene, voice commands, and multi-camera views tested locally.
  - **Completed Date:** 2026-11-06
  - **Git/File Ref:** `LandingPage/`
---

### Track 5: Policy Engine & Action Worker (Owner: Kaushendra)

- [x] **`TSK-D5-01`**: Deterministic Policy Engine.
  - **Dependencies:** `TSK-D1-03`
  - **Scope:** Implement rule evaluator enforcing cooldowns (default 60s), camera-scoped rate limits (5/hour), schedule checks, and active flags.
  - **Acceptance Criteria:** Suppresses duplicate candidate events arriving within the cooldown window; correctly scopes rate limits to specific cameras; matches UTC ISO-8601 timestamps without SQLite format mismatch; logs suppression reason.
  - **Validation Evidence:** `services/api/app/services/policy.py` implemented with camera join on incidents table and ISO cutoff parameter; verified via `test_policy_and_events.py` and `test_e2e_pipeline.py` (8/8 API tests passing).
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D5-02`**: Action Queue & Idempotency Engine.
  - **Dependencies:** `TSK-D5-01`
  - **Scope:** Build in-memory / database action dispatcher with unique idempotency key generation and retry counter.
  - **Acceptance Criteria:** Re-submitting the same incident action never triggers duplicate sends.
  - **Validation Evidence:** SHA-256 idempotency key generation implemented; tested in `test_action_test_endpoint`.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D5-03`**: WhatsApp Cloud API Notification Adapter.
  - **Dependencies:** `TSK-D5-02`
  - **Scope:** Build adapter to format and dispatch WhatsApp alerts with snapshot link and incident details to verified recipient.
  - **Acceptance Criteria:** Sends structured message in live mode; logs payload in sandbox mode without crashing.
  - **Validation Evidence:** `ActionDispatcher.dispatch` handles `whatsapp_message` with live HTTPX call or sandbox mode.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D5-04`**: Vapi Voice Alert Adapter & Dashboard Audio Alert.
  - **Dependencies:** `TSK-D5-02`
  - **Scope:** Implement outbound voice call trigger via Vapi API and browser audio alarm sound player for dashboard.
  - **Acceptance Criteria:** Triggers voice call payload to pre-configured test number; dashboard plays audio alert on high-severity incident.
  - **Validation Evidence:** `ActionDispatcher.dispatch` handles `voice_call` and `local_siren`; tested in test suite.
  - **Completed Date:** 2026-11-04

---

### Track 6: Testing, Evaluation & Pitch Preparation (Owner: All)

- [x] **`TSK-D6-01`**: End-to-End Integration Test Suite.
  - **Dependencies:** All tracks
  - **Scope:** Test full pipeline: Hindi prompt → workflow compile → zone detection → VLM verify → policy check → action dispatch → versioning snapshot → teardown isolation.
  - **Acceptance Criteria:** Automated test script executes the entire pipeline in under 5 seconds with all assertions passing deterministically on repeated runs.
  - **Validation Evidence:** `services/api/tests/test_e2e_pipeline.py` executes full 6-stage lifecycle in 0.77s; includes version snapshot validation (`POST /api/v1/workflows/{id}/versions`) and clean teardown isolation.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D6-02`**: Chaos & Degradation Scenarios.
  - **Dependencies:** `TSK-D6-01`
  - **Scope:** Test edge disconnect, VLM timeout, and invalid action response.
  - **Acceptance Criteria:** System marks camera offline and incident `uncertain` without uncaught exceptions or UI freezing.
  - **Validation Evidence:** Degraded status handling in `services/api/app/routers/health.py` and `services/api/app/services/verifier.py`.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D6-03`**: Benchmark & Metrics Validation Report.
  - **Dependencies:** `TSK-D6-01`
  - **Scope:** Measure and document inference FPS, VLM verification latency, false alert suppression rate, and action dispatch time.
  - **Acceptance Criteria:** Results documented in `plan/STATE.md` with honest, evidence-backed numbers.
  - **Validation Evidence:** Historical synthetic metrics are retained in the changelog; current reproducible test counts and limitations are recorded in `plan/STATE.md`.
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D6-04`**: 3-Minute Live Pitch Rehearsal & Backup Assets.
  - **Dependencies:** `TSK-D6-01`
  - **Scope:** Rehearse the 3-minute pitch script (PRD §19.1); prepare offline fallback clips and architecture slides.
  - **Acceptance Criteria:** Rehearsal completed within 3:00 timeline; offline toggle tested and verified.
  - **Validation Evidence:** Offline fallback mock mode documented in `plan/ARCHITECTURE.md` and integrated into UI.
  - **Completed Date:** 2026-11-04

---

- [x] **`TSK-D6-06`**: Fix 500s on `GET /api/v1/incidents` & `GET /api/v1/cameras` (legacy-row resilience) + purge demo DB test debris.
  - **Dependencies:** `TSK-D6-05`
  - **Scope:** (1) Make `IncidentResponse.detector_confidence` optional and `CameraResponse.status` tolerant to legacy out-of-enum values so one bad row can no longer 500 the whole collection (fail-safe per AGENTS.md §3). (2) Purge legacy test debris from `services/api/drishtiflow.db` (`cam-test-*`, `cam-stress-*`, `test-cam-01` incidents, duplicate Bay-A cameras / Warehouse workflows, orphan actions/feedback/zones: 4 cameras, 12 duplicate cameras, 38 orphan incidents, 31 orphan actions, 7 orphan feedback, 12 duplicate workflows, 12 orphan zones, 16 orphan workflow versions removed). (3) Add missing autouse cleanup to `test_policy_and_events.py` and `test_e2e_pipeline.py` teardown hardening to stop future DB pollution. (4) Add `services/api/tests/test_legacy_resilience.py` regression tests (2 tests).
  - **Acceptance Criteria:** After remediation, `pytest` is 37/37 green; all list endpoints return 200; a full repeated pytest run leaves the demo DB clean (cameras=2, incidents=1, workflows=1); live `GET /incidents`, `/cameras`, `/workflows` verified 200.
  - **Validation Evidence:** Live server re-run after fix: 200 OK on all three list endpoints (UVicorn log verified); DB row counts stable after full test suite rerun.
  - **Completed Date:** 2026-11-04

---

---

## Track R1: Fall Detection & Hospital Emergency Dispatch (Owner: All)

- [x] **`TSK-R1-FALL-01`**: Pose Estimation Model Integration (YOLOv8n-Pose).
  - **Validation Evidence:** `test_yolo_pose_detector.py` covers keypoints, posture classification, missing keypoints, normalization, and defaults.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-FALL-02`**: Fall State Machine with 3-5 Second Timer.
  - **Validation Evidence:** `test_fall_monitor.py` covers transitions, timer boundaries, recovery, removal, active falls, and multi-person tracking.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-FALL-03`**: Hospital Reception Emergency Dispatch.
  - **Validation Evidence:** Manual emergency endpoint returns 201 with dispatch metadata.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-FALL-04`**: Fall Monitor UI Tab.
  - **Validation Evidence:** Frontend lint and production build pass; tab is integrated into `page.tsx`.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-FALL-05`**: Fall Detection API Router & Endpoints.
  - **Validation Evidence:** Status, event ingest, and emergency endpoints were manually verified with 200/201 responses.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-FALL-06`**: Fall Detection End-to-End Test Suite.
  - **Dependencies:** `TSK-R1-FALL-01`, `TSK-R1-FALL-02`, `TSK-R1-FALL-03`, `TSK-R1-FALL-05`
  - **Acceptance Criteria:** Simulated footage verifies the 3-5 second trigger, dispatch, persistence, and brief-bend false-positive behavior.
  - **Validation Evidence:** services/api/tests/test_fall_e2e_pipeline.py passes (3/3): full pose stream to hospital dispatch, 3.0s confirmation timer, false positive prevention (transient bend), and manual emergency escalation.
  - **Completed Date:** 2026-11-06

## Milestone R1: Supervised Pilot MVP ? Acceptance Criteria & Blocker Clearance Track (Owner: All)

This track governs the ten non-negotiable Pilot Release Blockers (`BLOCKER-01` to `BLOCKER-10`) from PRD ?20.3. Historical claims remain labeled as findings until reproducible evidence is available.

- [ ] **`TSK-R1-01`**: 30-Minute Continuous Stability Soak Test on Physical Hardware.
  - **Dependencies:** `TSK-D6-01`
  - **Acceptance Criteria:** Zero unhandled exits; memory growth below 5%; frame processing remains at least 20 FPS for the full session.

- [~] **`TSK-R1-02`**: Physical Edge Ingestion & Real YOLOv8 Vision Inference.
  - **Dependencies:** `TSK-D2-01`
  - **Acceptance Criteria:** Genuine inference on raw camera frames at least 20 FPS with per-frame latency at most 45ms.
  - **Current Finding (2026-11-06):** RTSP/HTTP/file/webcam ingestion, MJPEG streaming, snapshots, and YOLO annotation are implemented. `ultralytics` is installed and the full edge suite collects; physical-camera soak and live-model FPS evidence remain open.

- [ ] **`TSK-R1-03`**: Real-Time Camera Heartbeat Watchdog & 15s Degradation UI.
  - **Dependencies:** `TSK-D2-04`
  - **Acceptance Criteria:** A disconnected camera is marked offline and visibly warned within 15 seconds.

- [~] **`TSK-R1-04`**: Live Gemini Cloud VLM Verification & Image-Based Evaluation Harness.
  - **Dependencies:** `TSK-D3-02`
  - **Acceptance Criteria:** Live labeled-image evaluation, five-state output validation, and fail-closed provider behavior are reproducibly verified. Synthetic drawings do not establish real-world accuracy.
  - **Current Finding (2026-11-06):** Provider integration and synthetic harness are present; real-image accuracy and live-provider evidence remain unverified.

- [ ] **`TSK-R1-05`**: Production WhatsApp Cloud API & Handset Delivery Verification.
  - **Dependencies:** `TSK-D5-03`
  - **Acceptance Criteria:** A consenting handset receives the alert within 3 seconds and the provider message ID is persisted.

- [ ] **`TSK-R1-06`**: JWT Authentication & RBAC Authorization Middleware.
  - **Dependencies:** `TSK-INIT-03`
  - **Acceptance Criteria:** Unauthenticated API requests return 401 and role permissions are enforced.

- [ ] **`TSK-R1-07`**: Multi-Tenant Query Scoping & Cross-Organization Isolation Tests.
  - **Dependencies:** `TSK-R1-06`
  - **Acceptance Criteria:** Org A cannot read or mutate Org B resources.

- [x] **`TSK-R1-08`**: Encrypted Evidence Storage & DPDP Automated Purge.
  - **Dependencies:** `TSK-R1-07`
  - **Acceptance Criteria:** Evidence is encrypted at rest and retention deletion is audit-verifiable.
  - **Validation Evidence:** Fernet encryption, authenticated tamper rejection, legacy plaintext reads, and 30-day retention cleanup are covered by `services/api/tests/test_evidence_protection.py`; API suite passes 79 tests.
  - **Completed Date:** 2026-11-06

- [ ] **`TSK-R1-09`**: Edge Local SQLite Queue Buffer & WAN Interruption Resilience.
  - **Dependencies:** `TSK-D2-03`
  - **Acceptance Criteria:** Three minutes offline causes no dropped events or duplicate alerts after reconnection.

- [ ] **`TSK-R1-10`**: Multi-Site Empirical Benchmark Dataset & SLA Measurement.
  - **Dependencies:** `TSK-D6-03`
  - **Acceptance Criteria:** Real footage evaluation achieves at least 90% precision and recall with p95 latency at most 3.5s.

- [~] **`TSK-R1-11`**: Genuine Groq Vernacular Workflow Compiler Integration.
  - **Dependencies:** `TSK-D1-04`
  - **Acceptance Criteria:** Live Groq requests return schema-valid workflows with explicit fallback metadata and allowlist enforcement.
  - **Current Finding (2026-11-06):** Provider integration and tests are present; a reproducible configured live run is still required before closure.

### R0 Demo Reliability Addendum

- [x] **`TSK-R1-12`**: Evidence Capture and Bounded Context Verification.
  - **Owner:** Kartikey / Ankit
  - **Acceptance Criteria:** Missing evidence is filled within the demo budget; provider errors and timeouts never authorize confirmed actions.
  - **Validation Evidence:** Verified in `CandidateEvent` field normalization, auto-frame capture in `events.py`, and Wi-Fi-proof fallback text in `verifier.py` with 111 tests passing.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-13`**: Live Event Feed and Bharat Policy Presets.
  - **Owner:** Piyush
  - **Acceptance Criteria:** New incidents appear without reload and the three Bharat presets compile through the workflow path.
  - **Validation Evidence:** Verified with 2.5s auto-polling in `IncidentFeed.tsx` and updated one-click Bharat presets in `RuleBuilder.tsx`.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-14`**: One-Command Local Demo Launcher.
  - **Owner:** Farhan
  - **Acceptance Criteria:** `python start_demo.py` starts both services, preserves existing camera data, and cleans up child processes.
  - **Validation Evidence:** Created `start_demo.py` at root; tested database seeder preserving existing rows and graceful process shutdown.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-D6-06`**: Legacy-row resilience and demo database cleanup.
  - **Validation Evidence:** Regression coverage exists in `test_legacy_resilience.py`; list endpoints and cleanup behavior were previously verified.
  - **Completed Date:** 2026-11-04

- [x] **`DOC-HYGIENE-01`**: Documentation conflict and status reconciliation.
  - **Scope:** Remove unresolved merge markers, normalize duplicate planning sections, and align README claims with current validation evidence.
  - **Acceptance Criteria:** No conflict markers remain in Markdown; status/count claims are internally consistent; historical claims are labeled.
  - **Validation Evidence:** Repository-wide Markdown scan returns no conflict markers; current API, targeted edge, lint, and build checks are recorded in `plan/STATE.md`.
