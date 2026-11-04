# DrishtiFlow Changelog
All notable changes to the DrishtiFlow project and planning artifacts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### [0.1.0-alpha.0] - 2026-11-04

#### Added
- **Planning Infrastructure (`plan/`)**:
  - `plan/PLAN_RULE.md`: Mandatory Plan-First Change Protocol governing all code, architecture, and config modifications.
  - `plan/README.md`: Central planning directory index, file responsibilities, and team workflow guide.
  - `plan/STATE.md`: Real-time state machine tracking phase progress (11%), system health, active tracks, and open decisions.
  - `plan/ROADMAP.md`: Release roadmap (R0 to R4) and detailed 10-day build sequence for Build with Bharat 5.0.
  - `plan/ARCHITECTURE.md`: Technical specification covering Next.js frontend, FastAPI backend, ONNX Web edge detection, VLM contextual verification, deterministic policy engine, and Supabase/PostgreSQL schema.
  - `plan/TASKS.md`: Work Breakdown Structure containing 27 granular tasks across 7 tracks with owners, statuses, and acceptance criteria.
  - `plan/STANDARDS.md`: Engineering quality gates, Definition of Done, security boundaries, and performance budgets.
  - `plan/CHANGELOG.md`: Historical audit log for project tracking.
- **Workspace-wide Rule Enforcement**:
  - `GEMINI.md`: Root Antigravity instruction enforcing mandatory plan checking and synchronous updating on every change.
  - `AGENTS.md`: Cross-agent directives for scope discipline, responsible AI claims, and security boundaries.
  - `.agents/rules/plan-discipline.md`: Antigravity rule requiring continuous synchronization of `plan/` artifacts.
- **Repository Setup**:
  - `.gitignore`: Comprehensive ignore rules for Node, Python, Next.js, and secrets.
  - `.env.example`: Configuration template for Supabase, Gemini, Groq, Vapi, WhatsApp, and Edge Agent credentials.
  - Initialized Git repository.

#### Verified
- Verified all planning files and rule files created and cross-linked with `file://` URIs.
- Completed Track 0 tasks: `TSK-INIT-01`, `TSK-INIT-02`, and `TSK-INIT-03` in `plan/TASKS.md`.
