# DrishtiFlow Work Breakdown Structure (TASKS.md)
**Milestone:** R0 — Hackathon Prototype (Build with Bharat 5.0)  
**Governing Document:** [DrishtiFlow_Enhanced_PRD_v3_EMPTY.md](file:///d:/hackathon/Build%20with%20Bharat/DrishtiFlow_Enhanced_PRD_v3_EMPTY.md)  
**Plan Rule:** [plan/PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md)  
**Last Updated:** 2026-11-04T18:58:00+05:30

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
| **Track 1: Monorepo & Shared Schemas** | Farhan | 4 | 0 | 0 | 4 |
| **Track 2: Camera Ingestion & Edge Vision** | Kartikey | 4 | 0 | 0 | 4 |
| **Track 3: Context Verification Engine** | Ankit | 4 | 0 | 0 | 4 |
| **Track 4: Frontend, Canvas & Incident UI** | Piyush | 4 | 0 | 0 | 4 |
| **Track 5: Policy Engine & Action Worker** | Kaushendra | 4 | 0 | 0 | 4 |
| **Track 6: Testing, Evaluation & Pitch** | All | 4 | 0 | 0 | 4 |
| **Total** | | **27** | **3** | **0** | **24** |

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

- [ ] **`TSK-D1-01`**: Monorepo directory scaffolding.
  - **Dependencies:** `TSK-INIT-02`
  - **Scope:** Create `apps/web`, `services/api`, `services/edge-agent`, `packages/workflow-schema`, `packages/shared-types`.
  - **Acceptance Criteria:** Directory structure matches PRD §15.2 blueprint; workspace package configuration configured.

- [ ] **`TSK-D1-02`**: Shared Workflow Schema Specification.
  - **Dependencies:** `TSK-D1-01`
  - **Scope:** Define Pydantic and TypeScript Zod models for `WorkflowDefinition`, `TriggerConfig`, `VerificationConfig`, `ActionConfig`.
  - **Acceptance Criteria:** Schema validates PRD §6.1 sample workflow JSON cleanly with zero errors.

- [ ] **`TSK-D1-03`**: FastAPI Backend Application Skeleton.
  - **Dependencies:** `TSK-D1-01`, `TSK-D1-02`
  - **Scope:** Set up FastAPI app in `services/api/app/main.py` with CORS, structured logging, and health routes.
  - **Acceptance Criteria:** `/api/v1/health` and `/api/v1/ready` respond with HTTP 200 and JSON payload.

- [ ] **`TSK-D1-04`**: Vernacular Workflow Compiler Engine.
  - **Dependencies:** `TSK-D1-02`, `TSK-D1-03`
  - **Scope:** Implement `/api/v1/workflows/compile` utilizing LLM with strict system prompt from PRD §6.1.
  - **Acceptance Criteria:** Successfully converts Hindi ("Raat 10 baje ke baad godown mein koi aaye toh alert karo") into valid `needs_review` workflow JSON.

---

### Track 2: Camera Ingestion & Edge Vision Engine (Owner: Kartikey)

- [ ] **`TSK-D2-01`**: Browser Webcam Stream Ingestion.
  - **Dependencies:** `TSK-D1-01`
  - **Scope:** Implement camera capture component using `getUserMedia` with device selection and frame dimension validation.
  - **Acceptance Criteria:** Live video feeds render smoothly in browser preview with FPS counter.

- [ ] **`TSK-D2-02`**: Pre-recorded Sample Clip Simulation Player.
  - **Dependencies:** `TSK-D1-01`
  - **Scope:** Add switchable sample clip player (warehouse intrusion footage) for reproducible demo testing without physical cameras.
  - **Acceptance Criteria:** UI can toggle between live webcam and warehouse sample clip seamlessly.

- [ ] **`TSK-D2-03`**: Interactive Polygon Zone Canvas Overlay.
  - **Dependencies:** `TSK-D2-01`
  - **Scope:** Create HTML5 Canvas overlay enabling users to click and draw restricted zones with normalized coordinates `[0.0, 1.0]`.
  - **Acceptance Criteria:** Polygon vertices saved to zone state and rendered over video feed with visual styling.

- [ ] **`TSK-D2-04`**: ONNX Runtime Web Person Detector & Zone Trigger.
  - **Dependencies:** `TSK-D2-01`, `TSK-D2-03`
  - **Scope:** Integrate YOLOv8n ONNX model with WebGPU/WASM execution; run ray-casting point-in-polygon test; emit candidate event on 1.5s presence.
  - **Acceptance Criteria:** Walking into the drawn polygon triggers a candidate event payload with bounding box and timestamp.

---

### Track 3: Context Verification & VLM Evaluation (Owner: Ankit)

- [ ] **`TSK-D3-01`**: Context Verification Schema & Decision Model.
  - **Dependencies:** `TSK-D1-02`
  - **Scope:** Implement Pydantic schema for verification results (`confirmed`, `not_confirmed`, `uncertain`, `needs_human_review`, `processing_failed`).
  - **Acceptance Criteria:** Schema rejects uncalibrated boolean outputs and enforces structured reason explanation.

- [ ] **`TSK-D3-02`**: Cloud VLM Adapter (Gemini / Groq Vision).
  - **Dependencies:** `TSK-D3-01`, `TSK-D1-03`
  - **Scope:** Build service calling vision LLM with candidate snapshot keyframe and constrained verification prompt.
  - **Acceptance Criteria:** Returns schema-compliant decision payload within 3.5 seconds p95 latency.

- [ ] **`TSK-D3-03`**: Deterministic Mock Verifier Fallback.
  - **Dependencies:** `TSK-D3-01`
  - **Scope:** Implement local mock verifier returning pre-determined decisions for sample clips when offline or when cloud API times out.
  - **Acceptance Criteria:** Mock mode can be activated via configuration switch for offline hackathon presentations.

- [ ] **`TSK-D3-04`**: Evaluation Test Harness & Dataset.
  - **Dependencies:** `TSK-D3-02`, `TSK-D3-03`
  - **Scope:** Create script to benchmark verifier against 10 sample test images (5 intrusions, 5 hard negatives like dogs/shadows).
  - **Acceptance Criteria:** Generates precision/recall report and logs per-sample reasoning.

---

### Track 4: Frontend Application, Canvas & Incident UI (Owner: Piyush)

- [ ] **`TSK-D4-01`**: Next.js 14 App Shell & Navigation.
  - **Dependencies:** `TSK-D1-01`
  - **Scope:** Set up Next.js app with Tailwind CSS, Lucide icons, dark/light theme, and main layout (Command Center, Camera Setup, Rule Builder, Incident Feed).
  - **Acceptance Criteria:** Responsive layout with Hindi/English bilingual header and navigation tabs.

- [ ] **`TSK-D4-02`**: Vernacular Rule Creation UI.
  - **Dependencies:** `TSK-D4-01`, `TSK-D1-04`
  - **Scope:** Build voice/text prompt input with audio recording visualizer, preset selector (Mandi, MSME, Hospital), and compile trigger.
  - **Acceptance Criteria:** Submitting Hindi prompt displays compile loading state and renders proposed rule configuration.

- [ ] **`TSK-D4-03`**: React Flow Workflow Graph & Node Config.
  - **Dependencies:** `TSK-D4-02`
  - **Scope:** Implement interactive visual node canvas: Trigger Node → Verify Node → Action Node with editable side drawer forms.
  - **Acceptance Criteria:** Graph renders nodes cleanly; editing parameters in side drawer updates node data and passes validation.

- [ ] **`TSK-D4-04`**: Realtime Incident Feed & Feedback Card.
  - **Dependencies:** `TSK-D4-01`
  - **Scope:** Build live Incident Center showing event cards with keyframe snapshots, detector/verifier confidence, reason, and feedback buttons.
  - **Acceptance Criteria:** New incidents appear in feed dynamically; clicking "True Positive" or "False Positive" submits feedback.

---

### Track 5: Policy Engine & Action Worker (Owner: Kaushendra)

- [ ] **`TSK-D5-01`**: Deterministic Policy Engine.
  - **Dependencies:** `TSK-D1-03`
  - **Scope:** Implement rule evaluator enforcing cooldowns (default 60s), rate limits (5/hour), schedule checks, and active flags.
  - **Acceptance Criteria:** Suppresses duplicate candidate events arriving within the cooldown window; logs suppression reason.

- [ ] **`TSK-D5-02`**: Action Queue & Idempotency Engine.
  - **Dependencies:** `TSK-D5-01`
  - **Scope:** Build in-memory / database action dispatcher with unique idempotency key generation and retry counter.
  - **Acceptance Criteria:** Re-submitting the same incident action never triggers duplicate sends.

- [ ] **`TSK-D5-03`**: WhatsApp Cloud API Notification Adapter.
  - **Dependencies:** `TSK-D5-02`
  - **Scope:** Build adapter to format and dispatch WhatsApp alerts with snapshot link and incident details to verified recipient.
  - **Acceptance Criteria:** Sends structured message in live mode; logs payload in sandbox mode without crashing.

- [ ] **`TSK-D5-04`**: Vapi Voice Alert Adapter & Dashboard Audio Alert.
  - **Dependencies:** `TSK-D5-02`
  - **Scope:** Implement outbound voice call trigger via Vapi API and browser audio alarm sound player for dashboard.
  - **Acceptance Criteria:** Triggers voice call payload to pre-configured test number; dashboard plays audio alert on high-severity incident.

---

### Track 6: Testing, Evaluation & Pitch Preparation (Owner: All)

- [ ] **`TSK-D6-01`**: End-to-End Integration Test Suite.
  - **Dependencies:** All tracks
  - **Scope:** Test full pipeline: Hindi prompt → workflow compile → zone detection → VLM verify → policy check → action dispatch.
  - **Acceptance Criteria:** Automated test script executes the entire pipeline in under 5 seconds with all assertions passing.

- [ ] **`TSK-D6-02`**: Chaos & Degradation Scenarios.
  - **Dependencies:** `TSK-D6-01`
  - **Scope:** Test edge disconnect, VLM timeout, and invalid action response.
  - **Acceptance Criteria:** System marks camera offline and incident `uncertain` without uncaught exceptions or UI freezing.

- [ ] **`TSK-D6-03`**: Benchmark & Metrics Validation Report.
  - **Dependencies:** `TSK-D6-01`
  - **Scope:** Measure and document inference FPS, VLM verification latency, false alert suppression rate, and action dispatch time.
  - **Acceptance Criteria:** Results documented in `plan/STATE.md` with honest, evidence-backed numbers.

- [ ] **`TSK-D6-04`**: 3-Minute Live Pitch Rehearsal & Backup Assets.
  - **Dependencies:** `TSK-D6-01`
  - **Scope:** Rehearse the 3-minute pitch script (PRD §19.1); prepare offline fallback clips and architecture slides.
  - **Acceptance Criteria:** Rehearsal completed within 3:00 timeline; offline toggle tested and verified.
