# Plan-First Change Protocol (PFCP)
**Enforcement Level:** MANDATORY across entire workspace  
**Applies to:** All AI Agents (Antigravity / Gemini / Claude), Subagents, and Human Developers  
**Scope:** Any file creation, modification, refactoring, deletion, configuration change, or dependency update.

---

## 1. Core Mandate

> **NO CHANGE SHALL BE COMMITTED OR CONSIDERED COMPLETE WITHOUT SYNCHRONOUSLY UPDATING THE `plan/` FOLDER.**

Every action taken in this repository must originate from, align with, and be reflected in the planning artifacts located in `/plan`.

---

## 2. The Four Plan Files to Update on Every Change

Whenever you create or modify files in this repository, you must update:

1. **`plan/STATE.md`**:
   - Update `Last Updated` timestamp.
   - Update `Current Active Task` and `Current Phase Progress`.
   - Update any blockers or recent status changes.
   - Increment task counters if applicable.

2. **`plan/TASKS.md`**:
   - Locate the specific Task ID (e.g., `TSK-D1-01`).
   - If starting: transition status from `[ ] TODO` to `[~] IN_PROGRESS` and note timestamp.
   - If finished: transition status to `[x] DONE`, fill in `Completed Date`, `Validation Evidence`, and `Git/File Ref`.
   - If new work is identified, add a new granular task with proper ID and owner.

3. **`plan/CHANGELOG.md`**:
   - Append an entry under `[Unreleased]` or the active version.
   - Use standard categories: `Added`, `Changed`, `Fixed`, `Security`, `Planning`.
   - Specify the exact files touched, the corresponding Task ID, and a concise rationale.

4. **Specialized Plan Updates (When Triggered)**:
   - **`plan/ARCHITECTURE.md`**: Update whenever API schemas, database tables, edge pipelines, models, or service boundaries are modified.
   - **`plan/ROADMAP.md`**: Update whenever timeline, milestone deliverables, exit criteria, or phase scopes shift.
   - **`plan/STANDARDS.md`**: Update whenever new quality gates, linting rules, or security boundaries are defined.

---

## 3. Mandatory Execution Flow

Before starting ANY task:
```
1. READ plan/STATE.md & plan/TASKS.md
   ↓
2. CONFIRM active Task ID and requirements
   ↓
3. MARK task as IN_PROGRESS in plan/TASKS.md
   ↓
4. IMPLEMENT code / configuration / documentation
   ↓
5. VERIFY implementation with tests, runs, or checks
   ↓
6. UPDATE plan/TASKS.md (Mark DONE + record validation evidence)
   ↓
7. UPDATE plan/STATE.md (Progress metrics & active state)
   ↓
8. RECORD change in plan/CHANGELOG.md
   ↓
9. (If architectural) UPDATE plan/ARCHITECTURE.md
```

---

## 4. Anti-Patterns (STRICTLY PROHIBITED)

- ❌ **Silent Code Changes:** Writing code without linking to or creating a task in `plan/TASKS.md`.
- ❌ **Stale State:** Leaving `plan/STATE.md` untouched while project features advance.
- ❌ **Unverified Completion:** Marking a task `[x] DONE` without providing real validation evidence in `plan/TASKS.md`.
- ❌ **Scope Creep:** Implementing features not defined in the PRD (`DrishtiFlow_Enhanced_PRD_v3_EMPTY.md`) or `plan/ROADMAP.md` without planning review.
- ❌ **Post-hoc Record Keeping:** Waiting until the end of a long multi-step session to update planning files. Updates must happen continuously with each unit of change.

---

## 5. Verification Checklist for Agents

At the end of every response or tool execution cycle that touched repository files, verify:
- [ ] Was `plan/TASKS.md` updated?
- [ ] Was `plan/STATE.md` updated?
- [ ] Was `plan/CHANGELOG.md` updated?
- [ ] Were any architectural or roadmap impacts documented in `plan/ARCHITECTURE.md` or `plan/ROADMAP.md`?

*Failure to update the `plan/` directory renders the turn incomplete.*

