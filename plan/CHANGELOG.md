# DrishtiFlow Changelog
All notable changes to the DrishtiFlow project and planning artifacts are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-alpha.3] - 2026-11-04 (Roadmap Milestone Restructuring)

### Changed
- **Planning Roadmap Restructuring (`plan/ROADMAP.md` & `plan/README.md`)**:
  - Reorganized the build execution structure from a day-based sequence ("10-Day Build Sequence") into a formal milestone-based execution framework (**Milestones 1 through 10** under Milestone R0 Prototype).
  - Aligned each milestone (M1 through M10) with verified exit gates, explicit deliverables, and completed validation evidence.
  - Updated planning center references in `plan/README.md` to reflect the milestone-based execution model.

---

## [0.1.0-alpha.2] - 2026-11-04 (Remediation & Integration Polish)

### Fixed
- **Policy Engine Rate Limiting (`services/api/app/services/policy.py`)**:
  - Scoped the hourly rate limit to `camera_id` by joining the `actions` table with `incidents` (`WHERE i.camera_id = ? AND a.status in ('sent', 'delivered') AND a.created_at >= ?`).
  - Replaced SQLite string literal `datetime('now', '-1 hour')` with a UTC ISO-8601 parameter computed via `(datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()`, preventing character-set comparison mismatches.
- **Workflow Versioning & Activation Validation (`services/api/app/routers/workflows.py`)**:
  - Implemented `POST /api/v1/workflows/{id}/versions` (PRD §9) to create immutable version snapshots with automatic version incrementing.
  - Added server-side schema pre-validation in `POST /api/v1/workflows/{id}/activate` (PRD §6.2 FR-W-08), ensuring workflows have valid definitions, triggers, and at least one enabled action before activation.
- **Frontend ESLint Configuration (`apps/web/.eslintrc.json`)**:
  - Configured Next.js ESLint configuration extending `next/core-web-vitals` with compatibility for ESLint 8.
  - Achieved `✔ No ESLint warnings or errors` on `npm run lint --workspace=apps/web`.
- **API Routing Resilience & Frontend Integration (`apps/web/src/components/`)**:
  - Replaced hardcoded `http://localhost:8000` URLs across `RuleBuilder.tsx`, `WorkflowGraph.tsx`, `CameraPreview.tsx`, `ActionTester.tsx`, and `IncidentFeed.tsx` with environment-configurable `/api/v1/...` relative routes leveraging Next.js rewrites.
  - In `RuleBuilder.tsx`, persisted compiled workflows to backend via `POST /api/v1/workflows` and updated state with the saved ID.
  - In `WorkflowGraph.tsx`, integrated live activation and pausing via `POST /api/v1/workflows/{id}/activate` and `/pause` with user-facing validation error banners.
  - In `CameraPreview.tsx`, dynamically generated and attached base64 keyframe evidence snapshots to candidate event envelopes for both webcam and simulation modes.
  - In `IncidentFeed.tsx`, rendered keyframe evidence image thumbnails for incident cards possessing base64 snapshots or evidence URLs.
- **Test Isolation & Determinism (`services/api/tests/test_e2e_pipeline.py`)**:
  - Added workflow versioning snapshot verification assertions (`assert version_res.json()["version"] == 2`).
  - Added teardown cleanup fixture to remove test incidents, actions, feedback, zones, cameras, and workflows, ensuring 100% deterministic test execution on repeated runs.

### Verified
- `pytest services/api/tests/ -v`: 8/8 passed in 4.62s.
- `pytest services/edge-agent/tests/ -v`: 4/4 passed in 0.29s.
- `npm run lint --workspace=apps/web`: 0 errors, 0 warnings.
- `npm run build --workspace=apps/web`: 0 errors, 102 kB bundle size.

---

## [0.1.0-alpha.1] - 2026-11-04 (Milestone R0 Complete)

### Added
- **Monorepo Foundation & Schemas (`packages/`)**:
  - `packages/workflow-schema`: Shared Zod schemas and TypeScript models for `WorkflowDefinition`, `TriggerConfig`, `VerificationConfig`, `ActionConfig`, `CandidateEvent`, `VerificationResult`.
  - `packages/shared-types`: Domain interfaces for `Camera`, `Zone`, `Incident`, `Action`, `Feedback`, `Site`, `Organization`.
- **FastAPI Application Backend (`services/api/`)**:
  - `services/api/app/main.py`: Gateway server with CORS, structured error schemas, and auto database migration.
  - `services/api/app/database.py`: SQLite/PostgreSQL-compatible data store with multi-tenant schema matching PRD §8.
  - `services/api/app/routers/`: Routers for `/api/v1/health`, `/api/v1/workflows`, `/api/v1/cameras`, `/api/v1/events/candidates`, `/api/v1/incidents`, `/api/v1/actions/test`.
  - `services/api/app/services/compiler.py`: Vernacular rule compiler supporting Hindi, Hinglish, and English inputs, with allowlist enforcement and `needs_review` clarification questions.
  - `services/api/app/services/verifier.py`: 5-state contextual VLM verifier (`confirmed`, `not_confirmed`, `uncertain`, `needs_human_review`, `processing_failed`) with deterministic mock fallback.
  - `services/api/app/services/policy.py`: Deterministic policy engine enforcing cooldown suppression (60s), rate limits (5/hr), and schedule windows.
  - `services/api/app/services/action_dispatcher.py`: Idempotent action worker with SHA-256 keys, WhatsApp Cloud API, and Vapi Voice calling adapters.
- **Edge Agent Ingestion & Detection (`services/edge-agent/`)**:
  - `services/edge-agent/ingest/stream.py`: Reconnecting video stream handler with backoff.
  - `services/edge-agent/inference/detector.py`: Edge object detector with ray-casting point-in-polygon algorithm.
  - `services/edge-agent/tracking/tracker.py`: 1.5-second persistent dwell tracker.
  - `services/edge-agent/events/emitter.py`: Signed candidate event envelope emitter.
- **Next.js 14 Web Application (`apps/web/`)**:
  - `apps/web/src/app/page.tsx`: Full responsive web UI with bilingual DrishtiFlow branding and 3 tab navigation (Command Center, Workflow Graph, Incident Center).
  - `components/camera/CameraPreview.tsx`: Live webcam preview + high-fidelity warehouse bay simulation scene with FPS telemetry and breach visualizer.
  - `components/camera/ZoneCanvas.tsx`: Interactive HTML5 Canvas overlay for click-to-draw polygon zones with point anchors and ray-casting PIP.
  - `components/workflow/RuleBuilder.tsx`: Vernacular rule creation with audio visualizer, 4 Bharat presets, and live compiler integration.
  - `components/workflow/WorkflowGraph.tsx`: Visual 3-node flowchart (Trigger -> Verify -> Action) with interactive runtime parameter drawers.
  - `components/incidents/IncidentFeed.tsx`: Live incident cards showing detector vs verifier confidence meters, plain language explanations, and operator feedback controls.
  - `components/incidents/ActionTester.tsx`: Modal to trigger safe test WhatsApp messages and outbound voice calls.
- **Automated Test Suites (`services/api/tests/`, `services/edge-agent/tests/`)**:
  - `test_compiler.py`: Tests Hindi and English prompt compilation.
  - `test_health.py`: Tests `/api/v1/health` and `/api/v1/ready`.
  - `test_policy_and_events.py`: Tests policy evaluation and idempotency keys.
  - `test_evaluation_harness.py`: Benchmark on 10 evaluation samples (100% precision and recall).
  - `test_edge_agent.py`: Tests stream reconnect, PIP geometry, and dwell tracker (4/4 passed).
  - `test_e2e_pipeline.py`: Full end-to-end integration test across all 6 stages (passed in 0.68s).

### Verified
- 12/12 pytest unit and integration tests passing cleanly in 4.36s.
- `next build` compiled with 0 errors (100 kB First Load JS).
- All 27 tasks across 7 tracks marked `[x] DONE` in `plan/TASKS.md`.
- Milestone R0 scope 100% fulfilled.

---

## [0.1.0-alpha.0] - 2026-11-04

#### Added
- **Planning Infrastructure (`plan/`)**: Initialized planning center and PFCP protocol rules.
- **Repository Setup**: Initialized Git repository, `.gitignore`, and `.env.example`.
