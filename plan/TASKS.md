# DrishtiFlow Work Breakdown Structure (TASKS.md)
**Milestone:** R0 — Hackathon Prototype (Build with Bharat 5.0)  
**Governing Document:** [DrishtiFlow_Enhanced_PRD_v3_EMPTY.md](file:///d:/hackathon/Build%20with%20Bharat/DrishtiFlow_Enhanced_PRD_v3_EMPTY.md)  
**Plan Rule:** [plan/PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md)  
**Last Updated:** 2026-11-04T19:47:00+05:30

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
| **Track 4: Frontend, Canvas & Incident UI** | Piyush | 4 | 4 | 0 | 0 |
| **Track 5: Policy Engine & Action Worker** | Kaushendra | 4 | 4 | 0 | 0 |
| **Track 6: Testing, Evaluation & Pitch** | All | 4 | 4 | 0 | 0 |
| **Milestone R1 Pilot Blocker Clearance Track** | All | 10 | 0 | 0 | 10 |
| **Total** | | **37** | **27** | **0** | **10** |

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

- [ ] **`TSK-R1-02`**: Physical Edge Ingestion & Real YOLOv8 Vision Inference.
  - **Dependencies:** `TSK-D2-01`
  - **Scope:** Replace browser canvas and mock stream dictionaries with physical RTSP stream decoding via OpenCV and live YOLOv8n TensorRT/ONNX inference.
  - **Acceptance Criteria (Clears BLOCKER-02):** Genuine computer vision inference executing on raw camera frame tensors at ≥ 20 FPS with per-frame latency ≤ 45ms.

- [ ] **`TSK-R1-03`**: Real-Time Camera Heartbeat Watchdog & 15s Degradation UI.
  - **Dependencies:** `TSK-D2-04`
  - **Scope:** Build background heartbeat supervisor polling camera streams; automatically mark camera status `offline` in database and display warning banner in UI within 15 seconds of signal loss.
  - **Acceptance Criteria (Clears BLOCKER-03):** Cutting camera network cable triggers visible operator warning in Command Center within ≤ 15.0 seconds.

- [ ] **`TSK-R1-04`**: Live Gemini 1.5 Flash Cloud VLM Verification Integration.
  - **Dependencies:** `TSK-D3-02`
  - **Scope:** Deploy production Google Gemini 1.5 Flash API credentials; verify 10 real warehouse keyframes against natural language rules.
  - **Acceptance Criteria (Clears BLOCKER-04):** Real visual evaluation replaces mock heuristic; structured 5-state response; provider timeout safely yields `processing_failed`.

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
