# Empirical Challenge Handoff: Policy Rate Limiting & Cooldown Engine

**Agent:** `challenger_stress`  
**Working Directory:** `d:\hackathon\Build with Bharat\.agents\teamwork\challenger_stress`  
**Handoff Type:** Hard (Task Complete)  
**Date:** 2026-11-04  
**Verdict:** **CONFIRMED**

---

## 1. Observation

### 1.1 Implementation Inspected
1. **`services/api/app/services/policy.py:68-87` (Cooldown Suppression)**:
   ```python
   cursor.execute(
       """
       SELECT occurred_at FROM incidents
       WHERE camera_id = ? AND status in ('action_sent', 'confirmed') AND id != ?
       ORDER BY occurred_at DESC LIMIT 1
       """,
       (camera_id, incident_id)
   )
   last_incident = cursor.fetchone()
   if last_incident:
       try:
           last_time = datetime.fromisoformat(last_incident["occurred_at"])
           delta = (datetime.now(timezone.utc) - last_time.replace(tzinfo=timezone.utc)).total_seconds()
           if delta < cooldown_seconds:
               conn.close()
               return False, f"Suppressed by Cooldown: {int(delta)}s since previous incident (< {cooldown_seconds}s limit).", []
       except Exception:
           pass
   ```
2. **`services/api/app/services/policy.py:88-103` (Hourly Rate Limiter)**:
   ```python
   cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
   cursor.execute(
       """
       SELECT COUNT(*) as count FROM actions a
       JOIN incidents i ON a.incident_id = i.id
       WHERE i.camera_id = ? AND a.status in ('sent', 'delivered') AND a.created_at >= ?
       """,
       (camera_id, cutoff)
   )
   actions_last_hour = cursor.fetchone()["count"]
   if actions_last_hour >= max_per_hour:
       conn.close()
       return False, f"Suppressed by Rate Limit: Reached {actions_last_hour}/{max_per_hour} actions per hour.", []
   ```

### 1.2 Empirical Stress Test Suite (`services/api/tests/test_policy_stress.py`)
To empirically challenge and verify the four core requirements from dispatch, an 8-test suite was authored and executed directly against `services/api`:
- `test_cooldown_rapid_sequential_events_suppressed`: Emits two events within 0s delta for Camera A. Asserts event 1 allowed (`status="action_sent"`), event 2 blocked (`"Suppressed by Cooldown"`), and Camera B allowed.
- `test_cooldown_expired_allows_subsequent_event`: Seeds an incident from 65s ago. Asserts event at T+65s is allowed.
- `test_cooldown_unconfirmed_prior_incident_does_not_suppress`: Seeds prior incident with status `'not_confirmed'` (e.g. animal/false alarm rejected by VLM). Asserts subsequent confirmed event is NOT suppressed.
- `test_rate_limiting_per_camera_isolation`: Seeds 5 actions for Camera A in last 30 minutes. Asserts Camera A is blocked (`"Suppressed by Rate Limit: Reached 5/5 actions per hour"`), Camera B is allowed (`actions_last_hour == 0`), Camera B can execute 4 actions, and only upon reaching 5 actions is Camera B also blocked.
- `test_rate_limit_ignores_failed_or_queued_actions`: Seeds 5 `'failed'` and 5 `'queued'` actions. Asserts policy allowed is `True` (only `'sent'` and `'delivered'` count).
- `test_expired_actions_do_not_block_new_actions`: Seeds 7 expired actions at 61m, 65m, 90m, 2h, 5h, 24h, and 7d ago. Asserts policy allowed is `True` (0 actions in window).
- `test_rate_limit_precise_boundary_cutoff`: Tests exact threshold around 3600 seconds. Seeds 4 active actions + 1 action at 3605s ago (>1 hour) -> asserts `allowed == True` (count = 4). Seeds 1 action at 3595s ago (<1 hour) -> asserts `allowed == False` (count = 5).
- `test_e2e_api_rapid_events_cooldown_and_rate_limit`: Full end-to-end API test calling `POST /api/v1/events/candidates` with realistic JSON payloads, custom workflow configuration (`max_actions_per_hour: 3`, `cooldown_seconds: 5`), real database transactions, and dual-camera event dispatch.

### 1.3 Execution Results
Command executed:
```powershell
$env:PYTHONPATH="services/api"; python -m pytest services/api/tests/test_policy_stress.py -v
```
Verbatim pytest output:
```
============================= test session starts =============================
platform win32 -- Python 3.13.14, pytest-9.0.3, pluggy-1.6.0
collected 8 items

services/api/tests/test_policy_stress.py::test_cooldown_rapid_sequential_events_suppressed PASSED [ 12%]
services/api/tests/test_policy_stress.py::test_cooldown_expired_allows_subsequent_event PASSED [ 25%]
services/api/tests/test_policy_stress.py::test_cooldown_unconfirmed_prior_incident_does_not_suppress PASSED [ 37%]
services/api/tests/test_policy_stress.py::test_rate_limiting_per_camera_isolation PASSED [ 50%]
services/api/tests/test_policy_stress.py::test_rate_limit_ignores_failed_or_queued_actions PASSED [ 62%]
services/api/tests/test_policy_stress.py::test_expired_actions_do_not_block_new_actions PASSED [ 75%]
services/api/tests/test_policy_stress.py::test_rate_limit_precise_boundary_cutoff PASSED [ 87%]
services/api/tests/test_policy_stress.py::test_e2e_api_rapid_events_cooldown_and_rate_limit PASSED [100%]

============================== 8 passed in 2.91s ==============================
```

Full API test suite verification:
```powershell
$env:PYTHONPATH="services/api"; python -m pytest services/api/tests/ -v
============================= 31 passed in 8.29s ==============================
```

Edge agent test suite verification:
```powershell
$env:PYTHONPATH="services/edge-agent"; python -m pytest services/edge-agent/tests/ -v
============================== 4 passed in 0.28s ==============================
```

Database state verification:
```
cameras with stress-: 0
incidents with stress-: 0
actions with stress-: 0
```

---

## 2. Logic Chain

1. **Per-Camera Rate Limiting & Camera Isolation:**
   - *Observation 1.1.2* demonstrates that the rate limiter query joins `actions a` to `incidents i` on `a.incident_id = i.id` and filters strictly by `WHERE i.camera_id = ?`.
   - *Observation 1.2 (Test 4 & Test 8)* directly validated that when Camera A generated 5 actions within the hour, Camera A's 6th event was suppressed with `"Suppressed by Rate Limit: Reached 5/5 actions per hour."`
   - Simultaneously, Camera B was queried and showed 0 actions in the last hour, allowing Camera B to dispatch actions normally.
   - Therefore, actions generated by Camera A do not leak into or exhaust the rate limit for Camera B.

2. **Cooldown Suppression on Rapid Sequential Events:**
   - *Observation 1.1.1* shows that the cooldown engine queries the most recent incident for `camera_id` with `status in ('action_sent', 'confirmed')` and calculates `delta = (now - last_time).total_seconds()`.
   - *Observation 1.2 (Test 1 & Test 8)* proved that when a second candidate event arrives within the cooldown window (e.g. 0s to 4s < 60s), `allowed` returns `False` and reason returns `"Suppressed by Cooldown: {delta}s since previous incident (< {cooldown}s limit)."`.
   - The candidate event is safely recorded in the incident store with status `'confirmed'` while preventing redundant downstream action dispatches.
   - *Observation 1.2 (Test 2)* showed that once the elapsed time exceeds the cooldown duration (65s > 60s), the event is immediately permitted.
   - *Observation 1.2 (Test 3)* confirmed that non-intrusive events (`'not_confirmed'`) do not trigger cooldown lockouts for real incidents.

3. **Expired Actions (>1 Hour) Cutoff:**
   - In *Observation 1.1.2*, `cutoff` is computed in Python as `(datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()`.
   - In `ActionDispatcher.dispatch()`, `created_at` is generated via `datetime.now(timezone.utc).isoformat()`.
   - Because both timestamps are standardized UTC strings (`YYYY-MM-DDTHH:MM:SS.ffffff+00:00`), lexicographical comparison in SQLite accurately reflects chronological order.
   - *Observation 1.2 (Test 6 & Test 7)* empirically proved that actions older than 1 hour (seeded at 61m, 65m, 90m, 2h, 5h, 24h, 7d ago, and exactly 3605s ago) evaluate as `< cutoff` and are completely excluded from the hourly count.

---

## 3. Caveats

1. **Timezone Offset Assumption in Cooldown:**
   In `policy.py:81`, `last_time.replace(tzinfo=timezone.utc)` is used instead of `.astimezone(timezone.utc)`. If an external client were to send an ISO string with a non-UTC offset (e.g. `+05:30`), `replace` treats the local wall-clock time as UTC rather than converting it. However, in DrishtiFlow's architecture (`emitter.py`, `CameraPreview.tsx`, and `events.py`), all timestamps are strictly generated as UTC ISO strings (`new Date().toISOString()` or `datetime.now(timezone.utc).isoformat()`).
2. **Quota Unit (Actions vs Incidents):**
   `max_actions_per_hour` counts rows in the `actions` table (`status in ('sent', 'delivered')`). If a workflow defines multiple concurrent actions for a single incident (e.g., both `dashboard_alert` and `whatsapp_message`), each incident creates 2 action rows, consuming 2 units of the hourly quota. This is by design (rate limiting outbound notifications per camera).

---

## 4. Conclusion

**Verdict: CONFIRMED.**

The policy rate limiting and cooldown suppression engines are empirically verified to be **correct, isolated, and resilient**:
1. Rate limits are strictly scoped per-camera; actions for Camera A never exhaust or affect Camera B's limits.
2. Rapid sequential events within the cooldown period are reliably suppressed with clear diagnostic reason strings, without suppressing other cameras.
3. Actions older than 1 hour (>3600 seconds) are cleanly excluded from the rate limit calculation, fixing the earlier SQLite datetime comparison defect.
4. All 8 stress tests and all 31 comprehensive API tests pass with 100% success.

---

## 5. Verification Method

To reproduce the empirical stress tests independently:

```powershell
# 1. Run the dedicated stress test suite
$env:PYTHONPATH="services/api"
python -m pytest services/api/tests/test_policy_stress.py -v

# 2. Run the complete backend test suite
python -m pytest services/api/tests/ -v

# 3. Run the edge-agent test suite
$env:PYTHONPATH="services/edge-agent"
python -m pytest services/edge-agent/tests/ -v
```

Expected output:
- `test_policy_stress.py`: 8 passed in ~3s.
- `services/api/tests/`: 31 passed in ~8s.
- `services/edge-agent/tests/`: 4 passed in ~0.3s.
