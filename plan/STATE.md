# DrishtiFlow Project State
**Last Updated:** 2026-11-06T03:00:00+05:30  
**Active Milestone:** Milestone R1 — Supervised Pilot MVP (Fall Detection & Hospital Emergency Dispatch — USP)  
**Next Milestone:** Milestone R2 — Multi-Site Operations  
**Overall System Health:** 🟢 GREEN (All 30 R0 tasks complete, 48/48 tests passing, ESLint 0 warnings/errors, Next.js 14 build verified) | 🟡 R1 IN PROGRESS (Fall Detection & Hospital Emergency Dispatch — 5/6 tasks complete)

**Active Task:** `TSK-R1-06` (IN_PROGRESS) — Fall Detection End-to-End Test Suite. Fall detection USP complete: pose detector, fall state machine, emergency dispatch, API router, Fall Monitor UI all implemented and verified.

---

## 1. Quick Status Dashboard

| Metric | Current Status | Target for R0 (Hackathon MVP) |
|---|---|---|
| **Active Milestone** | Milestone R0 Complete (27/27 tasks) | Complete repeatable live demo |
| **Overall Progress** | 100% of R0 Prototype Scope | 100% of R0 Scope |
| **Monorepo Scaffold** | Complete (`apps/web`, `services/api`, `services/edge-agent`, `packages/*`) | Complete |
| **Workflow Compiler** | Fully operational (Hindi/Hinglish/English) + Versioning & Activation Check | Strict schema output & needs_review |
| **Edge Vision & Zone** | Interactive polygon canvas + ray-casting PIP + 1.5s dwell + Evidence frame + live YOLOv8n person detection on real CCTV footage + uploaded video playback (animation removed) | Zone trigger on human presence |
| **Context Verifier** | 5-state decision engine + deterministic mock fallback | Multi-state VLM with safe degradation |
| **Action Engine** | Policy cooldown + camera-scoped rate limit + WhatsApp/Vapi adapters | Idempotent alerts without duplicates |
| **E2E Test Pipeline** | 48/48 unit & integration tests passing (17.50s, incl. 4 YOLO detector + 7 shoplift monitor tests) | Automated end-to-end verification |

---

## 2. Measured Validation Evidence & Benchmarks

| Metric | Measured Value | Standard / Budget | Status |
|---|---|---|:---:|
| **E2E Pipeline Latency** | 770ms (p95) | ≤ 5,000ms | 🟢 PASS |
| **API Test Suite** | 31/31 passed (`services/api/tests/`) | 100% pass | 🟢 PASS |
| **Edge Agent Test Suite** | 8/8 passed (4 edge geometry + 4 YOLO detector, incl. live-server smoke test) | 100% pass | 🟢 PASS |
| **Evaluation Precision** | 100.0% (5 TP, 0 FP on test set) | ≥ 90.0% | 🟢 PASS |
| **Evaluation Recall** | 100.0% (5 TP, 0 FN on test set) | ≥ 90.0% | 🟢 PASS |
| **Uncertain/Degraded Handling** | 2/2 hard negative edge cases degraded safely | 100% safe degradation | 🟢 PASS |
| **Frontend Code Quality** | `npm run lint` — 0 errors, 0 warnings | Clean ESLint | 🟢 PASS |
| **Next.js Client Bundle Size** | 102 kB First Load JS | ≤ 250 kB | 🟢 PASS |
| **Edge Frame Ingestion** | 24 FPS ray-casting PIP + 27.5 FPS YOLOv8n CPU on real CCTV footage | ≥ 20 FPS | 🟢 PASS |
| **YOLOv8n on Real CCTV** | 14 candidate events emitted over ~10-min intrusion video; all accepted by live API; verifier `confirmed`/`uncertain`; policy `action_sent` | Full pipeline functional | 🟢 PASS |
| **Shoplifting Pipeline on CCTV** | 119 persons tracked, 22 theft_suspected=True, evidence photos saved; `POST /api/v1/shoplifting/process-video` returns 200 OK | Full pipeline functional | 🟢 PASS |
| **Action Idempotency** | 100% duplicate suppression via SHA-256 keys | Zero duplicates | 🟢 PASS |
| **Live E2E Write Path (uvicorn)** | compile→activate→event→verify→policy→dispatch: `confirmed → action_sent`, sandbox WhatsApp dispatched | Full pipeline functional | 🟢 PASS |
| **GET Collection Endpoints** | `/incidents`, `/cameras`, `/workflows` all 200 OK after legacy-row resilience fix | 0× HTTP 500 | 🟢 PASS |
| **Demo DB Hygiene** | Tests purge own debris; repeated pytest leaves DB stable (cameras=2, incidents=1, workflows=1) | Zero test debris | 🟢 PASS |

---

## 3. Team Track Status

| Track | Owner | Completed Tasks | Health | Key Deliverable |
|---|---|:---:|:---:|---|
| **Track 0: Project Setup & Plan System** | Farhan | 3 / 3 | 🟢 GREEN | `plan/` directory, PFCP rule enforcement |
| **Track 1: Monorepo & Shared Schemas** | Farhan | 4 / 4 | 🟢 GREEN | FastApi backend, Zod/Pydantic shared schemas |
| **Track 2: Camera Ingestion & Edge Vision** | Kartikey | 5 / 5 | 🟢 GREEN | Webcam/Sample stream, ZoneCanvas PIP engine, live YOLOv8n on real CCTV |
| **Track 3: Context Verification Engine** | Ankit | 4 / 4 | 🟢 GREEN | VLM verifier, deterministic mock, test harness |
| **Track 4: Frontend, Canvas & Incident UI** | Piyush | 4 / 4 | 🟢 GREEN | Next.js 14 Command Center, RuleBuilder, Graph |
| **Track 5: Policy Engine & Action Worker** | Kaushendra | 4 / 4 | 🟢 GREEN | Cooldown policy, WhatsApp & Vapi adapters |
| **Track 6: Testing, Evaluation & Pitch** | All | 6 / 6 | 🟢 GREEN | 37/37 tests passing + live API smoke audit & 2 regression tests |

---

## 4. Open Decisions & Risk Matrix Review (From PRD §21)

| PRD Decision Item | Chosen Resolution for R0 Prototype | Status |
|---|---|:---:|
| **Edge Deployment Mode** | Browser-first (Webcam / Canvas PIP) + Python Edge Agent daemon. | Resolved |
| **Primary Verifier** | Gemini/Groq VLM adapter with deterministic mock fallback for demo safety. | Resolved |
| **Video Ingestion** | Live Webcam + High-fidelity warehouse security simulation scene. | Resolved |
| **Notification Sandbox** | Safe test dispatcher mode to verified destination mobile number. | Resolved |
