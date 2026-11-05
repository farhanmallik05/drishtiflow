# Frontend & Integration Handoff Report

## 1. Observation

### 1.1 Next.js Frontend Build
- **Command:** `npm run build --workspace=apps/web`
- **Output:**
  ```
  ▲ Next.js 14.2.35
   Creating an optimized production build ...
  ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
  ✓ Generating static pages (4/4)
   Finalizing page optimization ...
  Route (app)                              Size     First Load JS
  ┌ ○ /                                    13.1 kB         100 kB
  └ ○ /_not-found                          873 B          88.1 kB
  + First Load JS shared by all            87.2 kB
  ```
- **Result:** Exit code 0. TypeScript typecheck (`npx tsc --noEmit -p apps/web/tsconfig.json`) exited with code 0.

### 1.2 Frontend Linting Failure
- **Command:** `npm run lint --workspace=apps/web`
- **Output:**
  ```
  npm notice run drishtiflow-web@1.0.0 lint
  npm notice run next lint
  ? How would you like to configure ESLint? https://nextjs.org/docs/basic-features/eslint
  npm error code 1
  ```
- **File observation:** No `.eslintrc.json` or `.eslintrc.js` exists in `apps/web/`.

### 1.3 Hardcoded Backend Endpoints
Direct inspection of frontend files reveals hardcoded absolute URLs pointing to `http://localhost:8000`:
- `apps/web/src/components/workflow/RuleBuilder.tsx:60`: `fetch("http://localhost:8000/api/v1/workflows/compile", ...)`
- `apps/web/src/components/camera/CameraPreview.tsx:125`: `fetch("http://localhost:8000/api/v1/events/candidates", ...)`
- `apps/web/src/components/incidents/ActionTester.tsx:27`: `fetch("http://localhost:8000/api/v1/actions/test", ...)`
- `apps/web/src/components/incidents/IncidentFeed.tsx:30, 51, 66`: `fetch("http://localhost:8000/api/v1/incidents...")`
Meanwhile, `apps/web/next.config.js:8-10` already defines a reverse proxy rewrite:
```js
{
  source: "/api/:path*",
  destination: "http://localhost:8000/api/:path*",
}
```

### 1.4 Workflow Activation & Persistence Gap
- `apps/web/src/app/page.tsx:131-132`:
  ```tsx
  <WorkflowGraph
    workflow={activeWorkflow}
    onActivate={(id) => console.log("Activated workflow:", id)}
    onPause={(id) => console.log("Paused workflow:", id)}
  />
  ```
  No HTTP requests are dispatched to `/api/v1/workflows/{id}/activate` or `/api/v1/workflows/{id}/pause`.
- `apps/web/src/components/workflow/RuleBuilder.tsx`:
  Compiled workflow from `/api/v1/workflows/compile` is never saved to `/api/v1/workflows`, leaving `activeWorkflow.id` as `undefined`.

### 1.5 Edge Candidate Evidence Snapshot
- `apps/web/src/components/camera/CameraPreview.tsx:109-122`:
  `emitCandidateEvent` payload omits `evidence_frame_base64`.
- `apps/web/src/components/incidents/IncidentFeed.tsx:107-220`:
  Incident cards lack `<img>` elements for displaying snapshot evidence.

### 1.6 Backend Test Suite Failure
- **Command:** `pytest services/api/tests/`
- **Output:** 7 passed, 1 failed.
  `FAILED services/api/tests/test_e2e_pipeline.py::test_full_drishtiflow_e2e_pipeline`
  Line 88: `assert candidate_data["policy_allowed"] is True` failed (`assert False is True`).
- **Database inspection:**
  `SELECT count(1) FROM actions WHERE status in ('sent', 'delivered')` returned `5`.
  In `services/api/app/services/policy.py:63, 96`, `max_per_hour = 5`. The 6th action is rejected by rate-limiting.

---

## 2. Logic Chain

1. **Build Viability:**
   - Observations in §1.1 demonstrate that Next.js 14.2 compiles cleanly, satisfies TypeScript checks without type errors, and produces a 100 kB bundle, which is well within the 250 kB performance budget.
2. **Linting Defect:**
   - Observations in §1.2 show that running the monorepo lint script fails because `apps/web` lacks an `.eslintrc.json`. Next.js prompts interactively in terminal and throws exit code 1.
3. **Deployment Fragility:**
   - Observations in §1.3 show that frontend components bypass Next.js API rewrites and use hardcoded `http://localhost:8000`. Any deployment behind reverse proxies, containerized environments, or alternative ports will fail API calls.
4. **UX / Workflow Breakage:**
   - Observations in §1.4 show that compiling a rule in `RuleBuilder` does not persist it to the database, leaving `activeWorkflow.id` undefined. Calling `onActivate` or `onPause` in `WorkflowGraph` executes only `console.log`. The workflow loop between creation and activation is therefore disconnected.
5. **Evidence Deficit:**
   - Observations in §1.5 indicate that `CameraPreview` does not capture canvas frames to base64, and `IncidentFeed` does not display keyframe images, conflicting with PRD §13.3.
6. **Backend Rate Limit Invalidation:**
   - Observations in §1.6 prove that `test_e2e_pipeline.py` fails not due to code regression in the pipeline, but because test isolation is missing in `drishtiflow.db`, exceeding the default `max_actions_per_hour = 5`.

---

## 3. Caveats

- **Browser Audio / Web Speech API:** Speech recognition cannot be tested headlessly; actual microphone capture in `RuleBuilder.tsx` was audited via static code analysis showing an un-instantiated handler.
- **Webcam Hardware:** Headless terminal cannot test physical camera device capture; `getUserMedia` error fallback logic was evaluated by code inspection.
- **External Notification Sandbox:** Real WhatsApp and Vapi phone calls require live API credentials in `.env`; behavior was evaluated through mock / sandbox responses.

---

## 4. Conclusion

1. **Frontend Build Status:** The Next.js 14 frontend builds cleanly with an excellent bundle footprint (100 kB).
2. **Integration Status:** The UI communicates with the backend, but suffers from hardcoded URLs, missing workflow persistence/activation endpoints, missing evidence snapshots in incident cards, and an unconfigured ESLint setup.
3. **Acceptance Criteria Blockers:**
   - `npm run lint` fails due to missing `.eslintrc.json` in `apps/web`.
   - `services/api/tests/test_e2e_pipeline.py` fails on line 88 due to SQLite database rate-limit exhaustion.

---

## 5. Verification Method

To independently reproduce and verify all findings:

1. **Verify Frontend Build & Bundle:**
   ```powershell
   npm run build --workspace=apps/web
   ```
   Expect: Exit code 0, Route `/` size 13.1 kB, First Load JS 100 kB.

2. **Verify Frontend Lint Failure:**
   ```powershell
   npm run lint --workspace=apps/web
   ```
   Expect: Exit code 1 prompting for ESLint setup.

3. **Verify Edge Agent Test Suite:**
   ```powershell
   pytest services/edge-agent/tests/
   ```
   Expect: 4 passed in ~0.3s.

4. **Verify Backend Integration Failure:**
   ```powershell
   pytest services/api/tests/test_e2e_pipeline.py
   ```
   Expect: Line 88 `assert candidate_data["policy_allowed"] is True` fails when database has ≥ 5 actions in the past hour.
