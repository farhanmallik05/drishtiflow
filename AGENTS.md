# AGENTS.md — Global Workspace Directives for DrishtiFlow

This file establishes foundational rules for all AI agents, subagents, and automated workflows operating in this workspace.

---

## 1. Plan-First Enforcement Protocol

**EVERY AGENT TURN THAT CREATES, MODIFIES, OR DELETES PROJECT CODE OR CONFIGURATION MUST SIMULTANEOUSLY UPDATE THE `plan/` FOLDER.**

- **Target Files in `plan/`**:
  - `plan/STATE.md`: Reflect current project health, active task, progress metric, and active blockers.
  - `plan/TASKS.md`: Mark task status (`[ ] TODO` -> `[~] IN_PROGRESS` -> `[x] DONE`), include validation evidence.
  - `plan/CHANGELOG.md`: Log timestamp, commit/change summary, changed files list, author/agent.
  - `plan/ARCHITECTURE.md`: Document any API, schema, database, or pipeline adjustments.
  - `plan/ROADMAP.md`: Adjust phase schedules or exit criteria if modified.

Refer to [plan/PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md) for full protocol specifics.

---

## 2. Scope & Execution Discipline

1. **Adhere to PRD v3**: [DrishtiFlow_Enhanced_PRD_v3_EMPTY.md](file:///d:/hackathon/Build%20with%20Bharat/DrishtiFlow_Enhanced_PRD_v3_EMPTY.md) is the authoritative product and engineering blueprint.
2. **Strict Scope Control**: Do not introduce unrequested features, heavy frameworks, or unnecessary dependencies without an entry in `plan/TASKS.md`.
3. **Evidence Over Assumptions**: No task is marked complete without documented verification in `plan/TASKS.md`.
4. **Preserve Integrity**: Do not refactor unrelated working modules or delete test suites.
5. **Team Ownership Awareness**:
   - Farhan: Compiler, contracts, API orchestration, release coordination.
   - Kartikey: Camera ingestion, edge vision, zone logic.
   - Ankit: Context verification, VLM evaluation, incident feedback.
   - Piyush: Frontend, workflow canvas, incident UX.
   - Kaushendra: Action dispatcher, notification adapters.

---

## 3. Security, Safety & Responsible AI

- Never put credentials, API keys, or private tokens in frontend files or commit history.
- Never claim 100% accuracy, medical safety, or autonomous emergency dispatch.
- Context verification failures must degrade safely to `uncertain` or `processing_failed`, never silently suppressed.
- High-consequence actions must always be governed by deterministic policy with idempotency keys and rate limits.

