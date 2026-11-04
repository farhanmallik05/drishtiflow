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
| **Deterministic Policy Check** | ≤ 20ms | In-memory evaluation of schedules and cooldowns |
| **Action Dispatch (Queue to API)** | ≤ 500ms | Asynchronous non-blocking worker |
| **Client Bundle Size (Initial Load)** | ≤ 250 KB gzip | Dynamic import for React Flow canvas and ONNX runtime |
