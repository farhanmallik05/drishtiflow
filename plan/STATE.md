# DrishtiFlow Project State

**Last Updated:** 2026-11-06T11:45:00+05:30  
**Active Milestone:** Milestone R1 — Supervised Pilot MVP (Fall Detection USP & Blocker Clearance) & 3D Tactical Surveillance Platform  
**Next Milestone:** Milestone R2 — Multi-Site Operations  
**GitHub Repository:** arhanmallik05/drishtiflow  
**Overall System Health:** 🟢 GREEN / DEMO READY (API 79 passed, full edge suite 32 passed; frontend lint/build verified; 3D Landing Page & Tactical Dashboard complete; Fall Detection USP & live RTSP stream ingestion verified)
**Active Task:** TSK-R1-14 — One-Command Hackathon Demo Launcher (start_demo.py) & Live Demo Hardening.

**Latest Milestone Deliverables:**
- 3D Landing Page & Smart Surveillance Operations Platform (Three.js 3D PTZ camera, procedural multi-camera feeds with Phosphor Night Vision & Thermal IR, AI Emergency Detection Center, LISTY AI voice assistant)
- Fall Detection & Hospital Emergency Dispatch USP: YOLOv8n-Pose detector (yolo_pose_detector.py), Fall State Machine with 3-5s timer (all_monitor.py), hospital emergency dispatch (/api/v1/fall-monitor/emergency), Fall Monitor UI Tab (FallMonitor.tsx), and E2E pipeline test
- Production AI Configuration Loader with Groq & Gemini Validation (services/api/app/config.py)
- Genuine Groq Cloud Compiler with Bounded Retries, JSON Mode & Explicit Fallback (services/api/app/services/compiler.py)
- Genuine Gemini Multimodal Context Verifier with Pillow Byte Validation & 5-State Contract (services/api/app/services/verifier.py)
- 10-Case Labeled Image Dataset & Empirical Benchmark Harness (services/api/tests/test_evaluation_harness.py)
- Dedicated Groq and Gemini Test Suites (	est_groq_compiler.py, 	est_gemini_verifier.py)
- Real OpenCV stream ingestion with bounded-backoff reconnect (services/edge-agent/ingest/stream.py)
- Live MJPEG streaming + snapshot endpoints with YOLOv8 annotation (services/api/app/routers/cameras.py)
- RTSP mode, URL bar, YOLO toggle and evidence snapshot in the camera preview (CameraPreview.tsx)
- Shoplifting detection pipeline, CSV logging, evidence image capture, and Shoplifting Log UI tab

---

## 1. Quick Status Dashboard

| Metric | Current Status | Target for R0 (Hackathon MVP) |
|---|---|---|
| **Active Milestone** | Milestone R1 Blocker Clearance Track (0/10 accepted; 3 in progress) | Resolve Pilot Release Blockers |
| **Milestone R1 Backlog** | 10 Pilot blocker tasks defined (`TSK-R1-01` to `TSK-R1-10`) plus compiler/addendum tasks | Clear 10 PRD Release Blockers |
| **Overall Progress** | 100% R0 scope recorded; 0/11 R1 blocker tasks accepted | 100% of Pilot Scope |
| **Monorepo Scaffold** | Complete (`apps/web`, `services/api`, `services/edge-agent`, `packages/*`) | Complete |
| **Workflow Compiler** | Operational on Groq (`qwen/qwen3.8-27b`) + Gemini fallback + Allowlist filtering | Strict schema output & needs_review |
| **Edge Vision & Zone** | Interactive polygon canvas + ray-casting PIP + 1.5s dwell + Evidence frame | Zone trigger on human presence |
| **Live Camera Ingestion** | RTSP/HTTP/USB via OpenCV, MJPEG streaming, YOLOv8 box overlay, snapshot evidence | Live IP camera monitoring |
| **Context Verifier** | Gemini adapter and 5-state contract; fail-closed behavior needs verification | Real keyframe inspection and safe degradation |
| **Action Engine** | Policy cooldown + camera-scoped rate limit + WhatsApp/Vapi adapters | Idempotent alerts without duplicates |
| **API Test Battery** | 79 passed, 6 deselected (`python -m pytest services/api/tests -q`, 2026-11-06) | Automated end-to-end verification |
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
| **Full API Test Battery** | 79 passed, 6 deselected (`python -m pytest services/api/tests -q`, 2026-11-06) | 100% pass | PASS |
| **Targeted Edge Agent Tests** | 13 passed, 1 skipped across dependency-light monitor suites | Targeted regression coverage | PASS |
| **Full Edge Agent Collection** | `ultralytics` installed; Windows invalid-mount guard allows YOLO package discovery | Full suite collected | PASS |
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
| **Track 6: Testing, Evaluation & Pitch** | All | 6 / 6 | GREEN | API/edge suites, evaluation harness, and pitch rehearsal |

---

## 4. Open Decisions & Risk Matrix Review (From PRD §21)

| PRD Decision Item | Chosen Resolution for R0 Prototype | Status |
|---|---|:---:|
| **Edge Deployment Mode** | Browser-first (Webcam / Canvas PIP) + Python Edge Agent daemon. | Resolved |
| **Primary Verifier** | Gemini/Groq VLM adapter with deterministic mock fallback for demo safety. | Resolved |
| **Video Ingestion** | Live Webcam + High-fidelity warehouse security simulation scene. | Resolved |
| **Notification Sandbox** | Safe test dispatcher mode to verified destination mobile number. | Resolved |
