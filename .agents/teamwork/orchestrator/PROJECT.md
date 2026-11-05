# Project: DrishtiFlow

## Architecture
- **Monorepo Structure**:
  - `apps/web`: Next.js 14 frontend (Tailwind CSS, React Flow, HTML5 Canvas zone drawer, bilingual UI).
  - `services/api`: FastAPI backend with SQLite/PostgreSQL store (`drishtiflow.db`), routers for health, workflows, cameras, events, incidents, and actions.
  - `services/edge-agent`: Python edge simulation daemon with reconnecting stream, ray-casting point-in-polygon detector, 1.5s dwell tracker, and signed event emitter.
  - `packages/workflow-schema` & `packages/shared-types`: Shared Pydantic/Zod schemas and TypeScript models.
- **Data Flow**:
  1. Camera Ingestion (Browser Webcam or Pre-recorded Sample Clip Simulation).
  2. Edge Detection & Polygon Zone Ray-Casting PIP (feet point intersection) + 1.5s dwell persistence debounce.
  3. Candidate Event Ingestion (`POST /api/v1/events/candidates`).
  4. Contextual VLM Verification (`confirmed`, `not_confirmed`, `uncertain`, `needs_human_review`, `processing_failed`) with deterministic mock fallback.
  5. Deterministic Policy Evaluation (schedule active window, camera cooldown suppression, hourly rate limit).
  6. Action Dispatcher (SHA-256 idempotency, WhatsApp Cloud API, Vapi Voice calling, dashboard alerts).
  7. Incident Feed & Operator Feedback (`POST /api/v1/incidents/{id}/feedback`).

## Feature Inventory
Every feature from the Survey phase is mapped to its assigned milestone:
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|:------:|--------|
| 1 | Hindi / Hinglish Rule Compilation | Compiles conversational Hindi/Hinglish prompts into structured workflows | M1 | DONE | Survey |
| 2 | English Rule Compilation | Compiles English prompts into structured workflows | M1 | DONE | Survey |
| 3 | Allowlist Class & Action Enforcement | Enforces allowlisted detector classes and action types | M1 | DONE | Survey |
| 4 | Ambiguity & Clarification Questions | Returns needs_review with clarification questions | M1 | DONE | Survey |
| 5 | Anti-Hallucination Guard | Prevents compiler from inventing nonexistent entities | M1 | DONE | Survey |
| 6 | Browser Webcam Preview | Captures live local video feed via getUserMedia | M2 | DONE | Survey |
| 7 | Pre-recorded Sample Clip Simulation | High-fidelity warehouse simulation scene for repeatable demos | M2 | DONE | Survey |
| 8 | Stream Health Telemetry | Displays FPS, resolution, and connection status | M2 | DONE | Survey |
| 9 | Camera Registration API | REST endpoint /api/v1/cameras | M1 | DONE | Survey |
| 10 | Camera Connectivity Test API | REST endpoint /api/v1/cameras/{id}/test | M1 | DONE | Survey |
| 11 | Interactive Polygon Zone Overlay | Click-to-draw polygon canvas with normalized coordinates | M2 | DONE | Survey |
| 12 | Ray-Casting Point-in-Polygon (PIP) | Evaluates bottom-center feet coordinate against polygon | M1 | DONE | Survey |
| 13 | 1.5s Dwell Persistence Tracker | Requires continuous presence >= 1.5s before candidate event | M1 | DONE | Survey |
| 14 | Signed Candidate Event Envelope | Formats candidate event envelope with detector metadata | M1 | DONE | Survey |
| 15 | 5-State Verification Decision Model | Strict classification: confirmed, not_confirmed, uncertain, etc. | M1 | DONE | Survey |
| 16 | Cloud VLM Verification Adapter | Integrates with Gemini / Groq Vision with fallback | M1 | DONE | Survey |
| 17 | Deterministic Mock Verifier Fallback | Heuristic-driven local mock for offline hackathon demos | M1 | DONE | Survey |
| 18 | Evaluation Benchmark Test Harness | Automated test harness evaluating 10 sample scenarios | M1 | DONE | Survey |
| 19 | Active Schedule Window Check | Validates current wall-clock time against schedule | M1 | DONE | Survey |
| 20 | Cooldown Suppression | Suppresses duplicate events within 60s for same camera | M1 | DONE | Survey |
| 21 | Hourly Rate Limiter & Scoping | Enforces rate limit scoped to camera with proper datetime comparison | M1 | DONE | Survey |
| 22 | SHA-256 Action Idempotency Engine | Guaranteed zero duplicate deliveries on retry storms | M1 | DONE | Survey |
| 23 | WhatsApp Cloud API Adapter | Dispatches structured template notification with snapshot | M1 | DONE | Survey |
| 24 | Vapi Outbound Voice Alert Adapter | Automated phone call via Vapi API | M1 | DONE | Survey |
| 25 | Local Siren / Dashboard Alert | Browser audio playback for high-severity alerts | M2 | DONE | Survey |
| 26 | Safe Test Action Sandbox | Endpoint /api/v1/actions/test | M1 | DONE | Survey |
| 27 | Incident Persistence & Audit Store | Full database persistence in incidents table | M1 | DONE | Survey |
| 28 | Live Incident Feed UI | Responsive card deck showing verifier vs detector confidence | M2 | DONE | Survey |
| 29 | Operator Acknowledgment | Endpoint /api/v1/incidents/{id}/acknowledge | M1 | DONE | Survey |
| 30 | Structured Feedback Logging | Endpoint /api/v1/incidents/{id}/feedback | M1 | DONE | Survey |
| 31 | 3-Node Visual Graph Editor | Flowchart (Trigger -> Verify -> Action) with parameter drawers | M2 | DONE | Survey |
| 32 | Bharat Presets Selector | 4 local domain configurations (Mandi, MSME, Hospital, Kirana) | M2 | DONE | Survey |
| 33 | Bilingual Local-Language Headers | Bilingual English/Hindi UI labels throughout headers | M2 | DONE | Survey |
| 34 | Service Liveness & Readiness Probes | Endpoints /api/v1/health and /api/v1/ready | M1 | DONE | Survey |
| 35 | Server-Side Secrets Isolation | Centralized .env configuration with zero client-side leaks | M1 | DONE | Survey |
| 36 | Workflow Versioning API | POST /api/v1/workflows/{id}/versions (PRD §9) | M1 | DONE | Survey |
| 37 | Workflow Activation Validation | Server-side validation before activation (PRD §6.2 FR-W-08) | M1 | DONE | Survey |
| 38 | Frontend ESLint Configuration | .eslintrc.json for clean linting without interactive prompt | M2 | DONE | Survey |
| 39 | Relative API Endpoints & Resilience | Next.js API proxy routing to prevent hardcoded port breakage | M2 | DONE | Survey |
| 40 | Plan-First Plan Synchronization | Full evidence sync to plan/STATE.md, TASKS.md, CHANGELOG.md | M3 | DONE | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|:------:|
| M1 | Backend & Edge Remediation | Rate limit datetime fix & camera scoping, workflow versioning & validation APIs, test DB isolation | none | DONE |
| M2 | Frontend Lint & UI Resilience | ESLint config, relative API routes, workflow persistence & activation UX, evidence thumbnails | M1 | DONE |
| M3 | E2E Verification & Plan-First Sync | Pytest suites verification, Next.js build verification, plan/ synchronization | M1, M2 | DONE |

## Gate Verification Summary
- **Auditor**: CLEAN (Passed integrity audit with zero facades or bypasses).
- **Reviewers**: Both Backend and Frontend reviewers APPROVED.
- **Challengers**: Both Stress (8 test cases) and Boundary (15 test cases) CONFIRMED.
- **Test Matrix**:
  - `pytest services/api/tests/`: 31/31 passed in 8.29s (8 core + 8 stress + 15 boundary).
  - `pytest services/edge-agent/tests/`: 4/4 passed in 0.28s.
  - `npm run lint --workspace=apps/web`: 0 errors, 0 warnings.
  - `npm run build --workspace=apps/web`: Compiled cleanly (102 kB bundle).
