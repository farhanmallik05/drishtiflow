# DrishtiFlow Engineering Standards & Definition of Done
**Governing Document:** [DrishtiFlow_Enhanced_PRD_v3_EMPTY.md](file:///d:/hackathon/Build%20with%20Bharat/DrishtiFlow_Enhanced_PRD_v3_EMPTY.md) §10, §11, §20.2  
**Plan Rule:** [plan/PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md)

---

## 1. Definition of Done (DoD)

A task or feature in DrishtiFlow is strictly considered **DONE** only when all of the following criteria are met:

1. **Functional Completeness:** The user story and acceptance criteria defined in [plan/TASKS.md](file:///d:/hackathon/Build%20with%20Bharat/plan/TASKS.md) are fully implemented.
2. **Schema & Server-Side Validation:** All external input, API payloads, and database operations are validated via strict Pydantic / Zod schemas.
3. **Graceful Failure States:** Network timeouts, model unavailabilities, and external provider failures have explicit fallback and error-handling paths. No silent failures.
4. **Tenant Isolation & Security:** All queries include `organization_id` scoping. No credentials, tokens, or private keys exist in client bundles, Git, or logs.
5. **Validation Evidence Recorded:** The engineer or agent executes real verification (unit test, curl execution, or CLI run) and records output in [plan/TASKS.md](file:///d:/hackathon/Build%20with%20Bharat/plan/TASKS.md).
6. **Plan Synchronization:** [plan/STATE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/STATE.md), [plan/TASKS.md](file:///d:/hackathon/Build%20with%20Bharat/plan/TASKS.md), and [plan/CHANGELOG.md](file:///d:/hackathon/Build%20with%20Bharat/plan/CHANGELOG.md) are updated synchronously.

---

## 2. Code Quality & Language Standards

### 2.1 TypeScript / Frontend (Next.js 14 App Router)
- **Strict Mode:** Strict TypeScript enabled. Use of `any` is strictly banned; use proper interfaces or `unknown` with type guards.
- **Components:** Modular, functional components with typed props. Avoid huge monolithic components (>300 lines); split into subcomponents.
- **State Management:** Use React hooks (`useState`, `useCallback`, `useMemo`) appropriately to prevent unnecessary renders in video stream loops.
- **Styling:** Tailwind CSS with semantic design tokens. Ensure readable contrast and keyboard accessibility.
- **Client vs Server Components:** Keep `use client` boundaries minimal; push data fetching and static UI to Server Components.

### 2.2 Python / Backend (FastAPI + Pydantic v2)
- **Type Annotations:** All functions, methods, and API handlers must include complete type annotations.
- **Pydantic Validation:** All request and response bodies must be modeled using Pydantic v2 schemas.
- **Async Execution:** Use `async def` for I/O-bound endpoints (database, external HTTP requests). Use background tasks for non-blocking action dispatch.
- **Error Handling:** Return structured HTTP error responses matching the PRD standard error contract:
  ```json
  {
    "error": {
      "code": "STRING_IDENTIFIER",
      "message": "Human readable error description",
      "retryable": false,
      "correlation_id": "uuid"
    }
  }
  ```

### 2.3 Database & SQL (PostgreSQL / Supabase)
- **Identifiers:** Use snake_case for tables, columns, and foreign keys.
- **Primary Keys:** UUID v4 primary keys default to `gen_random_uuid()`.
- **Timestamps:** Always use `timestamptz` with `default now()` stored in UTC. UI renders site-local timezone.
- **Foreign Keys:** Explicit `references` with appropriate `on delete cascade` or `on delete set null`.
- **Indexes:** Always index foreign keys, compound search filters (`organization_id`, `occurred_at desc`), and queue status fields.

---

## 3. Security, Privacy & Safety Guardrails

- **Zero Client-Side Secrets:** `VISION_API_KEY`, `GROQ_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `VAPI_API_KEY`, and database service role keys must NEVER be prefixed with `NEXT_PUBLIC_` or bundled in client JS.
- **DPDP Act & Data Minimization:** Continuous video feeds must never be stored on cloud servers. Only short candidate keyframes (snapshots) are uploaded upon trigger.
- **Responsible AI Claims:**
  - Never claim 100% detection accuracy or zero false alarms.
  - Never describe visual model output as certainty regarding human intent, guilt, identity, or medical safety.
  - Verification failures must resolve to `uncertain` or `processing_failed`, never `safe`.
- **Idempotent Actions:** Every external alert (WhatsApp, Voice, Webhook) must carry an idempotency key to prevent duplicate notifications during network retries.

---

## 4. Performance & Resource Budgets

| Metric | Budget / Target | Action on Violation |
|---|---|---|
| **Edge Frame Inference (WebGPU)** | ≤ 50ms per frame (≥ 20 FPS) | Downsample input resolution to 320x320 or lower frame sampling rate |
| **Edge Frame Inference (CPU WASM)** | ≤ 125ms per frame (≥ 8 FPS) | Limit frame sampling to 4-5 FPS |
| **VLM Context Verification (Cloud)** | ≤ 3,500ms p95 latency | Trigger circuit breaker and fallback to local mock after 2 consecutive timeouts |
| **VLM Per-Event Wall-Clock Deadline** | ≤ 4,000ms per candidate | Return processing_failed with human review; do not authorize actions on timeout |
| **Automatic Evidence Snapshot Attempt** | ≤ 500ms wait on candidate ingestion | Store the captured frame or a labeled placeholder and continue safely |
| **Deterministic Policy Check** | ≤ 20ms | In-memory evaluation of schedules and cooldowns |
| **Action Dispatch (Queue to API)** | ≤ 500ms | Asynchronous non-blocking worker |
| **Client Bundle Size (Initial Load)** | ≤ 250 KB gzip | Dynamic import for React Flow canvas and ONNX runtime |

---

## 5. Pre-Pilot Acceptance Gates & Non-Negotiable Release Blockers (PRD §20.2 & §20.3)

Before any deployment transitions to a supervised commercial pilot (Milestone R1), it must clear all ten non-negotiable feature-completion standards:

| Gate ID | Core PRD Requirement | Acceptance Standard | Release Blocker Rule |
|---|---|---|---|
| **GATE-01** | **30-Minute Continuous Stability** | Minimum 30-minute uninterrupted monitoring session on target hardware with < 5% memory heap growth. | **BLOCKER-01:** Never release if monitoring crashes or leaks memory over 30 minutes. |
| **GATE-02** | **Dependable Edge Inference** | Real vision model weights (YOLOv8n) loaded and processing live camera frames at ≥ 20 FPS (WebGPU/TensorRT). | **BLOCKER-02:** Never release if edge detection runs on simulated coordinates instead of real model tensors. |
| **GATE-03** | **Camera Health & Heartbeat** | Automatic heartbeat tracking; feed disconnect surfaced in UI within ≤ 15 seconds; exponential reconnect daemon. | **BLOCKER-03:** Never release if camera disconnect fails to trigger visible UI warning within 15 seconds. |
| **GATE-04** | **Live VLM Context Verification** | Real keyframe images verified by live provider (Gemini 1.5 Flash / Groq Vision) with 5-state response and safe error degradation. | **BLOCKER-04:** Never release if VLM runs on mock heuristics in production, or model errors are treated as safe. |
| **GATE-05** | **Verified Notification Delivery** | Confirmed receipt of alert on physical consenting recipient device within ≤ 5.0 seconds. | **BLOCKER-05:** Never release if alert delivery is unverified on real mobile hardware. |
| **GATE-06** | **Authentication & Access Control** | JWT / OAuth2 token validation enforced on all API endpoints (except `/health`); zero client-side secrets. | **BLOCKER-06:** Never release if API endpoints allow unauthenticated access or expose credentials. |
| **GATE-07** | **Multi-Tenant Data Isolation** | Strict SQL/schema query scoping to `organization_id`; cross-tenant access returns HTTP 403/404. | **BLOCKER-07:** Never release if a tenant can view or mutate another organization's cameras, rules, or evidence. |
| **GATE-08** | **Cryptographic Evidence Management** | Encrypted storage at rest; configurable 7–30 day retention window; automated TTL purge API conforming to DPDP Act. | **BLOCKER-08:** Never release if retention periods are undefined or evidence cannot be verifiably deleted. |
| **GATE-09** | **Resilient Failure Recovery** | Network severance buffers candidate events locally on edge disk; reconnect auto-flushes without dropping or duplicating alerts. | **BLOCKER-09:** Never release if network interruptions cause dropped incidents or duplicate notifications. |
| **GATE-10** | **Empirical Performance Benchmarks** | Measured Precision ≥ 90.0%, Recall ≥ 90.0%, p95 latency ≤ 3.5s, and camera uptime ≥ 99.0% on labeled benchmark sets. | **BLOCKER-10:** Never release if performance claims lack empirical test evidence. |


