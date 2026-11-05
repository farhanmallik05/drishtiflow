## 2026-11-04T15:05:50Z
You are teamwork_worker operating in: d:\hackathon\Build with Bharat\.agents\teamwork\worker_remediation_1
Your working directory is: d:\hackathon\Build with Bharat\.agents\teamwork\worker_remediation_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Read ORIGINAL_REQUEST.md at: d:\hackathon\Build with Bharat\.agents\teamwork\ORIGINAL_REQUEST.md
Also read DISPATCH.md in your working directory and PROJECT.md at d:\hackathon\Build with Bharat\.agents\teamwork\orchestrator\PROJECT.md.

Read the explorer handoffs:
- d:\hackathon\Build with Bharat\.agents\teamwork\explorer_backend\handoff.md
- d:\hackathon\Build with Bharat\.agents\teamwork\explorer_frontend\handoff.md
- d:\hackathon\Build with Bharat\.agents\teamwork\spec_miner_prd\handoff.md

Your exclusive write boundaries:
- services/api/app/services/policy.py
- services/api/app/routers/workflows.py
- services/api/tests/test_e2e_pipeline.py
- apps/web/.eslintrc.json
- apps/web/src/components/workflow/RuleBuilder.tsx
- apps/web/src/components/workflow/WorkflowGraph.tsx
- apps/web/src/components/camera/CameraPreview.tsx
- apps/web/src/components/incidents/ActionTester.tsx
- apps/web/src/components/incidents/IncidentFeed.tsx
- plan/STATE.md
- plan/TASKS.md
- plan/CHANGELOG.md

Detailed Tasks:
1. Fix `services/api/app/services/policy.py`:
   - Scope hourly rate limit to `camera_id` (via join with `incidents` table: `SELECT COUNT(*) as count FROM actions a JOIN incidents i ON a.incident_id = i.id WHERE i.camera_id = ? AND a.status in ('sent', 'delivered') AND a.created_at >= ?`).
   - In Python, compute `cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()` and pass as parameter `?` to avoid SQLite datetime string mismatch.
2. In `services/api/app/routers/workflows.py`:
   - Add `POST /api/v1/workflows/{id}/versions` (PRD §9) to save a version snapshot.
   - In `POST /api/v1/workflows/{id}/activate`, add validation check that workflow definition is valid and has trigger/actions before setting status to 'active'.
3. In `services/api/tests/test_e2e_pipeline.py`:
   - Ensure test isolation or cleanup so `test_full_drishtiflow_e2e_pipeline` passes deterministically every time.
4. In `apps/web/.eslintrc.json`:
   - Create standard Next.js ESLint config: `{"extends": "next/core-web-vitals"}` so `npm run lint` passes cleanly.
5. In `apps/web/src/components/`:
   - In `RuleBuilder.tsx`, `WorkflowGraph.tsx`, `CameraPreview.tsx`, `ActionTester.tsx`, `IncidentFeed.tsx`: replace hardcoded `http://localhost:8000` with relative `/api/v1/...` (benefiting from Next.js rewrites) or `NEXT_PUBLIC_API_URL`.
   - In `RuleBuilder.tsx`, persist the compiled workflow via `POST /api/v1/workflows` and update state with the saved ID.
   - In `WorkflowGraph.tsx`, call `POST /api/v1/workflows/${id}/activate` on activate.
   - In `CameraPreview.tsx`, attach evidence frame base64 to candidate event payload if available.
   - In `IncidentFeed.tsx`, display snapshot thumbnail if image is present.
6. Verification:
   - Run `pytest services/api/tests/ -v` (8/8 must pass).
   - Run `pytest services/edge-agent/tests/ -v` (4/4 must pass).
   - Run `npm run build --workspace=apps/web` (0 errors).
   - Run `npm run lint --workspace=apps/web` (0 errors).
7. Plan-First Synchronization (PFCP):
   - Update `plan/STATE.md`, `plan/TASKS.md`, `plan/CHANGELOG.md` with timestamped log of modifications, test outputs, and validation evidence.

Write your final report in `d:\hackathon\Build with Bharat\.agents\teamwork\worker_remediation_1\handoff.md`.
Update `progress.md` in your directory regularly. When done, send a message to orchestrator with your status and summary.
