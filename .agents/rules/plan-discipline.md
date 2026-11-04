# Rule: Plan Discipline and Continuous Synchronization

**File Scope:** Workspace-wide (`**/*`)  
**Trigger:** Always Active (`always_on`)

---

## Directive

Every agent turn modifying any codebase file (source code, configuration, scripts, schemas, tests, documentation) **MUST** synchronize state with the `plan/` directory:

1. **`plan/STATE.md`**: Must be kept up-to-date with active task status, phase completion percentage, and latest actions.
2. **`plan/TASKS.md`**: Must mark the corresponding task as `[~] IN_PROGRESS` upon initiation and `[x] DONE` upon verified completion.
3. **`plan/CHANGELOG.md`**: Must log every set of modifications with date, files touched, and description.
4. **`plan/ARCHITECTURE.md`**: Must be updated whenever system designs, schemas, APIs, or data flows change.
5. **`plan/ROADMAP.md`**: Must be updated if milestone objectives, deadlines, or release targets change.

### Verification Guardrail
Never conclude a coding task without confirming that:
- Code compiles / tests pass.
- `plan/` files reflect the new reality.
- Validation evidence is recorded in `plan/TASKS.md`.

