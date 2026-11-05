# DrishtiFlow Frontend & Integration Technical Analysis Report

**Date:** 2026-11-04  
**Investigator:** Teamwork Explorer (Frontend & Integration)  
**Scope:** `apps/web/`, frontend-to-backend API integration, shared packages, and verification against PRD v3.0 / `plan/`.

---

## 1. Executive Summary & Verification Metrics

The Next.js 14 frontend application in `apps/web/` was thoroughly evaluated for compilation integrity, component architecture, state management, and end-to-end integration with the FastAPI backend (`services/api/`).

### Verification Snapshot:
| Evaluation Item | Status | Measured Evidence / Details |
|---|:---:|---|
| **Next.js Production Build (`next build`)** | 🟢 **PASS** | Exit code 0, 4/4 static pages generated, zero compile or type errors |
| **First Load JS Bundle Size** | 🟢 **PASS** | 100 kB (budget ≤ 250 kB; Route `/` = 13.1 kB, shared chunks = 87.2 kB) |
| **TypeScript Typecheck (`tsc --noEmit`)** | 🟢 **PASS** | Zero type errors in `apps/web` |
| **Linter Configuration (`next lint`)** | 🔴 **FAIL** | Exit code 1; prompts interactively because `.eslintrc.json` is missing |
| **Edge Agent Test Suite (`pytest services/edge-agent`)** | 🟢 **PASS** | 4/4 tests pass in 0.28s |
| **Backend Integration Suite (`pytest services/api`)** | 🟡 **WARN** | 7/8 pass; `test_e2e_pipeline.py` fails on line 88 due to SQLite rate limit (5 actions/hr) |

---

## 2. Production Build & Bundle Inspection

Running `npm run build --workspace=apps/web` (Next.js 14.2.35):
```
  ▲ Next.js 14.2.35
   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/4) ...
   Generating static pages (1/4) 
   Generating static pages (2/4) 
   Generating static pages (3/4) 
 ✓ Generating static pages (4/4)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    13.1 kB         100 kB
└ ○ /_not-found                          873 B          88.1 kB
+ First Load JS shared by all            87.2 kB
  ├ chunks/1dd3208c-e47c3dfcb56f388b.js  53.6 kB
  ├ chunks/528-016c03f6362f3534.js       31.7 kB
  └ other shared chunks (total)          1.86 kB
○  (Static)  prerendered as static content
```

### Bundle Size Analysis:
- Total client-side footprint of 100 kB easily beats the PRD target of ≤ 250 kB.
- The UI avoids importing heavy external flowchart graph libraries like `@xyflow/react` or `reactflow`, instead implementing lightweight, responsive flex/grid flowchart cards in `WorkflowGraph.tsx`.

---

## 3. Deep Component Architecture & Flow Inspection

### 3.1 `apps/web/src/app/page.tsx` (App Shell & Navigation)
- **State Management:**
  - `activeTab`: Switches between `"monitor"` (Command Center), `"workflow"` (Rule & Workflow Graph), and `"incidents"` (Incident Center).
  - `activeWorkflow`: Holds compiled workflow object from `RuleBuilder`.
  - `latestIncident`: Propagated from `CameraPreview.onCandidateTriggered` to `IncidentFeed`.
- **Architectural Gaps Identified:**
  1. **Disconnected Workflow Activation/Pause:**
     Lines 131-132:
     ```tsx
     <WorkflowGraph
       workflow={activeWorkflow}
       onActivate={(id) => console.log("Activated workflow:", id)}
       onPause={(id) => console.log("Paused workflow:", id)}
     />
     ```
     `onActivate` and `onPause` only log to the console. They do not trigger `POST /api/v1/workflows/{workflow_id}/activate` or `POST /api/v1/workflows/{workflow_id}/pause`.
  2. **Static Telemetry Indicators:**
     Lines 91-100 display static badges: `FastAPI Gateway: 8000` (emerald pulse) and `VLM Mode: Verified Fallback` (blue server icon). These are hardcoded and do not query `GET /api/v1/ready` or `GET /api/v1/health` to reflect actual backend connectivity or VLM provider status.
  3. **Missing Workflow Persistence:**
     When a workflow is compiled in `RuleBuilder`, it generates a `WorkflowDefinition` without an ID. There is no call to `POST /api/v1/workflows` to persist it into the database, leaving `activeWorkflow.id` as `undefined`. Consequently, `CameraPreview` sends `workflow_id: null` in candidate events.

---

### 3.2 `apps/web/src/components/camera/CameraPreview.tsx` & `ZoneCanvas.tsx`
- **Capabilities Verified:**
  - High-fidelity simulated warehouse security bay with moving intruder figure (`personPos` trajectory), godown pillars, and animated avatar.
  - Interactive Canvas ray-casting point-in-polygon engine (`isPointInPolygon`) checking intruder feet against user-defined polygon coordinates.
  - Persistent dwell counter: debounces for 4 consecutive ticks (~1.5s) before triggering alarms.
  - Webcam support via `navigator.mediaDevices.getUserMedia`.
- **Architectural Gaps Identified:**
  1. **Simulated intruder persists in webcam mode:**
     In `CameraPreview.tsx` lines 58-68, `isSimulatingPerson` is hardcoded to `true`. When the operator toggles to "Live Local Webcam", the simulated person overlay and bounding box continue to move across the webcam video!
  2. **Missing Base64 Evidence Frame Capture:**
     Line 109 `emitCandidateEvent()` sends `detector`, `bounding_box`, and timestamp, but does NOT capture an image from the canvas/video (`canvas.toDataURL("image/jpeg")`). As a result, `evidence_frame_base64` is sent as `null`/`undefined`, which prevents the verifier from analyzing real image data and prevents `IncidentFeed` from displaying event keyframes.
  3. **Hardcoded Unseeded Camera ID:**
     `camera_id: "cam-warehouse-gate-01"` is hardcoded. Since this UUID does not match the seeded camera in `drishtiflow.db`, backend queries fall back to generic `"Edge Camera"`.
  4. **No Zone Persistence:**
     Zones can be drawn, cleared, or reset to a hardcoded preset, but there is no button or API call to persist the zone overlay to `POST /api/v1/cameras/{id}/zones`.

---

### 3.3 `apps/web/src/components/workflow/RuleBuilder.tsx` & `WorkflowGraph.tsx`
- **Capabilities Verified:**
  - 4 bilingual Bharat presets (Mandi/Godown, MSME Cutting Bay, Hospital Fall Assist, Kirana Counter).
  - Asynchronous natural language prompt compilation against `POST http://localhost:8000/api/v1/workflows/compile`.
  - Displays proposed English/Hindi title, detector class (`person`), schedule window, and clarification questions.
  - Interactive parameter drawer in `WorkflowGraph.tsx` allowing adjustment of confidence sliders (0.3 to 0.9), cooldown threshold (15 to 300s), and notification channel checkboxes.
- **Architectural Gaps Identified:**
  1. **Stubbed Voice Input:**
     Lines 88-96 in `RuleBuilder.tsx`:
     ```ts
     const handleToggleVoice = () => {
       if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
         alert("Browser speech recognition is not supported in this browser. Please type your prompt.");
         return;
       }
       setIsRecording(!isRecording);
       // In a live browser, initiate SpeechRecognition with Hindi/English language setting
     };
     ```
     The speech recognition handler toggles an animation flag but never instantiates the Web Speech API (`SpeechRecognition`).
  2. **Unsaved Node Parameter Customizations:**
     In `WorkflowGraph.tsx`, adjusting the cooldown slider or detection confidence updates local React state, but does not mutate the `workflow` object or send updates to the backend.
  3. **Missing "Save & Deploy Rule" Action:**
     After compiling a rule, there is no button to save the workflow to `POST /api/v1/workflows` to make it the active camera workflow.

---

### 3.4 `apps/web/src/components/incidents/IncidentFeed.tsx` & `ActionTester.tsx`
- **Capabilities Verified:**
  - Loads recent incidents on mount via `GET http://localhost:8000/api/v1/incidents?limit=20`.
  - Dynamically prepends newly detected incidents via `latestIncident` prop.
  - Interactive Operator Feedback: "True Positive" / "False Positive" buttons wired to `POST http://localhost:8000/api/v1/incidents/{id}/feedback`.
  - Operator Acknowledgment button wired to `POST http://localhost:8000/api/v1/incidents/{id}/acknowledge`.
  - Confidence comparison meter showing Edge Detector Confidence vs Context VLM Confidence.
  - ActionTester modal for safe sandbox dispatch of WhatsApp and Voice calls.
- **Architectural Gaps Identified:**
  1. **No Snapshot Image Display:**
     `IncidentFeed` cards do not display keyframe images or thumbnails (`evidence_frame_base64` or `evidence_url`) because the interface and JSX omit image tags.
  2. **Lack of Real-Time Polling or WebSockets:**
     `IncidentFeed` only fetches on mount and when `latestIncident` prop changes from local camera preview. Incidents triggered by background daemons or other cameras do not appear unless the page is reloaded.
  3. **Missing Error State on API Disconnect:**
     If `fetch("http://localhost:8000/api/v1/incidents")` fails on mount, it logs `console.warn` but leaves the feed blank without notifying the user that the backend is unreachable.

---

## 4. Frontend-Backend Integration Audit

### 4.1 URL & Reverse Proxy Discipline
- `apps/web/next.config.js` defines an API rewrite:
  ```js
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  }
  ```
- **Finding:** Every single component in `apps/web` bypasses Next.js rewrites and environment variables by hardcoding absolute URLs:
  - `http://localhost:8000/api/v1/workflows/compile` (`RuleBuilder.tsx:60`)
  - `http://localhost:8000/api/v1/events/candidates` (`CameraPreview.tsx:125`)
  - `http://localhost:8000/api/v1/actions/test` (`ActionTester.tsx:27`)
  - `http://localhost:8000/api/v1/incidents` (`IncidentFeed.tsx:30, 51, 66`)
- **Impact:** Breaks in production deployments, Docker containers, or any host where frontend and backend are on different ports or hostnames.
- **Remediation:** Replace with relative paths `/api/v1/...` (benefiting from `next.config.js` rewrites) or use `process.env.NEXT_PUBLIC_API_URL || ""`.

### 4.2 Shared Packages & Typing Disconnect
- Monorepo includes `@drishtiflow/workflow-schema` (Zod schemas) and `@drishtiflow/shared-types` (TypeScript interfaces).
- `apps/web/package.json` does NOT include these packages in its `dependencies`.
- In components, objects are typed as `any` (e.g. `workflow: any`, `data: any`, `result: any`).
- **Remediation:** Add `"@drishtiflow/workflow-schema": "*"` and `"@drishtiflow/shared-types": "*"` to `apps/web/package.json` to enable strict typing across all components.

---

## 5. Investigation of Backend E2E Test Failure

During testing of acceptance criteria ("All tests in services/api/tests/ pass with zero failures"), `test_full_drishtiflow_e2e_pipeline` in `services/api/tests/test_e2e_pipeline.py` failed:
```
assert candidate_data["policy_allowed"] is True
assert False is True
```

### Root Cause Analysis:
1. In `services/api/app/services/policy.py`:
   ```python
   cursor.execute(
       """
       SELECT COUNT(*) as count FROM actions
       WHERE status in ('sent', 'delivered') AND created_at >= datetime('now', '-1 hour')
       """
   )
   actions_last_hour = cursor.fetchone()["count"]
   if actions_last_hour >= max_per_hour:
       conn.close()
       return False, f"Suppressed by Rate Limit: Reached {actions_last_hour}/{max_per_hour} actions per hour.", []
   ```
2. The SQLite database `services/api/drishtiflow.db` persists state across test runs.
3. Querying the database revealed exactly 5 actions created within the last hour.
4. Because `max_per_hour` defaults to 5, the policy engine correctly enforced rate-limiting and suppressed the 6th action.
5. In `test_e2e_pipeline.py`, the test asserted `policy_allowed is True` without either clearing previous actions in `drishtiflow.db` or overriding `max_actions_per_hour` for the test workflow.

---

## 6. Prioritized Remediation Recommendations

| Priority | Issue / Gap | Target File | Recommended Fix |
|:---:|---|---|---|
| **P0** | ESLint missing config causing `npm run lint` failure | `apps/web/.eslintrc.json` | Create `.eslintrc.json` extending `"next/core-web-vitals"`. |
| **P0** | Hardcoded `http://localhost:8000` URLs | `apps/web/src/components/*` | Change API calls to use relative `/api/v1/...` or `NEXT_PUBLIC_API_URL`. |
| **P1** | Disconnected Workflow Activation & Persistence | `page.tsx`, `RuleBuilder.tsx`, `WorkflowGraph.tsx` | Add "Save & Activate Workflow" invoking `POST /api/v1/workflows` and `POST /api/v1/workflows/{id}/activate`. |
| **P1** | Missing Snapshot Capture & Display | `CameraPreview.tsx`, `IncidentFeed.tsx` | Capture canvas frame to base64 upon breach; render keyframe thumbnail on incident cards in `IncidentFeed`. |
| **P1** | Backend E2E test rate limit failure | `services/api/tests/test_e2e_pipeline.py` | Configure `wf_def["safety"]["max_actions_per_hour"] = 100` in the test setup. |
| **P2** | Static System Telemetry in Header | `apps/web/src/app/page.tsx` | Wire telemetry indicator to `GET /api/v1/ready` to reflect real database and verifier readiness. |
| **P2** | Web Speech API Stub | `apps/web/src/components/workflow/RuleBuilder.tsx` | Implement real `webkitSpeechRecognition` with language fallback (`hi-IN` / `en-IN`). |
| **P3** | Simulating person overlay active during webcam mode | `apps/web/src/components/camera/CameraPreview.tsx` | Hide simulated avatar and stop motion loop when `sourceType === "webcam"`. |
