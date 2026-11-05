# Technical Analysis: DrishtiFlow Backend & Edge Agent

**Date:** 2026-11-04  
**Investigator:** Teamwork Explorer (Backend & Edge Agent)  
**Target Codebases:** `services/api/` and `services/edge-agent/`  
**Governing Documents:** PRD v3 (`DrishtiFlow_Enhanced_PRD_v3_EMPTY.md`), `plan/STATE.md`, `plan/TASKS.md`

---

## 1. Executive Summary

A comprehensive, read-only technical audit and test suite execution were conducted across `services/api/` (FastAPI backend) and `services/edge-agent/` (Python edge simulation daemon).

### Key Test Outcomes:
- **`services/edge-agent/tests/`**: **4 passed, 0 failed (100% pass)** in 0.27s. Stream ingestion, ray-casting point-in-polygon math, bottom-center feet zone evaluation, and dwell time persistence meet all specifications.
- **`services/api/tests/`**: **7 passed, 1 failed (87.5% pass)** in 4.76s.
  - `test_compiler.py`: 2 passed (Vernacular Hindi/English prompt compilation).
  - `test_health.py`: 2 passed (`/api/v1/health` and `/api/v1/ready`).
  - `test_policy_and_events.py`: 2 passed (`test_candidate_event_lifecycle` and `test_action_test_endpoint`).
  - `test_evaluation_harness.py`: 1 passed (10 synthetic benchmark samples evaluated with 100% precision & recall).
  - **`test_e2e_pipeline.py::test_full_drishtiflow_e2e_pipeline`**: **FAILED** (`AssertionError: assert False is True` at line 88 on `assert candidate_data["policy_allowed"] is True`).

### Root Cause of Test Failure:
In `services/api/app/services/policy.py` (lines 90–98), the hourly action rate-limit query executes:
```sql
SELECT COUNT(*) as count FROM actions
WHERE status in ('sent', 'delivered') AND created_at >= datetime('now', '-1 hour')
```
This query counts **all actions globally across the entire database** rather than scoping to the specific camera (`camera_id`) or workflow (`workflow_id`). Because prior tests or developer operations had recorded 5 actions in the SQLite database (`drishtiflow.db`), the policy engine suppressed subsequent candidate actions with `"Suppressed by Rate Limit: Reached 5/5 actions per hour."`. Compounding this, the test suite executes directly against the production/dev SQLite file without test isolation or teardown fixtures.

---

## 2. Test Execution Details

### 2.1 Edge Agent Test Suite (`services/edge-agent/tests/`)
- **Command:** `$env:PYTHONPATH="services/edge-agent"; python -m pytest services/edge-agent/tests/ -v`
- **Output:**
```text
============================= test session starts =============================
platform win32 -- Python 3.13.14, pytest-9.0.3, pluggy-1.6.0
collected 4 items

services/edge-agent/tests/test_edge_agent.py::test_stream_ingest PASSED  [ 25%]
services/edge-agent/tests/test_edge_agent.py::test_ray_casting_point_in_polygon PASSED [ 50%]
services/edge-agent/tests/test_edge_agent.py::test_edge_detector_zone_evaluation PASSED [ 75%]
services/edge-agent/tests/test_edge_agent.py::test_dwell_persistence PASSED [100%]

============================== 4 passed in 0.27s ==============================
```

### 2.2 API Test Suite (`services/api/tests/`)
- **Command:** `$env:PYTHONPATH="services/api"; python -m pytest services/api/tests/ -v`
- **Output:**
```text
============================= test session starts =============================
platform win32 -- Python 3.13.14, pytest-9.0.3, pluggy-1.6.0
collected 8 items

services/api/tests/test_compiler.py::test_vernacular_compile_hindi_prompt PASSED [ 12%]
services/api/tests/test_compiler.py::test_vernacular_compile_english_prompt PASSED [ 25%]
services/api/tests/test_e2e_pipeline.py::test_full_drishtiflow_e2e_pipeline FAILED [ 37%]
services/api/tests/test_evaluation_harness.py::test_evaluation_benchmark PASSED [ 50%]
services/api/tests/test_health.py::test_health_check PASSED              [ 62%]
services/api/tests/test_health.py::test_ready_check PASSED               [ 75%]
services/api/tests/test_policy_and_events.py::test_candidate_event_lifecycle PASSED [ 87%]
services/api/tests/test_policy_and_events.py::test_action_test_endpoint PASSED [100%]

================================== FAILURES ===================================
_____________________ test_full_drishtiflow_e2e_pipeline ______________________
    candidate_res = client.post("/api/v1/events/candidates", json=event_payload)
    assert candidate_res.status_code == 201
    candidate_data = candidate_res.json()
    incident_id = candidate_data["incident_id"]
    assert candidate_data["verifier_decision"] == "confirmed"
>   assert candidate_data["policy_allowed"] is True
E   assert False is True

services\api\tests\test_e2e_pipeline.py:88: AssertionError
```

### 2.3 Discrepancy with Plan Documentation
`plan/STATE.md` (lines 5, 20) and `plan/TASKS.md` (task `TSK-D6-01`, line 224) record:
> "12/12 unit & integration tests passing (0.68s E2E)"
The measured reality is **11 passing, 1 failing** when run against the persistent `drishtiflow.db`.

---

## 3. Deep Architectural & Codebase Inspection

### 3.1 FastAPI Application Layer (`services/api/app/`)

#### 3.1.1 Entry Point & Configuration (`main.py`, `config.py`)
- `main.py`:
  - Calls `init_db()` upon startup.
  - Configures CORS middleware (`allow_origins=["*"]`).
  - Mounts 6 routers: `health`, `workflows`, `cameras`, `events`, `incidents`, `actions`.
- `config.py`:
  - Reads environment variables with fallbacks.
  - Default `DATABASE_URL`: `sqlite:///./drishtiflow.db`.
  - Default `VISION_PROVIDER`: `"mock"`.
  - Default `WORKFLOW_COMPILER_PROVIDER`: `"gemini"`.

#### 3.1.2 Database Foundation (`database.py`)
- Implements SQLite database connection using standard library `sqlite3` with `Row` factory.
- Defines tables aligning with PRD §8 SQL Foundation:
  - `organizations`, `sites`, `cameras`, `zones`, `workflows`, `workflow_versions`, `incidents`, `actions`, `feedback`.
- On empty database, auto-seeds default organization ("Bharat Logistics Godown #4"), site ("Bhiwandi Central Warehouse"), sample camera, and sample zone polygon.
- **Architectural Observation:** Hardcoded relative file path `os.path.join(os.path.dirname(__file__), "..", "drishtiflow.db")` without environment override hook for test databases.

#### 3.1.3 Vernacular Compiler Service (`services/compiler.py`)
- `rule_based_compile()`:
  - Regex-based keyword extraction for Hindi, Hinglish, and English.
  - Correctly parses night time expressions: `"raat 10 baje"`, `"after 10pm"` -> `start="22:00"`, `end="06:00"`, timezone `"Asia/Kolkata"`.
  - Maps domain terminology: `"godown"` -> warehouse intrusion rule; `"gadi"`/`"car"` -> vehicle class; `"whatsapp"` -> `whatsapp_message` action; `"call"`/`"awaz"` -> `voice_call` action.
  - Outputs Pydantic-compliant `WorkflowDefinition` with `status="needs_review"` and clarification questions.
- `compile_prompt()`:
  - Handles external LLM call if `settings.WORKFLOW_COMPILER_API_KEY` is present AND `settings.WORKFLOW_COMPILER_PROVIDER == "groq"`.
  - **Gap Detected:** In `config.py`, `WORKFLOW_COMPILER_PROVIDER` defaults to `"gemini"`. However, `compile_prompt()` has no Gemini SDK/HTTP handling; it only checks for `"groq"`. Thus, when set to `"gemini"`, it silently falls back to `rule_based_compile`.

#### 3.1.4 Context Verifier Service (`services/verifier.py`)
- `verify_context()` adheres to PRD §6.5 contract with 5-state output (`confirmed`, `not_confirmed`, `uncertain`, `needs_human_review`, `processing_failed`).
- In offline/mock mode (`VISION_PROVIDER == "mock"` or no API key):
  - Calibrated thresholding: `detector_confidence >= 0.75` -> `confirmed`; `>= 0.45` -> `uncertain` (with `requires_human_review=True`); `< 0.45` -> `not_confirmed`.
  - Simulates 300ms VLM latency via `asyncio.sleep(0.3)`.
- **Stub Detected:** Lines 58–72 for Live Cloud VLM Provider do not make any network request to Google Gemini Vision or Groq Vision; it simply returns a static hardcoded `VerificationResult(decision="confirmed", model_version="gemini-1.5-flash")`.

#### 3.1.5 Deterministic Policy Engine (`services/policy.py`)
- Enforces four distinct safety gates:
  1. **Decision Gate:** Verifier decision must be `"confirmed"`.
  2. **Schedule Gate:** Verifies current time against `schedule.start` and `schedule.end` in `schedule.timezone` (`Asia/Kolkata`), handling overnight rollover (e.g., 22:00 to 06:00).
  3. **Cooldown Suppression Check:**
     ```sql
     SELECT occurred_at FROM incidents
     WHERE camera_id = ? AND status in ('action_sent', 'confirmed') AND id != ?
     ORDER BY occurred_at DESC LIMIT 1
     ```
     Correctly scopes cooldown suppression to `camera_id` within `cooldown_seconds` (default 60s).
  4. **Hourly Rate Limit Check:**
     ```sql
     SELECT COUNT(*) as count FROM actions
     WHERE status in ('sent', 'delivered') AND created_at >= datetime('now', '-1 hour')
     ```
     **Flaw:** Does NOT join `incidents` or filter by `camera_id = ?` or `workflow_id = ?`. Counts all global actions in the entire database.

#### 3.1.6 Action Dispatcher (`services/action_dispatcher.py`)
- Idempotency implementation: SHA-256 hash over `{incident_id}:{action_type}:{recipient}`.
- If existing action found with matching idempotency key, skips dispatch and returns existing record.
- Adapters supported:
  - `dashboard_alert`: Delivered immediately via internal websocket reference.
  - `whatsapp_message`: Live Meta Cloud API call if token exists; fallback to verified sandbox mode (`sandbox-wa-...`).
  - `voice_call`: Live Vapi API call (`https://api.vapi.ai/call`) if credentials configured; fallback to sandbox mode (`sandbox-vapi-...`).
  - `local_siren`: Delivered to local audio speaker reference.

---

### 3.2 Edge Agent Subsystem (`services/edge-agent/`)

#### 3.2.1 Stream Ingestion (`ingest/stream.py`)
- `StreamIngestion` manages stream connection state and frame metadata timestamps.
- Simulates frame decoding metadata (`camera_id`, `timestamp`, `resolution: (640, 360)`, `frame_id`).
- Implements clean `connect()`, `read_frame()`, and `disconnect()` lifecycle.

#### 3.2.2 Inference & Geometric Zone Intersection (`inference/detector.py`)
- `is_point_in_polygon(point, polygon)`: Standard Ray-casting algorithm handling normalized coordinate vertices `[0.0, 1.0]`.
- `EdgeDetector.evaluate_detections_in_zone()`:
  - Evaluates person bounding boxes.
  - Uses the **bottom-center (feet)** coordinate:
    ```python
    feet_point = (
        (bbox.get("x_min", 0.0) + bbox.get("x_max", 0.0)) / 2.0,
        bbox.get("y_max", 0.0)
    )
    ```
  - This accurately models ground-plane intrusion and avoids false triggers caused by torso overlap when walking outside the perimeter fence.

#### 3.2.3 Dwell Time Tracking (`tracking/tracker.py`)
- `DwellTracker` records initial timestamp per `object_id`.
- Requires continuous persistence in the zone for `dwell_duration >= required_dwell_seconds` (default 1.5s) before returning `True`.
- Effectively prevents boundary flicker and transient sensor noise from triggering candidate events.

#### 3.2.4 Candidate Event Emitter (`events/emitter.py`)
- Dispatches signed candidate envelopes to `/api/v1/events/candidates`.
- Formats detector metadata, bounding box coordinates, and ISO 8601 UTC timestamps.

---

## 4. Detailed Gap & Vulnerability Analysis

| ID | Location | Severity | Description | Impact |
|---|---|:---:|---|---|
| **GAP-01** | `services/api/app/services/policy.py:90-98` | **High** | Hourly rate-limit query is global across all cameras and workflows rather than scoped to the specific camera or workflow. | Blocks candidate alerts across all cameras once 5 actions occur anywhere in 1 hour; causes `test_full_drishtiflow_e2e_pipeline` to fail. |
| **GAP-02** | `services/api/tests/` | **High** | Absence of test database isolation; tests share and mutate persistent `services/api/drishtiflow.db`. | Running tests pollutes real database; prior test runs cause rate-limit thresholds to persist across test executions. |
| **GAP-03** | `services/api/app/services/verifier.py:58-72` | **Medium** | Cloud VLM Provider branch is stubbed; returns static response without invoking Gemini/Groq vision API. | Cloud vision verification is non-functional if API keys are configured; operates only as mock. |
| **GAP-04** | `services/api/app/services/compiler.py:146-166` | **Low** | LLM compiler only has Groq branch; missing Gemini integration even though `WORKFLOW_COMPILER_PROVIDER` defaults to `"gemini"`. | Gemini provider config is ignored; falls back directly to rule-based compiler. |
| **GAP-05** | `services/api/app/services/policy.py:92` | **Low** | SQLite `datetime('now', '-1 hour')` formats date with space (`YYYY-MM-DD HH:MM:SS`) while Python stores ISO with `'T'`. | String comparison of ISO timestamps with `'T'` against SQLite standard space-separated datetime can have subtle lexicographical edge cases across date boundaries. |

---

## 5. Recommended Concrete Fixes

### 5.1 Fix for Rate Limit Scoping in `policy.py`

In `services/api/app/services/policy.py`, replace lines 90–98 with:

```python
        # 4. Hourly Rate Limit Check (scoped to current camera)
        cursor.execute(
            """
            SELECT COUNT(*) as count FROM actions a
            JOIN incidents i ON a.incident_id = i.id
            WHERE i.camera_id = ? AND a.status in ('sent', 'delivered')
            AND a.created_at >= strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')
            """,
            (camera_id,)
        )
        actions_last_hour = cursor.fetchone()["count"]
        if actions_last_hour >= max_per_hour:
            conn.close()
            return False, f"Suppressed by Rate Limit: Reached {actions_last_hour}/{max_per_hour} actions per hour for this camera.", []
```

### 5.2 Fix for Test Isolation in `services/api/tests/`

In `services/api/tests/` or in a new `conftest.py`, configure a database cleanup or isolation fixture:

```python
import pytest
from services.api.app.database import get_db

@pytest.fixture(autouse=True)
def clean_test_actions():
    """Ensure rate-limiting actions table does not leak across test runs."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM actions WHERE incident_id = 'test-incident-demo' OR incident_id LIKE '%test%'")
    conn.commit()
    conn.close()
```
Or use a separate SQLite test database path overridden via `os.environ["DATABASE_URL"]`.

---

## 6. Synthesis & Status Summary

1. **Edge Agent (`services/edge-agent`)**: Solid, 100% passing tests, well-engineered geometric algorithms and dwell filtering.
2. **Backend API (`services/api`)**: High-quality architecture matching PRD §6, §7, and §8 contracts. Full vernacular compiler, idempotent dispatcher, and camera/zone CRUD operational.
3. **Current Blocker**: Exactly 1 test failing (`test_full_drishtiflow_e2e_pipeline`) due to unscoped global hourly rate limiting in `policy.py` coupled with unisolated SQLite test state.
