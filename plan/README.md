# DrishtiFlow (दृष्टि-फ़्लो) Planning Center
**Project:** DrishtiFlow — Event-Aware Vision Intelligence for Bharat Sites  
**Event:** Build with Bharat 5.0  
**Status:** Phase 0 Active (Planning & Architecture Initialization)  
**Governing PRD:** [DrishtiFlow_Enhanced_PRD_v3_EMPTY.md](file:///d:/hackathon/Build%20with%20Bharat/DrishtiFlow_Enhanced_PRD_v3_EMPTY.md)  
**Protocol Rule:** [plan/PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md)

---

## 1. Overview of the Planning Directory

The `plan/` directory serves as the single source of truth for all architectural, operational, tracking, and roadmap decisions across DrishtiFlow.

```
plan/
├── PLAN_RULE.md         # Mandatory protocol governing every change
├── README.md            # Planning center directory index & guidelines (this file)
├── STATE.md             # Real-time state machine: current phase, health, blockers
├── ROADMAP.md           # 10-day build sequence, milestones R0-R4, release gates
├── ARCHITECTURE.md      # Detailed system architecture, schemas, edge & cloud data flows
├── TASKS.md             # Work Breakdown Structure (WBS) with owners and statuses
├── STANDARDS.md         # Definition of Done, testing gates, security & privacy rules
└── CHANGELOG.md         # Immutable audit trail of repository and planning updates
```

---

## 2. Core Plan Artifacts & Responsibilities

| File | Purpose | When to Read | When to Update |
|---|---|---|---|
| **[PLAN_RULE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/PLAN_RULE.md)** | Mandatory change enforcement rule | At start of turn | When rules or protocols are amended |
| **[STATE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/STATE.md)** | Live project snapshot & current blockers | Before any work begins | **On EVERY change** (phase, metrics, recent actions) |
| **[TASKS.md](file:///d:/hackathon/Build%20with%20Bharat/plan/TASKS.md)** | Detailed task tracking with task IDs | To find what to work on | **On EVERY change** (mark in-progress/done, add evidence) |
| **[CHANGELOG.md](file:///d:/hackathon/Build%20with%20Bharat/plan/CHANGELOG.md)** | Historical audit log | To review project history | **On EVERY change** (log files touched & reasons) |
| **[ARCHITECTURE.md](file:///d:/hackathon/Build%20with%20Bharat/plan/ARCHITECTURE.md)** | Technical specs, schemas, APIs | Before touching code/schemas | Whenever schemas, endpoints, or pipelines change |
| **[ROADMAP.md](file:///d:/hackathon/Build%20with%20Bharat/plan/ROADMAP.md)** | Milestone schedule & delivery gates | During milestone review | Whenever timelines or milestone scopes shift |
| **[STANDARDS.md](file:///d:/hackathon/Build%20with%20Bharat/plan/STANDARDS.md)** | Quality criteria & Definition of Done | Before marking tasks complete | When standards or budgets are revised |

---

## 3. Team Responsibilities

| Contributor | Area of Ownership | Key Deliverables |
|---|---|---|
| **Farhan** | Product Integration, Compiler, Contracts, Coordination | Workflow compiler, JSON schema validation, API orchestrator |
| **Kartikey** | Camera Ingestion & Edge Vision | Webcam/WebRTC gateway, ONNX detector, zone polygon logic |
| **Ankit** | Context Verification & Quality Assurance | VLM verification engine, uncertainty handling, evaluation dataset |
| **Piyush** | Frontend & User Experience | Next.js app, React Flow workflow canvas, Incident center |
| **Kaushendra** | Action Dispatcher & Notifications | Deterministic policy engine, WhatsApp & Vapi adapters, retry queue |

---

## 4. How to Execute Changes (Plan-First Rule)

1. **Review Context**: Inspect `plan/STATE.md` to see current project health and active phase.
2. **Claim Task**: Inspect `plan/TASKS.md`, find your Task ID, and mark it as `[~] IN_PROGRESS`.
3. **Execute & Verify**: Write clean, typed, modular code adhering to `plan/STANDARDS.md` and test it.
4. **Synchronize Plan**:
   - Mark task `[x] DONE` in `plan/TASKS.md` with validation evidence.
   - Update `plan/STATE.md` with current progress.
   - Log entry in `plan/CHANGELOG.md`.
   - Update `plan/ARCHITECTURE.md` if any schemas or APIs changed.

