# Workspace Rules: DrishtiFlow (Build with Bharat 5.0)

## MANDATORY: Plan-First Change Protocol (PFCP)

Every agent, assistant, and engineer working in this workspace **MUST** strictly adhere to the Plan-First Change Protocol defined in [plan/PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md).

### Non-Negotiable Requirements on EVERY Change:

1. **Check Plan First:** Before reading or editing codebase files for any task, review `plan/STATE.md` and `plan/TASKS.md` to identify the current milestone, active task ID, and constraints.
2. **Track Task Status:**
   - When beginning a task: transition status in `plan/TASKS.md` to `[~] IN_PROGRESS`.
   - When completing a task: transition status in `plan/TASKS.md` to `[x] DONE`, logging validation evidence and affected files.
3. **Synchronous Plan Updates:** With every single change (code, tests, configuration, docs, dependencies):
   - Update `plan/STATE.md` (active state, progress %, recent changes).
   - Update `plan/TASKS.md` (task status and validation evidence).
   - Update `plan/CHANGELOG.md` (timestamped log entry under `[Unreleased]` with changed files and reason).
   - If architecture, schemas, or APIs change: update `plan/ARCHITECTURE.md`.
   - If milestones or timelines change: update `plan/ROADMAP.md`.
4. **No Ghost Changes:** Never create, edit, or delete project files without recording the corresponding task and changelog entry in `plan/`.
5. **Verify Before Claiming Done:** Never mark a task done in `plan/TASKS.md` without running real validation (type checks, unit tests, CLI tests, or manual runs) and recording the actual output/evidence.

---

## Technical Context & Guardrails (DrishtiFlow v3)

- **PRD Reference:** [DrishtiFlow_Enhanced_PRD_v3_EMPTY.md](file:///d:/hackathon/Build%20with%20Bharat/DrishtiFlow_Enhanced_PRD_v3_EMPTY.md)
- **Primary Wedge:** Warehouse / godown perimeter and after-hours restricted zone intrusion.
- **Edge-First Architecture:** Video processing occurs near the source (Webcam / WebRTC gateway / local agent); only candidate event evidence is escalated for contextual VLM verification.
- **Human-Governed Automation:** AI proposes and verifies; deterministic policy engine controls actions. No autonomous emergency dispatch.
- **Security & Privacy:** Server-side secret storage; zero private keys or RTSP credentials in client bundles; DPDP Act alignment; strict tenant isolation.
- **Monorepo Blueprint:** `apps/web` (Next.js + React Flow), `services/api` (FastAPI + Pydantic), `services/edge-agent`, `packages/workflow-schema`, `packages/shared-types`.

*Refer to [plan/STANDARDS.md](file:///d:/hackathon/Build%20with%20Bharat/plan/STANDARDS.md) for full coding, security, and quality gates.*

