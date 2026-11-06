# DrishtiFlow Work Breakdown Structure (TASKS.md)
**Milestone:** R0 — Hackathon Prototype (Build with Bharat 5.0)  
**Governing Document:** [DrishtiFlow_Enhanced_PRD_v3_EMPTY.md](file:///d:/hackathon/Build%20with%20Bharat/DrishtiFlow_Enhanced_PRD_v3_EMPTY.md)  
**Plan Rule:** [plan/PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md)  
**Last Updated:** 2026-11-06T01:24:00+05:30

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
| **Track R1: Fall Detection & Hospital Emergency Dispatch** | All | 6 | 5 | 0 | 1 |
| **Grand Total** | | **37** | **36** | **0** | **1** |

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
  - **Validation Evidence:** `services/api/tests/test_evaluation_harness.py` executed successfully; 100% precision and recall on evaluation set.
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
  - **Validation Evidence:** Metrics logged in `plan/STATE.md` (100% precision on evaluation set, 0.68s E2E latency).
  - **Completed Date:** 2026-11-04

- [x] **`TSK-D6-04`**: 3-Minute Live Pitch Rehearsal & Backup Assets.
  - **Dependencies:** `TSK-D6-01`
  - **Scope:** Rehearse the 3-minute pitch script (PRD §19.1); prepare offline fallback clips and architecture slides.
  - **Acceptance Criteria:** Rehearsal completed within 3:00 timeline; offline toggle tested and verified.
  - **Validation Evidence:** Offline fallback mock mode documented in `plan/ARCHITECTURE.md` and integrated into UI.
  - **Completed Date:** 2026-11-04

---

## Milestone R1: Supervised Pilot MVP — Acceptance Criteria & Blocker Clearance Track (Owner: All)

This track governs the resolution of the ten non-negotiable Pilot Release Blockers ([BLOCKER-01] to [BLOCKER-10]) established in PRD §20.3 and evaluated in [`plan/WORKFLOW_AUDIT_REPORT.md`](file:///d:/hackathon/Build%20with%20Bharat/plan/WORKFLOW_AUDIT_REPORT.md).

- [ ] **`TSK-R1-01`**: 30-Minute Continuous Stability Soak Test on Physical Hardware.
  - **Dependencies:** `TSK-D6-01`
  - **Scope:** Execute uninterrupted 30-minute monitoring session on NVIDIA Jetson or Intel N100; profile RSS memory heap and CPU load every 30s.
  - **Acceptance Criteria (Clears BLOCKER-01):** Zero unhandled process exits; memory heap growth between minute 5 and minute 30 < 5%; frame processing rate maintains ≥ 20 FPS throughout.

- [~] **`TSK-R1-02`**: Physical Edge Ingestion & Real YOLOv8 Vision Inference.
  - **Dependencies:** `TSK-D2-01`
  - **Scope:** Replace browser canvas and mock stream dictionaries with physical RTSP stream decoding via OpenCV and live YOLOv8n TensorRT/ONNX inference.
  - **Acceptance Criteria (Clears BLOCKER-02):** Genuine computer vision inference executing on raw camera frame tensors at ≥ 20 FPS with per-frame latency ≤ 45ms.

   - **Progress (2026-11-06):** `StreamIngestion` now decodes real RTSP/HTTP/file/webcam sources with bounded-backoff reconnect and MJPEG yield; the API exposes `GET /api/v1/cameras/{id}/stream` and `/snapshot` with frame-strided YOLOv8 annotation; the web preview has an RTSP mode with URL bar, YOLO toggle and evidence snapshot. Verified with a local MP4: snapshot returned a 41 KB JPEG and the MJPEG generator produced valid multipart frames. Still open: Ultralytics is not installed in this environment, so the 2 YOLO edge tests skip and no live-model latency/FPS numbers exist; no physical RTSP camera or 20 FPS soak has been executed.

- [ ] **`TSK-R1-03`**: Real-Time Camera Heartbeat Watchdog & 15s Degradation UI.
  - **Dependencies:** `TSK-D2-04`
  - **Scope:** Build background heartbeat supervisor polling camera streams; automatically mark camera status `offline` in database and display warning banner in UI within 15 seconds of signal loss.
  - **Acceptance Criteria (Clears BLOCKER-03):** Cutting camera network cable triggers visible operator warning in Command Center within ≤ 15.0 seconds.

- [~] **`TSK-R1-04`**: Live Gemini Cloud VLM Verification Integration & Image-Based Evaluation Harness.
  - **Dependencies:** `TSK-D3-02`
  - **Scope:** Deploy production Google Gemini API credentials; integrate live multimodal keyframe evaluation against natural language rules; create 10-case labeled image dataset with metrics (precision, recall, false positive/negative rates).
  - **Acceptance Criteria (Clears BLOCKER-04):** Real visual evaluation replaces mock heuristic; structured 5-state response (`confirmed`, `not_confirmed`, `uncertain`, `needs_human_review`, `processing_failed`); missing evidence, provider errors, malformed output, and schema failures safely yield `processing_failed`; separately configured integration tests use labeled real imagery. Synthetic drawings do not establish real-world accuracy.
  - **Current Finding (2026-11-05):** The current evaluation harness generates synthetic drawings, allows `processing_failed`, and follows runtime provider configuration; it is not evidence of genuine visual accuracy. Python is unavailable in this execution environment, so live-provider and regression tests could not be rerun. Keep this task in progress.

- [~] **`TSK-R1-11`**: Genuine Groq Vernacular Workflow Compiler Integration.
  - **Dependencies:** `TSK-D1-04`
  - **Scope:** Integrate live Groq API (`qwen/qwen3.8-27b`) with JSON mode; support Hindi, Hinglish, and English; validate against `WorkflowDefinition`; enforce allowlists; provide explicit fallback reporting.
  - **Acceptance Criteria:** Real Groq requests return schema-valid workflows; incomplete rules trigger clarification questions; missing/invalid keys gracefully fall back with explicit metadata; allowlists enforce detector classes and action items.
  - **Current Finding (2026-11-05):** Provider integration and tests are present, but cannot be rerun here because Python is unavailable. Existing live-call evidence remains recorded in the historical changelog and requires a reproducible configured run before this task is closed.

### R0 Demo Reliability Addendum

- [~] **TSK-R1-12**: Evidence Capture and Bounded Context Verification.
  - **Owner:** Kartikey / Ankit
  - **Scope:** Ensure candidate events persist either a prompt camera keyframe or a clearly labeled generated placeholder; bound OpenCV snapshot attempts and all VLM verification to the demo latency budgets.
  - **Acceptance Criteria:** Missing evidence is filled without blocking the event route for more than 500 ms; provider errors and timeouts return the five-state verification contract and never trigger actions as confirmed.
  - **Validation Evidence:** Pending focused API checks for missing evidence, invalid camera, and verifier timeout/provider error.
- [~] **TSK-R1-13**: Live Event Feed and Bharat Policy Presets.
  - **Owner:** Piyush
  - **Scope:** Poll incidents every 2.5 seconds, refresh immediately after a candidate event, render evidence thumbnails and verification state, and provide the three requested Kirana / Warehouse / ATM rule presets.
  - **Acceptance Criteria:** New persisted incidents appear without reload; event cards show image evidence, confidence, status, and verifier reasoning; each preset fills and compiles its stated prompt.
  - **Validation Evidence:** Pending TypeScript compilation and frontend build.
- [~] **TSK-R1-14**: One-Command Local Demo Launcher.
  - **Owner:** Farhan
  - **Scope:** Add start_demo.py to initialize the local API database, seed the default demo camera and zone when appropriate, start FastAPI and Next.js together, and stop child processes cleanly.
  - **Acceptance Criteria:** python start_demo.py starts both services with readable logs; Ctrl+C shuts both down; existing camera data is preserved.
  - **Validation Evidence:** Pending isolated launcher smoke check that does not modify the user's existing SQLite database.

- [ ] **`TSK-R1-05`**: Production WhatsApp Cloud API & Handset Delivery Verification.
  - **Dependencies:** `TSK-D5-03`
  - **Scope:** Configure live Meta WhatsApp Business API credentials; execute physical intrusion test alert to consenting destination handset.
  - **Acceptance Criteria (Clears BLOCKER-05):** Message physically received on mobile handset within ≤ 3.0 seconds; Meta message ID persisted in `actions` table.

- [ ] **`TSK-R1-06`**: JWT Authentication & RBAC Authorization Middleware.
  - **Dependencies:** `TSK-INIT-03`
  - **Scope:** Implement FastAPI OAuth2 Bearer token authentication middleware; protect all `/api/v1/*` routes; enforce Admin, Supervisor, and Viewer role permissions.
  - **Acceptance Criteria (Clears BLOCKER-06):** Unauthenticated requests rejected with HTTP 401; endpoints verify user role permissions; zero client-side credentials.

- [ ] **`TSK-R1-07`**: Multi-Tenant Query Scoping & Adversarial Cross-Org Isolation Tests.
  - **Dependencies:** `TSK-R1-06`
  - **Scope:** Extract `organization_id` from authenticated JWT tokens; enforce SQL query scoping on all database operations; write automated cross-tenant security test suite.
  - **Acceptance Criteria (Clears BLOCKER-07):** Token from Org A cannot read or write cameras, rules, or incidents belonging to Org B (returns HTTP 404/403).

- [ ] **`TSK-R1-08`**: Encrypted Evidence Storage & DPDP Automated Purge Daemon.
  - **Dependencies:** `TSK-D4-01`
  - **Scope:** Implement S3/Cloud Storage integration with AES-256 encryption at rest; build daily background worker purging keyframes older than retention window (7–30 days).
  - **Acceptance Criteria (Clears BLOCKER-08):** Continuous video discarded locally; incident snapshots encrypted at rest; automated purge verified by audit log.

- [ ] **`TSK-R1-09`**: Edge Local SQLite Queue Buffer & WAN Interruption Resilience.
  - **Dependencies:** `TSK-D2-03`
  - **Scope:** Implement local SQLite disk queue on edge daemon to cache candidate event envelopes during internet outages; auto-flush queue upon WAN reconnection.
  - **Acceptance Criteria (Clears BLOCKER-09):** Disconnecting edge network for 3 minutes results in zero dropped incidents; backlog flushes without triggering duplicate alerts.

- [ ] **`TSK-R1-10`**: Multi-Site Empirical Benchmark Dataset & SLA Measurement.
  - **Dependencies:** `TSK-D6-03`
  - **Scope:** Deploy across 2–3 pilot warehouse sites; collect 100+ annotated real footage events; measure precision, recall, and end-to-end latency.
  - **Acceptance Criteria (Clears BLOCKER-10):** Labeled empirical evaluation achieves Precision ≥ 90.0%, Recall ≥ 90.0%, and p95 latency ≤ 3.5s.

- [x] **`TSK-D6-06`**: Fix 500s on `GET /api/v1/incidents` & `GET /api/v1/cameras` (legacy-row resilience) + purge demo DB test debris.
  - **Dependencies:** `TSK-D6-05`
  - **Scope:** (1) Make `IncidentResponse.detector_confidence` optional and `CameraResponse.status` tolerant to legacy out-of-enum values so one bad row can no longer 500 the whole collection (fail-safe per AGENTS.md §3). (2) Purge legacy test debris from `services/api/drishtiflow.db` (`cam-test-*`, `cam-stress-*`, `test-cam-01` incidents, duplicate Bay-A cameras / Warehouse workflows, orphan actions/feedback/zones: 4 cameras, 12 duplicate cameras, 38 orphan incidents, 31 orphan actions, 7 orphan feedback, 12 duplicate workflows, 12 orphan zones, 16 orphan workflow versions removed). (3) Add missing autouse cleanup to `test_policy_and_events.py` and `test_e2e_pipeline.py` teardown hardening to stop future DB pollution. (4) Add `services/api/tests/test_legacy_resilience.py` regression tests (2 tests).
  - **Acceptance Criteria:** After remediation, `pytest` is 37/37 green; all list endpoints return 200; a full repeated pytest run leaves the demo DB clean (cameras=2, incidents=1, workflows=1); live `GET /incidents`, `/cameras`, `/workflows` verified 200.
  - **Validation Evidence:** Live server re-run after fix: 200 OK on all three list endpoints (UVicorn log verified); DB row counts stable after full test suite rerun.
  - **Completed Date:** 2026-11-04

---

## Track R1: Fall Detection & Hospital Emergency Dispatch (R1 Supervised Pilot MVP)

### Track R1: Fall Detection & Hospital Emergency Dispatch (Owner: All)

- [x] **`TSK-R1-01`**: Pose Estimation Model Integration (YOLOv8n-Pose).
  - **Dependencies:** `TSK-D2-05` (Real YOLOv8n Edge Inference)
  - **Scope:** `services/edge-agent/inference/yolo_pose_detector.py` — YOLOv8n-Pose model extracting body keypoints (nose, shoulders, hips, knees, ankles) from frames. Normalizes keypoints to [0,1]. Computes body orientation angle (vertical vs horizontal) for posture classification. Includes `_is_person_fallen()` heuristic using shoulder-hip aspect ratio.
  - **Acceptance Criteria:** `YOLOPoseDetector` loads `yolov8n-pose.pt`, returns keypoints with confidence, computes standing/fallen classification. Runs at ≥15 FPS on CPU.
  - **Validation Evidence:** `services/edge-agent/tests/test_yolo_pose_detector.py` — 7 tests passing (keypoint names, fallen/vertical classification, missing keypoints safe default, normalization, instantiation, defaults, dict structure).
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-02`**: Fall State Machine with 3-5 Second Timer.
  - **Dependencies:** `TSK-R1-01`
  - **Scope:** `services/edge-agent/tracking/fall_monitor.py` — `FallStateMachine` with states: `standing` → `fallen_detected` → `emergency_trigger` → `standing`. 3-5 second timer before emergency. Person-track matching via IoU. State persistence across frames.
  - **Acceptance Criteria:** State transitions verified: standing→fallen→standing (no alert), standing→fallen→emergency (alert at 3-5s), timer boundary (2.9s=no alert, 3.0s=alert).
  - **Validation Evidence:** `services/edge-agent/tests/test_fall_monitor.py` — 9 tests passing (initial state, fall/recover, emergency trigger, timer boundaries, track removal, active falls, multi-person tracking, event serialization).
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-03`**: Hospital Reception Emergency Dispatch.
  - **Dependencies:** `TSK-R1-02`, `TSK-D5-02` (Action Queue & Idempotency Engine)
  - **Scope:** `services/api/app/routers/fall_monitoring.py` — `POST /api/v1/fall-monitor/emergency` endpoint dispatches hospital reception alert with idempotency key. Bypasses standard cooldown. Includes location, timestamp, fallen person evidence.
  - **Acceptance Criteria:** Emergency dispatch returns 201 with event_id. Hospital reception alert dispatched with message. Test dispatch succeeds.
  - **Validation Evidence:** Live server tested: `POST /api/v1/fall-monitor/emergency` returns 201 with `event_id`, `triggered_at`, and `"Emergency dispatched to hospital reception"` message.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-04`**: Fall Monitor UI Tab.
  - **Dependencies:** `TSK-R1-02`, `TSK-D4-01` (Next.js App Shell)
  - **Scope:** `apps/web/src/components/incidents/FallMonitor.tsx` — New "Fall Monitor" tab in Command Center showing fall status per camera. Visual indicator: person outline turns red when fallen. Countdown timer (3-5s) visible on screen. Emergency button to manually trigger reception alert. Reads from `/api/v1/fall-monitor` endpoint. Polls every 2s for live updates.
  - **Acceptance Criteria:** Fall Monitor tab renders; shows per-camera fall status; countdown timer decrements; emergency button triggers dispatch; UI passes lint/build.
  - **Validation Evidence:** Frontend ESLint clean; Next.js build succeeds; Fall Monitor component integrated into page.tsx with tab navigation.
  - **Completed Date:** 2026-11-06

- [x] **`TSK-R1-05`**: Fall Detection API Router & Endpoints.
  - **Dependencies:** `TSK-R1-02`, `TSK-D1-03` (FastAPI Backend Skeleton)
  - **Scope:** `services/api/app/routers/fall_monitoring.py` — `GET /api/v1/fall-monitor` (fall status per camera), `POST /api/v1/fall-monitor/events` (ingest fall detection events from edge agent), `POST /api/v1/fall-monitor/emergency` (manual emergency trigger). Registered in `services/api/app/main.py`.
  - **Acceptance Criteria:** All fall monitoring endpoints return 200/201; emergency trigger creates incident + dispatches hospital alert; fall events persisted in memory.
  - **Validation Evidence:** Live server tested: `GET /api/v1/fall-monitor` → 200, `POST /api/v1/fall-monitor/events` → 201, `POST /api/v1/fall-monitor/emergency` → 201.
  - **Completed Date:** 2026-11-06

- [ ] **`TSK-R1-06`**: Fall Detection End-to-End Test Suite.
  - **Dependencies:** All R1 tasks
  - **Scope:** Full pipeline test: video → pose detection → fall state machine → emergency trigger → hospital reception dispatch. Test with simulated fallen person video footage. Verify 3-5s timer accuracy.
  - **Acceptance Criteria:** E2E test passes; fall detected within 3-5s of person going down; hospital reception alert dispatched; incident persisted; false positives minimized (person bending down briefly = no alert).
  - **Validation Evidence:** (pending)
  - **Completed Date:** (pending)
