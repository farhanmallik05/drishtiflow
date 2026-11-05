# Handoff Report: DrishtiFlow Backend & Edge Agent Exploration

**Agent:** Teamwork Explorer (`explorer_backend`)  
**Working Directory:** `d:\hackathon\Build with Bharat\.agents\teamwork\explorer_backend`  
**Handoff Type:** Hard  
**Target Codebases:** `services/api/` and `services/edge-agent/`  
**Date:** 2026-11-04  

---

## 1. Observation

### 1.1 Test Suite Execution Outcomes
1. **Edge Agent Tests (`services/edge-agent/tests/`)**:
   - Command: `$env:PYTHONPATH="services/edge-agent"; python -m pytest services/edge-agent/tests/ -v`
   - Result: **4 passed in 0.27s (Exit code 0)**.
   - Tests:
     - `test_stream_ingest`: PASSED
     - `test_ray_casting_point_in_polygon`: PASSED
     - `test_edge_detector_zone_evaluation`: PASSED
     - `test_dwell_persistence`: PASSED

2. **API Tests (`services/api/tests/`)**:
   - Command: `$env:PYTHONPATH="services/api"; python -m pytest services/api/tests/ -v`
   - Result: **7 passed, 1 failed in 4.76s (Exit code 1)**.
   - Tests:
     - `test_compiler.py::test_vernacular_compile_hindi_prompt`: PASSED
     - `test_compiler.py::test_vernacular_compile_english_prompt`: PASSED
     - `test_e2e_pipeline.py::test_full_drishtiflow_e2e_pipeline`: **FAILED**
     - `test_evaluation_harness.py::test_evaluation_benchmark`: PASSED
     - `test_health.py::test_health_check`: PASSED
     - `test_health.py::test_ready_check`: PASSED
     - `test_policy_and_events.py::test_candidate_event_lifecycle`: PASSED
     - `test_policy_and_events.py::test_action_test_endpoint`: PASSED

3. **Verbatim Failure in `test_full_drishtiflow_e2e_pipeline`**:
   - File: `services/api/tests/test_e2e_pipeline.py:88`
   - Verbatim Assertion Error:
     ```python
     candidate_res = client.post("/api/v1/events/candidates", json=event_payload)
     assert candidate_res.status_code == 201
     candidate_data = candidate_res.json()
     incident_id = candidate_data["incident_id"]
     assert candidate_data["verifier_decision"] == "confirmed"
     > assert candidate_data["policy_allowed"] is True
     E assert False is True
     ```
   - Actual payload response inspected:
     ```json
     {
       "incident_id": "01c2674b-8e60-4aff-9df1-5009818fc022",
       "camera_name": "Edge Camera",
       "status": "confirmed",
       "detector_confidence": 0.9,
       "verifier_decision": "confirmed",
       "verifier_confidence": 0.92,
       "policy_allowed": false,
       "policy_reason": "Suppressed by Rate Limit: Reached 5/5 actions per hour.",
       "dispatched_actions": [],
       "occurred_at": "2026-11-04T14:00:00Z"
     }
     ```

### 1.2 Code Patterns Directly Observed
1. **Unscoped Global Rate Limit Check in `services/api/app/services/policy.py:89-98`**:
   ```python
   # 4. Hourly Rate Limit Check
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
   In contrast, Step 3 (cooldown check at line 72) properly filters by `camera_id = ?`:
   ```python
   SELECT occurred_at FROM incidents
   WHERE camera_id = ? AND status in ('action_sent', 'confirmed') AND id != ?
   ```
2. **Shared Disk Database in `services/api/app/database.py:8`**:
   ```python
   DB_PATH = os.path.join(os.path.dirname(__file__), "..", "drishtiflow.db")
   ```
   Both the production/dev API and pytest test runs share and mutate this same file without test isolation.
3. **Database State in `actions` Table**:
   Inspected rows in `drishtiflow.db` via sqlite3: exactly 5 actions exist within the last 60 minutes across three different cameras and mock test endpoint `test-incident-demo`.
4. **Stubbed Cloud VLM Provider in `services/api/app/services/verifier.py:63-72`**:
   ```python
   # 2. Live Cloud VLM Provider (Gemini / Groq)
   try:
       return VerificationResult(
           decision="confirmed",
           event_type=event_type,
           confidence=0.91,
           evidence_summary="Person observed within the configured zone coordinates.",
           ...
           model_version="gemini-1.5-flash"
       )
   ```
   No network call to Gemini or Groq vision endpoints is executed.
5. **Compiler Provider Mismatch in `services/api/app/services/compiler.py:146`**:
   ```python
   if settings.WORKFLOW_COMPILER_API_KEY and settings.WORKFLOW_COMPILER_PROVIDER == "groq":
   ```
   `config.py` sets `WORKFLOW_COMPILER_PROVIDER = "gemini"`, but `compiler.py` only has a `"groq"` branch; `"gemini"` falls back directly to the rule-based compiler.

---

## 2. Logic Chain

1. **Premise 1 (Observation 1.1.2 & 1.1.3)**: `test_e2e_pipeline.py` fails specifically because `candidate_data["policy_allowed"]` evaluates to `False`, returning `policy_reason = "Suppressed by Rate Limit: Reached 5/5 actions per hour."`.
2. **Premise 2 (Observation 1.2.1)**: `PolicyEngine.evaluate` queries `COUNT(*) FROM actions WHERE status in ('sent', 'delivered') AND created_at >= datetime('now', '-1 hour')`. This query does not filter by `camera_id` or `workflow_id`.
3. **Premise 3 (Observation 1.2.2 & 1.2.3)**: Because `drishtiflow.db` is shared across test suites and previous test runs (`test_policy_and_events.py`, `/api/v1/actions/test`), 5 actions accumulated within the 1-hour window.
4. **Inference**: When `test_full_drishtiflow_e2e_pipeline` registers a new camera and workflow, the global action count is already `>= 5`. The policy engine suppresses the new incident's actions as a rate-limit breach, setting `policy_allowed = False` and `status = "confirmed"` instead of dispatching the action.
5. **Deduction**: The failure is caused by an unscoped rate-limit query in `services/api/app/services/policy.py` exacerbated by the lack of test database isolation.

---

## 3. Caveats

1. **Read-Only Investigation Constraint**: In accordance with the Explorer role instructions, no source files or tests were modified during this investigation.
2. **Live Cloud API Keys**: External API keys (`WORKFLOW_COMPILER_API_KEY`, `VISION_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `VAPI_API_KEY`) were not configured in `.env`, so live cloud provider paths (Groq, Gemini, WhatsApp Meta Graph, Vapi) were tested via their deterministic mock/sandbox paths.
3. **Frontend Not Executed Here**: Investigation was strictly scoped to backend (`services/api/`) and edge agent (`services/edge-agent/`). Frontend build in `apps/web/` is covered by peer workstreams.

---

## 4. Conclusion

1. **Edge Agent (`services/edge-agent`)**: Fully operational. All 4 tests pass with zero errors. Zone intersection, feet-based detection filtering, and dwell persistence are properly implemented.
2. **Backend API (`services/api`)**: High architectural alignment with PRD §6, §7, and §8. 7 out of 8 tests pass.
3. **Gaps to Address for 100% Pass**:
   - **Critical Fix**: Update `PolicyEngine.evaluate` in `services/api/app/services/policy.py` to scope the hourly rate limit to `camera_id` (by joining `incidents` table) or `workflow_id`.
   - **Test Isolation**: Add a pytest fixture in `services/api/tests/` to isolate or clear test action rows before testing `test_e2e_pipeline.py`.
   - **Documentation Sync**: `plan/STATE.md` and `plan/TASKS.md` should reflect this test result until the fix is committed.

---

## 5. Verification Method

### How to Independently Verify the Reported Findings:
1. **Verify Edge Agent Test Suite**:
   ```powershell
   $env:PYTHONPATH="services/edge-agent"
   python -m pytest services/edge-agent/tests/ -v
   ```
   *Expected Outcome*: 4 passed in ~0.27s.

2. **Reproduce the API Test Suite Failure**:
   ```powershell
   $env:PYTHONPATH="services/api"
   python -m pytest services/api/tests/ -v
   ```
   *Expected Outcome*: 7 passed, 1 failed (`test_e2e_pipeline.py::test_full_drishtiflow_e2e_pipeline` at line 88 with `assert False is True`).

3. **Verify Rate Limit Reason Directly**:
   ```powershell
   python -c "from services.api.app.main import app; from fastapi.testclient import TestClient; c = TestClient(app); res = c.post('/api/v1/events/candidates', json={'event_id':'probe','camera_id':'test-cam-01','workflow_id':None,'event_type':'restricted_zone_entry','occurred_at':'2026-11-04T14:00:00Z','source':'sample','detector':{'name':'yolov8n','version':'8.1.0','confidence':0.9,'bounding_box':{'x_min':0.1,'y_min':0.1,'x_max':0.5,'y_max':0.5}}}); print(res.json()['policy_reason'])"
   ```
   *Expected Outcome*: Outputs `"Suppressed by Rate Limit: Reached 5/5 actions per hour."`.

4. **Invalidation Condition**:
   If `policy.py` lines 90–98 are changed to scope by `camera_id` (or if actions created in the last hour are deleted from `drishtiflow.db`), `test_full_drishtiflow_e2e_pipeline` will immediately pass.
