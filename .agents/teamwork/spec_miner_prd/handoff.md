# Specification Mining Handoff Report: PRD & Planning Alignment

**Agent:** `spec_miner_prd`  
**Date:** 2026-11-04  
**Target Milestone:** Milestone R0 (Hackathon Prototype)  
**Deliverable Path:** `d:\hackathon\Build with Bharat\.agents\teamwork\spec_miner_prd\analysis.md`

---

## 1. Observation

Direct observations and evidence gathered during specification mining:

1. **Test Suite Execution:**
   - Ran command: `pytest services/api/tests/ services/edge-agent/tests/ -v`
   - Outcome: `1 failed, 11 passed in 4.71s`
   - Verbatim failure:
     ```
     FAILED services/api/tests/test_e2e_pipeline.py::test_full_drishtiflow_e2e_pipeline
     assert candidate_data["policy_allowed"] is True
     E assert False is True
     services\api\tests\test_e2e_pipeline.py:88: AssertionError
     ```

2. **Policy Rate Limiter Implementation in `services/api/app/services/policy.py:90-98`:**
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

3. **Database Records in `services/api/drishtiflow.db`:**
   - Evaluated records via sqlite3 query:
     - Total `actions` rows: 5
     - `created_at` timestamp format: `'2026-11-04T14:04:37.062187+00:00'`
     - SQLite `datetime('now', '-1 hour')` format: `'2026-11-04 13:04:37'`
     - Most recent incident reason logged:
       `"Verified person clearly present inside restricted perimeter bay during monitored schedule. (Suppressed by Rate Limit: Reached 5/5 actions per hour.)"`

4. **Frontend Build Verification:**
   - Ran command: `npm --prefix apps/web run build`
   - Outcome: `Exit code 0`
   - Output: `Next.js 14.2.35 ... Compiled successfully ... First Load JS: 100 kB`.

5. **Discrepancy in `plan/STATE.md` and `plan/CHANGELOG.md`:**
   - `plan/STATE.md` lines 5, 20: *"Overall System Health: 🟢 GREEN (All 27 tasks complete, 12/12 tests passing)"*, *"12/12 unit & integration tests passing (0.68s E2E)"*.
   - `plan/CHANGELOG.md` line 45: *"12/12 pytest unit and integration tests passing cleanly in 4.36s."*
   - Fact: Running `pytest` currently yields 11/12 passing due to test failure in `test_e2e_pipeline.py`.

6. **Missing PRD Endpoints in `services/api/app/routers/`:**
   - PRD §9 specifies `POST /api/v1/workflows/{id}/versions` ("Create a new version").
   - `services/api/app/routers/workflows.py` does not define `POST /{workflow_id}/versions`. Only `POST /api/v1/workflows` exists (setting active_version = 1).
   - PRD §6.2 FR-W-08 requires server-side validation before activating a workflow; `services/api/app/routers/workflows.py:119-134` executes `UPDATE workflows SET status = 'active'` without validating workflow definition completeness or zone assignment.

---

## 2. Logic Chain

1. From Observation 1, `test_full_drishtiflow_e2e_pipeline` fails because `candidate_data["policy_allowed"]` returns `False` instead of `True`.
2. From Observation 3, the reason stored in the incident row is `"(Suppressed by Rate Limit: Reached 5/5 actions per hour.)"`.
3. From Observation 2, `PolicyEngine.evaluate` queries SQLite with `created_at >= datetime('now', '-1 hour')`.
4. From Observation 3, `created_at` contains an ISO-8601 `'T'` separator (ASCII 84), whereas `datetime('now', '-1 hour')` contains a space separator `' '` (ASCII 32). In string comparison, `'2026-11-04T...' >= '2026-11-04 ...'` evaluates to `True` for every timestamp on the current day, regardless of actual hour difference.
5. Because 5 actions had accumulated in `services/api/drishtiflow.db` across previous runs, `actions_last_hour` returned 5 (matching `max_actions_per_hour = 5`), causing all future candidate events to be permanently rejected by the policy engine.
6. From Observation 5, `plan/STATE.md` and `plan/CHANGELOG.md` claim 12/12 tests pass. That was true only on the initial test run when fewer than 5 action records existed. As soon as the test suite was rerun, cumulative state tripped the bug.
7. Therefore, `TSK-D5-01` and `TSK-D6-01` cannot be considered cleanly verified until the rate-limit timestamp comparison is corrected and tests are executed against an isolated or reset test database.
8. Furthermore, PRD §9 specifies `POST /api/v1/workflows/{id}/versions` and PRD §6.2 FR-W-08 mandates server-side workflow pre-activation validation, both of which are omitted in `services/api/app/routers/workflows.py`.

---

## 3. Caveats

1. **Hardware-Specific Inference (WebGPU vs Simulation):**
   - In `apps/web/src/components/camera/CameraPreview.tsx`, edge detection is currently performed via animated warehouse simulation canvas with ray-casting point-in-polygon math, while the standalone Python edge agent in `services/edge-agent/` performs Python-based detection and dwell tracking. Full ONNX Runtime Web WebGPU execution in the browser was not loaded with a live model weights file, though it fully simulates the PRD candidate event contract for the hackathon demo.
2. **Third-Party Live Notification Accounts:**
   - Live external dispatch to WhatsApp Cloud API and Vapi Voice depends on user-supplied API keys and verified destination phone numbers. In default mock mode, the system correctly falls back to sandbox references (`sandbox-wa-*`, `sandbox-vapi-*`) without raising unhandled errors.

---

## 4. Conclusion

1. **Overall Alignment:**
   The codebase implements the vast majority of PRD v3.0 requirements for Milestone R0 (vernacular Hindi/English compiler with strict schemas, camera onboarding, polygon zone drawing with ray-casting PIP, 1.5s dwell tracking, 5-state contextual verification with mock fallback, deterministic cooldowns, SHA-256 action idempotency, Next.js 14 frontend, and 4 Bharat presets).
2. **Critical Defect Requiring Fix:**
   - **`services/api/app/services/policy.py:92`**: The rate-limit query uses ASCII string comparison (`created_at >= datetime('now', '-1 hour')`) that fails on ISO-8601 strings once 5 actions exist in the database.
   - **`test_full_drishtiflow_e2e_pipeline.py`** currently fails due to this defect.
3. **Missing Minor Specifications:**
   - `POST /api/v1/workflows/{id}/versions` needs to be implemented in `services/api/app/routers/workflows.py` to satisfy PRD §9.
   - `POST /api/v1/workflows/{id}/activate` should validate workflow completeness before activation per PRD §6.2 FR-W-08.
   - Unit tests need an isolated test database fixture to prevent cross-run pollution.

---

## 5. Verification Method

To independently verify these findings:

1. **Run Pytest Suite to Reproduce Failure:**
   ```powershell
   pytest services/api/tests/test_e2e_pipeline.py -v
   ```
   *Expected result:* Fails on `assert candidate_data["policy_allowed"] is True` due to Rate Limit suppression.

2. **Inspect Cumulative Database Actions:**
   ```powershell
   python -c "import sqlite3; conn = sqlite3.connect('services/api/drishtiflow.db'); print('Total actions:', conn.cursor().execute('SELECT COUNT(1) FROM actions').fetchone()[0])"
   ```
   *Expected result:* Value is ≥ 5, causing rate limiter to trigger.

3. **Verify Frontend Build:**
   ```powershell
   npm --prefix apps/web run build
   ```
   *Expected result:* Next.js build succeeds with 0 errors and 100 kB First Load JS.

4. **Verify Analysis Report:**
   Inspect `d:\hackathon\Build with Bharat\.agents\teamwork\spec_miner_prd\analysis.md` for exhaustive feature mapping tables and edge cases.
