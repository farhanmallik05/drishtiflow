# DrishtiFlow Project State
**Last Updated:** 2026-11-06T11:20:00+05:30  
**Active Milestone:** Milestone R1 — Supervised Pilot MVP (Fall Detection & Hospital Emergency Dispatch — USP) & 3D Tactical Surveillance Platform  
**Next Milestone:** Milestone R2 — Multi-Site Operations  
**GitHub Repository:** `farhanmallik05/drishtiflow`  
**Overall System Health:** 🟢 GREEN (All R0 tasks complete, 3D Landing Page & Tactical Dashboard complete, Fall Detection USP & live RTSP stream ingestion verified)

---

## 1. Quick Status Dashboard

| Metric | Current Status | Target for R0 (Hackathon MVP) |
|---|---|---|
| **Active Milestone** | Milestone R1 Blocker Clearance Track (0/11 accepted; 2 in progress) | Resolve Pilot Release Blockers |
| **Milestone R1 Backlog** | 11 Blocker Clearance Tasks defined (`TSK-R1-01` to `11`) | Clear 10 PRD Release Blockers |
| **Overall Progress** | 100% R0 scope recorded; 0/11 R1 blocker tasks accepted | 100% of Pilot Scope |
| **Monorepo Scaffold** | Complete (`apps/web`, `services/api`, `services/edge-agent`, `packages/*`) | Complete |
| **Workflow Compiler** | Operational on Groq (`qwen/qwen3.8-27b`) + Gemini fallback + Allowlist filtering | Strict schema output & needs_review |
| **Edge Vision & Zone** | Interactive polygon canvas + ray-casting PIP + 1.5s dwell + Evidence frame | Zone trigger on human presence |
| **Live Camera Ingestion** | RTSP/HTTP/USB via OpenCV, MJPEG streaming, YOLOv8 box overlay, snapshot evidence | Live IP camera monitoring |
| **Context Verifier** | Gemini adapter and 5-state contract; fail-closed behavior needs verification | Real keyframe inspection and safe degradation |
| **Action Engine** | Policy cooldown + camera-scoped rate limit + WhatsApp/Vapi adapters | Idempotent alerts without duplicates |
| **API Test Battery** | 57 passed, 6 deselected (`python -m pytest services/api/tests -q`, 2026-11-06) | Automated end-to-end verification |
| **10-Case Evaluation Harness** | Synthetic drawings; permits provider failures and may exercise mock mode; no real-world accuracy evidence | Separately configured integration tests on labeled real imagery |

---

## 2. PRD Feature-Completion Standards & Release Blocker Status (PRD §20.2 & §20.3)

| ID | PRD Core Requirement | Status in Codebase | Pilot MVP Status |
|---|---|:---:|:---:|
| **FCS-01** | **30-Minute Stable Monitoring** | Partially Verified (10-min manual) | ⚠️ **Active Release Blocker [BLOCKER-01]** |
| **FCS-02** | **Dependable Edge Inference** | Algorithmic Core Verified (Ray-casting PIP + Dwell) | ⚠️ **Active Release Blocker [BLOCKER-02]** |
| **FCS-03** | **Camera Health Lifecycle** | Status Schema & Test Ping Implemented | ⚠️ **Active Release Blocker [BLOCKER-03]** |
| **FCS-04** | **Context Verification on Live Images** | Gemini adapter present; external call not verified here | ⚠️ **ACTIVE RELEASE BLOCKER [BLOCKER-04]** |
| **FCS-05** | **Verified Notification Delivery** | WhatsApp/Vapi Clients Complete (Sandbox by Default) | ⚠️ **Active Release Blocker [BLOCKER-05]** |
| **FCS-06** | **Authentication & Access Control** | Endpoints Open for Demo Mode | ⚠️ **Active Release Blocker [BLOCKER-06]** |
| **FCS-07** | **Multi-Tenant Data Isolation** | Schema Multi-Tenant; Auth Scoping Gap | ⚠️ **Active Release Blocker [BLOCKER-07]** |
| **FCS-08** | **Cryptographic Evidence Management** | Base64 SQLite Storage; TTL Purge Gap | ⚠️ **Active Release Blocker [BLOCKER-08]** |
| **FCS-09** | **Resilient Failure Recovery** | API Retries Implemented; Edge Disk Buffer Gap | ⚠️ **Active Release Blocker [BLOCKER-09]** |
| **FCS-10** | **Empirical Performance Benchmarking** | Synthetic harness only; no real-world accuracy evidence | ⚠️ **ACTIVE RELEASE BLOCKER [BLOCKER-10]** |

---

## 3. Measured Validation Evidence & Benchmarks

| Metric | Measured Value | Standard / Budget | Status |
|---|---|---|:---:|
| **Real-Image Vision Precision / Recall** | Not measured; current 10 images are generated drawings, not an accuracy dataset | ≥ 90.0% | ⚪ NOT VERIFIED |
| **False Positive / Negative Rate** | Not measured on labeled real footage | ≤ 5.0% | ⚪ NOT VERIFIED |
| **Gemini Verification Latency** | Historical 1720.6ms is not reproducible from the generated-image harness | ≤ 3,500ms | ⚪ NOT VERIFIED |
| **Groq Compiler Latency** | 300–450ms (Qwen 3.8 27B on Groq Cloud) | ≤ 1,500ms | 🟢 PASS |
| **Full API Test Battery** | Historical report says 42/42; could not rerun because Python is unavailable | 100% pass | ⚪ NOT RE-RUN |
| **Edge Agent Test Suite** | Historical report says 4/4; could not rerun because Python is unavailable | 100% pass | ⚪ NOT RE-RUN |
| **Safe Degradation on Provider Error** | Fail-closed behavior updated; Python regression tests still required | Fail-safe | ⚪ NOT RE-RUN |
| **Frontend ESLint** | `npm run lint --workspace=apps/web` exited 0 with no warnings or errors | Clean lint | 🟢 PASS |
| **Next.js Production Build** | `npm run build --workspace=apps/web` exited 0; 4 static pages generated | Clean build | 🟢 PASS |
| **Edge Frame Ingestion** | 24 FPS with ray-casting PIP + Evidence snapshot | ≥ 20 FPS | 🟢 PASS |
| **Action Idempotency** | 100% duplicate suppression via SHA-256 keys | Zero duplicates | 🟢 PASS |

---

## 3. Team Track Status

| Track | Owner | Completed Tasks | Health | Key Deliverable |
|---|---|:---:|:---:|---|
| **Track 0: Project Setup & Plan System** | Farhan | 3 / 3 | 🟢 GREEN | `plan/` directory, PFCP rule enforcement |
| **Track 1: Monorepo & Shared Schemas** | Farhan | 4 / 4 | 🟢 GREEN | FastApi backend, Zod/Pydantic shared schemas |
| **Track 2: Camera Ingestion & Edge Vision** | Kartikey | 4 / 4 | 🟢 GREEN | Webcam/Sample stream, ZoneCanvas PIP engine |
| **Track 3: Context Verification Engine** | Ankit | 4 / 4 | 🟢 GREEN | VLM verifier, deterministic mock, test harness |
| **Track 4: Frontend, Canvas & Incident UI** | Piyush | 4 / 4 | 🟢 GREEN | Next.js 14 Command Center, RuleBuilder, Graph |
| **Track 5: Policy Engine & Action Worker** | Kaushendra | 4 / 4 | 🟢 GREEN | Cooldown policy, WhatsApp & Vapi adapters |
| **Track 6: Testing, Evaluation & Pitch** | All | 4 / 4 | 🟢 GREEN | 12/12 tests passing, 3-minute pitch rehearsal |

---

## 4. Open Decisions & Risk Matrix Review (From PRD §21)

| PRD Decision Item | Chosen Resolution for R0 Prototype | Status |
|---|---|:---:|
| **Edge Deployment Mode** | Browser-first (Webcam / Canvas PIP) + Python Edge Agent daemon. | Resolved |
| **Primary Verifier** | Gemini/Groq VLM adapter with deterministic mock fallback for demo safety. | Resolved |
| **Video Ingestion** | Live Webcam + High-fidelity warehouse security simulation scene. | Resolved |
| **Notification Sandbox** | Safe test dispatcher mode to verified destination mobile number. | Resolved |
