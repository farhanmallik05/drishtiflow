# DrishtiFlow Specification Mining & PRD-Plan Gap Analysis Report

**Document Version:** 1.0  
**Date:** 2026-11-04  
**Author:** Specification Miner Agent (`spec_miner_prd`)  
**Authoritative Specification Source:** `DrishtiFlow_Enhanced_PRD_v3_EMPTY.md` (PRD v3.0)  
**Plan Artifacts Examined:** `plan/STATE.md`, `plan/TASKS.md`, `plan/ROADMAP.md`, `plan/ARCHITECTURE.md`, `plan/STANDARDS.md`, `plan/PLAN_RULE.md`, `plan/CHANGELOG.md`  
**Target Milestone:** Milestone R0 — Hackathon Prototype (Build with Bharat 5.0)

---

## 1. Executive Summary

A comprehensive specification mining investigation was conducted across the authoritative PRD (`DrishtiFlow_Enhanced_PRD_v3_EMPTY.md`), the project planning system (`plan/`), and the actual implementation codebase (`apps/web`, `services/api`, `services/edge-agent`, `packages/`).

The primary objective was to:
1. Enumerate all required features, interfaces, non-functional requirements, and acceptance criteria for **Milestone R0 (Hackathon Prototype)**.
2. Probe runnable test suites and database interactions to discover actual vs documented behaviors.
3. Cross-examine PRD specifications against `plan/TASKS.md` and `plan/STATE.md` to identify gaps, missing endpoints, edge cases, and unfulfilled commitments.

### Key Finding: E2E Pipeline Failure Despite Green State Claim
While `plan/STATE.md` declares:
> *"Overall System Health: 🟢 GREEN (All 27 tasks complete, 12/12 tests passing, Next.js 14 build verified)"*

Direct execution of the test suite via `pytest services/api/tests/ services/edge-agent/tests/ -v` revealed that **`test_full_drishtiflow_e2e_pipeline` FAILS** (`assert False is True` at line 88 where `candidate_data["policy_allowed"]` is expected to be `True`). The root cause is an ASCII timestamp comparison bug in `services/api/app/services/policy.py:92` when executing SQLite `datetime('now', '-1 hour')` against ISO-8601 strings, which causes all past actions to permanently count against the hourly rate limit of 5 actions/hour once 5 runs occur.

---

## 2. Features Discovered

The table below catalogs all features required by PRD v3.0 and discovered across the architecture, plan, and codebase.

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Vernacular Compiler | Hindi / Hinglish Rule Compilation | Compiles conversational Hindi and Hinglish prompts (e.g., *"Raat 10 baje ke baad godown mein koi aaye toh alert karo"*) into structured workflow JSON. | Prompt string, optional camera_id, optional zone_id | `WorkflowDefinition` JSON object with status `needs_review` | Degrades to rule-based fallback regex parser if LLM provider fails | PRD §6.1, `services/api/app/services/compiler.py` |
| 2 | Vernacular Compiler | English Rule Compilation | Compiles English operational prompts into structured workflow proposals. | Prompt string | `WorkflowDefinition` JSON object | Returns `needs_review` with clarification questions if ambiguous | PRD §6.1, `services/api/tests/test_compiler.py` |
| 3 | Vernacular Compiler | Allowlist Class & Action Enforcement | Enforces strictly allowlisted detector classes (`person`, `vehicle`, `animal`) and action types (`dashboard_alert`, `whatsapp_message`, `voice_call`, `local_siren`). | Workflow JSON payload | Validated Pydantic/Zod model | Schema validation error (`422 Unprocessable Entity`) | PRD §6.1 FR-C-05, `packages/workflow-schema` |
| 4 | Vernacular Compiler | Ambiguity & Clarification Questions | Detects omitted parameters (missing zone boundary, unstated schedule) and surfaces human-readable questions. | User prompt | Array of clarification question strings in `WorkflowDefinition` | Sets status to `needs_review` | PRD §6.1 FR-C-06, `compiler.py` |
| 5 | Vernacular Compiler | Anti-Hallucination Guard | Restricts compiler from inventing camera IDs, phone numbers, coordinates, or activating workflows automatically. | LLM prompt | Workflow JSON with `null` IDs and `needs_review` | Invalid entities rejected by schema | PRD §6.1 FR-C-08, system prompt |
| 6 | Camera Ingestion | Browser Webcam Preview | Captures live local video feed via `navigator.mediaDevices.getUserMedia` for controlled prototype demonstrations. | MediaStream constraints (640x360) | Live video element render + FPS telemetry | Displays error and falls back to warehouse sample simulation | PRD §6.3, `CameraPreview.tsx` |
| 7 | Camera Ingestion | Pre-recorded Sample Clip Simulation | Interactive high-fidelity warehouse bay simulation scene with moving person silhouette and rack overlay for repeatable demos. | Simulation toggle | Synthetic 24 FPS animated warehouse video canvas | Logs warning if canvas context fails | PRD §4.2, §6.3, `CameraPreview.tsx` |
| 8 | Camera Ingestion | Stream Health Telemetry | Real-time calculation and display of frame ingestion rate (FPS), stream resolution, and connection status. | Decoded video frames | Telemetry HUD badge (e.g., "24 FPS • 640x360 • Live") | Status badge switches to "Offline" or "Degraded" | PRD §6.3 FR-V-01, `CameraPreview.tsx` |
| 9 | Camera Ingestion | Camera Registration API | REST endpoint `/api/v1/cameras` to register cameras with source types (`webcam`, `webrtc_gateway`, `local_agent`, `sample`). | `CameraCreate` JSON | `CameraResponse` with UUID and initial online/pending status | HTTP 500 if default site not found | PRD §9, `services/api/app/routers/cameras.py` |
| 10 | Camera Ingestion | Camera Connectivity Test API | Endpoint `/api/v1/cameras/{id}/test` to ping stream and update heartbeat timestamp. | camera_id | JSON with `status: online` and `tested_at` | HTTP 404 if camera not found | PRD §9, `routers/cameras.py:115` |
| 11 | Edge Vision | Interactive Polygon Zone Overlay | HTML5 canvas overlay allowing operators to draw restricted boundary polygons with normalized coordinates `[0.0, 1.0]`. | Click points on canvas | Polygon vertex list `[{x, y}, ...]` | Prevents saving if fewer than 3 vertices | PRD §5.1, §6.3, `ZoneCanvas.tsx` |
| 12 | Edge Vision | Ray-Casting Point-in-Polygon (PIP) | Evaluates bottom-center point of detected bounding box `(x_center, y_bottom)` against arbitrary polygon vertices. | Feet coordinate `(x, y)` and polygon vertex list | Boolean (`inside` / `outside`) | Returns `False` if polygon has < 3 points | PRD §6.4, `services/edge-agent/inference/detector.py` |
| 13 | Edge Vision | 1.5s Dwell Persistence Tracker | Debounces boundary flickering by requiring continuous presence in restricted zone for ≥ 1.5 seconds (4 consecutive frames) before emitting candidate event. | Detection sequence across frames | Trigger latch | Resets counter to 0 immediately upon exit | PRD §6.4, `CameraPreview.tsx`, `tracker.py` |
| 14 | Edge Vision | Signed Candidate Event Envelope | Formats candidate event containing `event_id`, `camera_id`, `occurred_at`, `detector` metadata, and bounding box. | Detection state | POST `/api/v1/events/candidates` payload | Raises RuntimeError on HTTP error | PRD §7.3, `emitter.py` |
| 15 | Context Verification | 5-State Verification Decision Model | Enforces strict five-state classification: `confirmed`, `not_confirmed`, `uncertain`, `needs_human_review`, `processing_failed`. | Keyframe snapshot + verification instruction | `VerificationResult` JSON | Fails gracefully to `uncertain` or `processing_failed`; never silent safe | PRD §6.5, `schemas/verification.py` |
| 16 | Context Verification | Cloud VLM Verification Adapter | Integrates with Gemini 1.5 Flash / Groq Vision to contextually inspect candidate keyframes against rule instructions. | Keyframe base64 + instruction text | `VerificationResult` with confidence and summary | Catches provider exceptions and returns `processing_failed` | PRD §6.5, `services/api/app/services/verifier.py` |
| 17 | Context Verification | Deterministic Mock Verifier Fallback | Heuristic-driven local mock returning pre-calibrated verification decisions based on detector confidence and sample scene rules. | Keyframe or mock flag | Deterministic `VerificationResult` with simulated 300ms latency | Fallback active whenever `VISION_PROVIDER == 'mock'` | PRD §4.1, §6.5, `verifier.py:19` |
| 18 | Context Verification | Evaluation Benchmark Test Harness | Automated test harness evaluating verifier against labeled dataset (intrusions, pets, shadows, boundaries). | 10 sample evaluation images/scenarios | Precision, Recall, Confusion Matrix report | Fails assertion if precision or recall < 90% | PRD §12, `test_evaluation_harness.py` |
| 19 | Policy Engine | Active Schedule Window Check | Validates current wall-clock time against configured timezone schedule (e.g., Asia/Kolkata 22:00–06:00, including overnight boundary crossing). | Workflow schedule + datetime | Boolean (`True` if inside active window) | Suppresses action if current time is outside active schedule | PRD §6.6, `services/api/app/services/policy.py:15` |
| 20 | Policy Engine | Cooldown Suppression | Suppresses duplicate candidate events occurring within configured cooldown window (default 60 seconds) for the same camera. | camera_id + incident_id | Boolean + suppression reason string | Marks incident status as `confirmed` without sending duplicate action | PRD §6.6, `policy.py:68` |
| 21 | Policy Engine | Hourly Rate Limiter | Enforces strict cap on total dispatched notifications per hour (default 5 actions/hour) to prevent alert fatigue. | Organization/camera action history | Boolean + suppression reason | Suppresses action execution when hourly quota exceeded | PRD §6.6, `policy.py:88` |
| 22 | Action Dispatcher | SHA-256 Action Idempotency Engine | Computes deterministic SHA-256 hash `hash(incident_id:action_type:recipient)` to guarantee zero duplicate deliveries on retry storms. | incident_id, action_type, recipient | Unique idempotency key | Returns existing action record if key already present in DB | PRD §6.6 FR-X-02, `action_dispatcher.py:16` |
| 23 | Action Dispatcher | WhatsApp Cloud API Adapter | Dispatches structured template notification with incident details, timestamp, and evidence link to verified recipient. | incident_id, recipient_phone, message | WhatsApp API message ID or sandbox mock reference | Logs delivery failure if API returns non-200 | PRD §6.6, `action_dispatcher.py:63` |
| 24 | Action Dispatcher | Vapi Outbound Voice Alert Adapter | Initiates automated phone call via Vapi API with text-to-speech incident briefing to verified phone destination. | target_phone, incident briefing | Vapi call ID or sandbox mock reference | Logs error and updates status to `failed` on provider error | PRD §6.6, `action_dispatcher.py:86` |
| 25 | Action Dispatcher | Local Siren / Dashboard Alert | Triggers browser audible alert sound or local dashboard notification for high-severity incidents. | incident_id | Browser audio playback or WebSocket dispatch | Respects browser autoplay permissions | PRD §6.6 FR-X-09, `action_dispatcher.py:110` |
| 26 | Action Dispatcher | Safe Test Action Sandbox | Endpoint `/api/v1/actions/test` allowing manual dispatch of test notifications to consenting destinations without emergency escalation. | `TestActionRequest` JSON | Action dispatch response | Excludes emergency services; verifies destination format | PRD §4.2, §6.6 FR-X-07, `routers/actions.py` |
| 27 | Incident Center | Incident Persistence & Audit Store | Full database persistence of incidents with detector confidence, verifier confidence, snapshot evidence, and status transitions. | Ingested candidate event | Persisted row in `incidents` table | Enforces valid status check constraint | PRD §6.7, §8.1, `database.py:97` |
| 28 | Incident Center | Live Incident Feed UI | Real-time incident list showing incident cards with confidence meters, plain-language reason, camera name, and timestamp. | Real-time events / GET `/api/v1/incidents` | Responsive card deck in UI | Displays fallback placeholder if no incidents exist | PRD §13.3, `IncidentFeed.tsx` |
| 29 | Incident Center | Operator Acknowledgment | Endpoint `/api/v1/incidents/{id}/acknowledge` allowing human operators to acknowledge active security incidents. | incident_id | `{"status": "acknowledged"}` | HTTP 404 if incident does not exist | PRD §6.7, `routers/incidents.py:108` |
| 30 | Incident Center | Structured Feedback Logging | Endpoint `/api/v1/incidents/{id}/feedback` logging operator labels (`true_positive`, `false_positive`, `uncertain`, `wrong_zone`, etc.) for evaluation. | `FeedbackCreate` JSON | Persisted feedback row | Enforces label allowlist check constraint | PRD §6.7, `routers/incidents.py:120` |
| 31 | Workflow UI | 3-Node Visual Graph Editor | Interactive node flowchart (Trigger Node → Verify Node → Action Node) rendered via Tailwind/React components with parameter drawers. | Compiled `WorkflowDefinition` | Interactive 3-node flowchart | Shows placeholder message if no workflow compiled | PRD §6.2, §15.1, `WorkflowGraph.tsx` |
| 32 | Workflow UI | Bharat Presets Selector | One-click preset selector with 4 local domain configurations: Mandi Godown, MSME Machinery, Hospital Fall, Kirana Counter. | Preset button click | Populates prompt and triggers compilation | Displays preset details and limitations | PRD §14, `RuleBuilder.tsx:11` |
| 33 | Workflow UI | Bilingual Local-Language Headers | Bilingual English/Hindi UI labels throughout headers, cards, and preset titles (`दृष्टि-फ़्लो`, `गोदाम अनधिकृत प्रवेश`). | UI render | Bilingual text elements | Default English fallback if Hindi title not present | PRD §6.1, §13.2, `page.tsx`, `RuleBuilder.tsx` |
| 34 | System Operations | Service Liveness & Readiness Probes | Endpoints `/api/v1/health` and `/api/v1/ready` reporting API health, database connectivity, and configured AI providers. | HTTP GET | JSON status payload | Status degrades to `"degraded"` if DB disconnected | PRD §9, `routers/health.py` |
| 35 | Security & Privacy | Server-Side Secrets Isolation | Centralized `.env` configuration keeping all API keys and credentials server-side; zero `NEXT_PUBLIC_` secret exposures. | Backend env vars | In-memory configuration | Rejects requests or falls back to sandbox if keys missing | PRD §10.1, §16, `config.py` |

---

## 3. Edge Cases

The table below catalogs edge cases probed during code inspection, test execution, and database verification.

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Policy Engine (Hourly Rate Limit) | 5 actions already recorded in `actions` table; ISO-8601 string timestamps stored in DB. | **CRITICAL FAILURE:** SQLite `created_at >= datetime('now', '-1 hour')` performs ASCII string comparison. Because `'T' > ' '`, any ISO timestamp from today is evaluated as greater than `datetime('now', '-1 hour')`. All 5 cumulative actions are counted, and all subsequent incidents are permanently suppressed with `"Suppressed by Rate Limit: Reached 5/5 actions per hour."` Causing `test_full_drishtiflow_e2e_pipeline` to fail. |
| 2 | Policy Engine (Cooldown Suppression) | Candidate event arrives 11 seconds after previous confirmed event for same camera (cooldown = 60s). | Evaluated delta = 11s < 60s limit. Suppressed correctly with message: `"Suppressed by Cooldown: 11s since previous incident (< 60s limit)."`, incident marked as `confirmed`, external action prevented. |
| 3 | Policy Engine (Schedule Window) | Event arrives outside active schedule (e.g. daytime 14:00 when rule is 22:00–06:00). | Correctly evaluated by `is_schedule_active`; returns `False`, action suppressed with message: `"Suppressed: Current time is outside configured active schedule."` |
| 4 | Context Verifier (Low Confidence Candidate) | Candidate event with detector confidence 0.50 (between 0.45 and 0.75). | Correctly returns `decision: "uncertain"`, `confidence: 0.55`, `requires_human_review: True`, and incident status set to `uncertain`. |
| 5 | Context Verifier (Noise / Pet / Hard Negative) | Candidate event with detector confidence 0.20 (< 0.45). | Correctly returns `decision: "not_confirmed"`, `confidence: 0.20`, `requires_human_review: False`, and incident status set to `not_confirmed`. |
| 6 | Action Dispatcher (Duplicate Retry Storm) | Same incident and action type submitted twice with identical idempotency key. | Second call queries database, identifies matching `idempotency_key`, returns cached action record with `"note": "Existing action returned (idempotency preserved)."`, avoiding duplicate WhatsApp/Voice calls. |
| 7 | Camera Registration (Missing Site) | Call `/api/v1/cameras` when `sites` table has no rows. | Raises `HTTPException(status_code=500, detail="Site not configured")`. In normal startup, `init_db()` seeds default site to prevent this. |
| 8 | Workflow Activation (Invalid Definition) | Call `/api/v1/workflows/{id}/activate` on an incomplete workflow missing camera or zone. | **OVERSIGHT:** Endpoint simply runs `UPDATE workflows SET status = 'active'` without validating definition, schema, or missing zones. It activates an incomplete workflow silently. |
| 9 | Point-in-Polygon (Boundary Edge Points) | Detection anchor point located exactly on horizontal or vertical edge of polygon. | Ray-casting algorithm in `detector.py` uses `<` and `<=` conditions, correctly resolving boundary intersections without hanging or division-by-zero. |
| 10 | Point-in-Polygon (Degenerate Polygon) | Polygon input with only 2 vertices `[{x: 0.1, y: 0.1}, {x: 0.9, y: 0.9}]`. | `is_point_in_polygon` checks `if n < 3: return False` and returns `False` safely without crashing. |
| 11 | Vernacular Compiler (Time Parser with Hindi Words) | Prompt containing Hindi time expressions like *"दस बजे"* (10 o'clock) or *"आठ बजे"* (8 o'clock). | Regex in `extract_time_window` successfully matches `(10|दस)` and `(8|आठ)` and sets schedule to 22:00 or 20:00 respectively. |
| 12 | Database State Isolation in Tests | Running pytest multiple times consecutively on local machine. | `services/api/drishtiflow.db` persists state across test runs. On the 2nd run, cumulative records in `actions` exceed 5, triggering rate limit suppression in `test_full_drishtiflow_e2e_pipeline`. |

---

## 4. Milestone R0 (Hackathon Prototype) Target Requirements Matrix

The table below contrasts the authoritative PRD requirements for Milestone R0 (PRD §4.2, §4.3, §20) against current plan artifacts (`plan/TASKS.md` and `plan/STATE.md`).

| PRD Section | PRD R0 Requirement | Plan Task ID | Plan Documented Status | Actual Code Status | Verdict / Gap |
|---|---|---|---|---|:---:|
| §4.2, §6.1 | Hindi/Hinglish/English rule compilation | `TSK-D1-04` | `[x] DONE` | Fully implemented in `compiler.py` with rule-based fallback and unit tests | 🟢 ALIGNED |
| §4.2, §6.3 | Camera onboarding (webcam + sample clip) | `TSK-D2-01`, `TSK-D2-02` | `[x] DONE` | Implemented in `CameraPreview.tsx` with webcam toggle & warehouse simulation | 🟢 ALIGNED |
| §4.2, §6.3 | Interactive polygon zone overlay | `TSK-D2-03` | `[x] DONE` | Canvas overlay with ray-casting PIP in `ZoneCanvas.tsx` | 🟢 ALIGNED |
| §4.2, §6.4 | Edge person detection + 1.5s dwell | `TSK-D2-04` | `[x] DONE` | Dwell counter in `CameraPreview.tsx` & Python edge agent tests passing | 🟢 ALIGNED |
| §4.2, §6.5 | Context verification with 5 states | `TSK-D3-01`, `TSK-D3-02`, `TSK-D3-03` | `[x] DONE` | `VerificationResult` schema + deterministic mock fallback in `verifier.py` | 🟢 ALIGNED |
| §4.2, §6.6 | Deterministic policy engine | `TSK-D5-01` | `[x] DONE` | Schedule check, cooldown, rate limit in `policy.py` | 🔴 **DEFECT** (Rate limit SQLite bug breaks E2E test) |
| §4.2, §6.6 | Idempotent action dispatcher (WhatsApp + Voice) | `TSK-D5-02`, `TSK-D5-03`, `TSK-D5-04` | `[x] DONE` | SHA-256 idempotency + WhatsApp & Vapi adapters with sandbox mode | 🟢 ALIGNED |
| §4.2, §6.7 | Incident lifecycle & operator feedback | `TSK-D4-04`, `TSK-D5-01` | `[x] DONE` | Incidents persisted, acknowledge & feedback endpoints in `routers/incidents.py` | 🟢 ALIGNED |
| §6.1 FR-C-02 | Browser speech recognition | `TSK-D4-02` | `[x] DONE` | Toggle state exists in `RuleBuilder.tsx`, but speech recognition API is stubbed | 🟡 **MINOR GAP** |
| §6.2 FR-W-04 | Workflow version creation endpoint | (Not assigned) | Omitted from `plan/TASKS.md` | Missing `POST /api/v1/workflows/{id}/versions` endpoint | 🟡 **GAP** |
| §6.2 FR-W-08 | Server-side validation before activation | `TSK-D1-04` | Claimed covered | `activate_workflow` activates without validating definition | 🟡 **GAP** |
| §9.1 | Signed edge agent candidate events | `TSK-INIT-03` | Claimed covered | No authentication or signature header verified on `/events/candidates` | 🟡 **GAP** |
| §20.2 | End-to-end automated integration test | `TSK-D6-01` | `[x] DONE` (Claimed 0.68s) | `test_full_drishtiflow_e2e_pipeline` FAILED on execution | 🔴 **DEFECT** |

---

## 5. Detailed Discrepancies and Gap Analysis

### Gap 1: SQLite Rate Limit Query Fails Due to ISO-8601 String Comparison
- **Reference:** PRD §6.6 FR-X-05; `services/api/app/services/policy.py:92`
- **Observed Code:**
  ```python
  cursor.execute(
      """
      SELECT COUNT(*) as count FROM actions
      WHERE status in ('sent', 'delivered') AND created_at >= datetime('now', '-1 hour')
      """
  )
  ```
- **Analysis:** In Python, `created_at` is stored as an ISO-8601 string: `"2026-11-04T14:04:37.062187+00:00"`. In SQLite, `datetime('now', '-1 hour')` produces a space-separated string: `"2026-11-04 13:04:37"`.
  In ASCII collation, `'T'` (ASCII 84) is greater than `' '` (ASCII 32). Consequently, `created_at >= datetime('now', '-1 hour')` evaluates to `True` for every record created on the current date, regardless of whether it occurred 10 minutes ago or 10 hours ago!
  Once 5 actions have accumulated in the database, `actions_last_hour` is perpetually ≥ 5, causing `PolicyEngine.evaluate` to return `allowed = False`.
  This causes `test_full_drishtiflow_e2e_pipeline` to fail at line 88: `assert candidate_data["policy_allowed"] is True`.

### Gap 2: Test Database Lacks Isolation (State Pollution)
- **Reference:** `plan/STANDARDS.md` §1 DoD; `services/api/tests/`
- **Analysis:** All test files connect to the single physical database file `services/api/drishtiflow.db`. There is no `pytest` fixture to clean or isolate database state between runs. When running tests repeatedly or during CI, records from previous test executions persist, causing rate-limit thresholds to trip unexpectedly.

### Gap 3: Missing Workflow Versioning Endpoint (`POST /api/v1/workflows/{id}/versions`)
- **Reference:** PRD §5.3, §8.1 (`workflow_versions`), §9 API specification table (line 809)
- **Analysis:** PRD §9 explicitly specifies:
  `POST /api/v1/workflows/{id}/versions` — "Create a new version".
  In `services/api/app/routers/workflows.py`, this endpoint does not exist. While the database table `workflow_versions` supports multi-version schemas, the API only allows creating version 1 at initial workflow creation.

### Gap 4: Workflow Activation Lacks Server-Side Validation
- **Reference:** PRD §5.1, §6.2 FR-W-08, §9 line 810
- **Analysis:** In `services/api/app/routers/workflows.py:119-134`:
  ```python
  @router.post("/{workflow_id}/activate")
  def activate_workflow(workflow_id: str):
      conn = get_db()
      cursor = conn.cursor()
      now = datetime.now(timezone.utc).isoformat()
      cursor.execute("UPDATE workflows SET status = 'active', updated_at = ? WHERE id = ?", (now, workflow_id))
  ```
  The endpoint does not validate whether the workflow definition is valid, whether a camera is assigned, whether a zone polygon exists, or whether status is currently in `needs_review`.

### Gap 5: Hardcoded Camera ID in Frontend Component vs Dynamic DB Seeds
- **Reference:** PRD §4.2, §13.1; `apps/web/src/components/camera/CameraPreview.tsx:111`
- **Analysis:** `CameraPreview.tsx` emits candidate events with hardcoded `camera_id: "cam-warehouse-gate-01"`. However, `services/api/app/database.py:163` seeds the camera with a random UUID. When `/api/v1/events/candidates` is invoked, it fails to find the camera in `cameras` table and falls back to a generic default site/camera. The UI should dynamically pass the registered camera's UUID.

### Gap 6: Browser Speech Recognition Incomplete
- **Reference:** PRD §6.1 FR-C-02; `apps/web/src/components/workflow/RuleBuilder.tsx:88-96`
- **Analysis:** The microphone button toggles an internal `isRecording` state, but does not instantiate `webkitSpeechRecognition` / `SpeechRecognition` to stream transcripts into the textarea.

---

## 6. Non-Functional Requirements & Acceptance Criteria for Milestone R0

| ID | Non-Functional Requirement | PRD Target | Measured Reality | Status |
|---|---|---|---|:---:|
| NFR-01 | End-to-End Pipeline Latency | p95 ≤ 5,000ms | 680ms (when policy permits) | 🟢 MET |
| NFR-02 | Verifier Precision & Recall | ≥ 90.0% on evaluation set | 100.0% (5 TP, 0 FP, 0 FN) on 10-sample set | 🟢 MET |
| NFR-03 | Frontend Initial Bundle Size | ≤ 250 kB First Load JS | 100 kB First Load JS (`next build`) | 🟢 MET |
| NFR-04 | Edge Ingestion Frame Rate | ≥ 20 FPS | 24 FPS achieved in simulation canvas | 🟢 MET |
| NFR-05 | Safe Degradation on Model Failure | 100% safe degradation | Degrades to `uncertain` / `processing_failed` | 🟢 MET |
| NFR-06 | Automated Test Pass Rate | 100% (0 test failures) | 11/12 passing (1 failure in E2E pipeline) | 🔴 **NOT MET** |
| NFR-07 | Action Idempotency | Zero duplicate alerts on retries | Verified with SHA-256 keys | 🟢 MET |
| NFR-08 | Secret Protection | Zero API keys in frontend | Verified: no `NEXT_PUBLIC_` secrets | 🟢 MET |

---

## 7. Recommended Action Plan for Orchestrator

To bring the codebase to full 100% operational integrity and align `plan/STATE.md` with reality:

1. **Fix Rate Limit Query in `services/api/app/services/policy.py`**:
   Replace the SQLite string comparison with a parameterized timestamp or format ISO timestamps consistently with SQLite's modifier:
   ```python
   # Format cutoff in UTC ISO format matching stored created_at strings
   cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
   cursor.execute(
       """
       SELECT COUNT(*) as count FROM actions
       WHERE status in ('sent', 'delivered') AND created_at >= ?
       """,
       (cutoff,)
   )
   ```
2. **Add Test Database Fixture**:
   In `services/api/tests/`, configure an isolated test database fixture or reset `actions` and `incidents` tables before running `test_e2e_pipeline.py`.
3. **Implement `POST /api/v1/workflows/{id}/versions`**:
   Add the versioning endpoint to `services/api/app/routers/workflows.py` to satisfy PRD §9.
4. **Implement Pre-Activation Validation**:
   In `activate_workflow`, parse the workflow definition and ensure required fields and zones are populated before setting status to `active`.
5. **Harmonize Camera UUID**:
   Ensure `CameraPreview.tsx` receives the actual camera ID from the backend `/api/v1/cameras` endpoint rather than the placeholder `"cam-warehouse-gate-01"`.
