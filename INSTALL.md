# DrishtiFlow — Project Initiation & Runbook

This file contains every command you need to go from a fresh clone to a fully running DrishtiFlow instance, in the correct order.

> **Working directory:** `C:\FarhanHackathon\BWB Microsoft\Build_with_Bharat` (repo root)

---

## 0. Prerequisites

| Tool | Minimum Version | Verify With |
|------|-----------------|-------------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | 2.30+ | `git --version` |

**Python packages already installed on this machine:** `torch`, `torchvision`, `ultralytics`, `opencv-python`, `numpy`, `fastapi`, `uvicorn`, `pydantic`, `httpx`, `pytest`, `yt-dlp`

---

## 1. Clone / Open the Repository

If you already have the repo locally, skip to Step 2.

```powershell
# Clone (if not already done)
git clone <repository-url> drishtiflow
cd drishtiflow
```

---

## 2. Environment Setup

### 2a. Copy environment template

```powershell
copy .env.example .env
```

Edit `.env` and fill in any real keys you have (Gemini/Groq, Vapi, WhatsApp). **Important:** make sure `NEXT_PUBLIC_API_URL=http://localhost:8000` is set — the frontend needs it to call the API (Next.js only exposes `NEXT_PUBLIC_*` variables to the browser). For a local demo, leaving other keys as placeholders is fine — the API falls back to deterministic mocks safely.

### 2b. Python virtual environment (API + Edge Agent)

```powershell
# Create venv
python -m venv .venv

# Activate
.venv\Scripts\Activate.ps1

# Install API dependencies
pip install -r services/api\requirements.txt

# Install edge-agent extras (YOLO + video tooling)
pip install ultralytics opencv-python numpy yt-dlp python-multipart
```

### 2c. Node.js dependencies (Frontend)

```powershell
npm install
```

This installs workspace dependencies for `apps/web` and `packages/*`.

---

## 3. Verify the Installation

### 3a. Run the full test suite (recommended first check)

```powershell
python -m pytest services/api/tests services/edge-agent/tests -q
```

Expected: **41/41 passed** (or whatever the current count is).

### 3b. Lint the frontend

```powershell
npm run lint --workspace=apps/web
```

Expected: `✔ No ESLint warnings or errors`

### 3c. Build the frontend (production check)

```powershell
npm run build --workspace=apps/web
```

Expected: Compiles successfully (~102 kB First Load JS).

---

## 4. Start the Services

You need **two terminals**:

| Terminal | Service | Port |
|----------|---------|------|
| Terminal A | FastAPI Backend | 8000 |
| Terminal B | Next.js Frontend | 3000 |

### Terminal A — Backend (FastAPI)

```powershell
# From repo root
.venv\Scripts\Activate.ps1
cd services\api
python -m uvicorn app.main:app --port 8000 --reload
```

Verify it's up:

```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/v1/health -UseBasicParsing
```

Expected: `{"status":"healthy","service":"drishtiflow-api","version":"3.0.0",...}`

### Terminal B — Frontend (Next.js)

```powershell
# From repo root (new terminal)
npm run dev:web
```

Or equivalently:

```powershell
npm run dev --workspace=apps/web
```

Open your browser to: **http://localhost:3000**

---

## 5. End-to-End Demo Flow (Manual)

Once both services are running, here is the complete demo path:

1. **Open the UI:** http://localhost:3000
2. **Command Center tab:** View live camera feeds and incident feed.
3. **Workflow Graph tab:** Create/compile a rule (Hindi/Hinglish/English supported), e.g.:
   - `"agar koi insaan zone me aaye to WhatsApp bhej do"`
4. **Zone Canvas:** Draw a restricted polygon on the camera preview.
5. **Trigger an event:** The edge pipeline (or sample simulation) emits a candidate event → backend verifies → policy evaluates → action dispatches (sandbox WhatsApp).
6. **Incident Center:** View incidents with verifier confidence, policy reason, and operator feedback controls.

### Test the API directly (optional)

```powershell
# Health
Invoke-WebRequest -Uri http://localhost:8000/api/v1/health -UseBasicParsing

# Compile a vernacular rule
$body = '{"prompt":"agar koi insaan zone me aaye to alert karo","language":"hinglish"}'
Invoke-WebRequest -Uri http://localhost:8000/api/v1/workflows/compile -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing

# List cameras
Invoke-WebRequest -Uri http://localhost:8000/api/v1/cameras -UseBasicParsing

# List incidents
Invoke-WebRequest -Uri http://localhost:8000/api/v1/incidents -UseBasicParsing
```

---

## 6. Run Real YOLOv8n Edge Pipeline on CCTV Footage

This runs the full edge-vision pipeline against a real downloaded CCTV video:

### 6a. Download real incident footage (already done in this repo)

The file `services/edge-agent/assets/videos/cctv_intrusion_1.mp4` (23.7 MB) is already present. To download more:

```powershell
pip install yt-dlp
yt-dlp -f "mp4[height<=480]/mp4" --no-playlist -o "services/edge-agent/assets/videos/cctv_intrusion_%(ext)s" "ytsearch1:warehouse theft caught on cctv camera"
```

### 6b. Run the YOLO pipeline

```powershell
.venv\Scripts\Activate.ps1
python services/edge-agent/tools/run_real_video_pipeline.py
```

What happens:
1. YOLOv8n loads (`yolov8n.pt`, 6.2 MB, auto-downloads on first run if missing).
2. Processes the CCTV video at stride 3 (~10 FPS effective from 30 FPS source).
3. Detects `person` class inside the restricted zone polygon.
4. After 1.5s dwell, emits a candidate event to `http://localhost:8000/api/v1/events/candidates`.
5. Backend verifies, evaluates policy, and dispatches sandbox actions.

Expected output: events emitted with `status=confirmed` or `status=uncertain`, and `verifier_decision=confirmed`.

> **Note:** The backend API (Step 4, Terminal A) must be running before Step 6b.

---

## 7. Run Tests Again After Changes

```powershell
# Backend + edge agent tests
python -m pytest services/api/tests services/edge-agent/tests -q

# Frontend lint
npm run lint --workspace=apps/web

# Frontend build
npm run build --workspace=apps/web
```

---

## 8. Stop Services

| Service | How to Stop |
|---------|-------------|
| FastAPI (uvicorn) | `Ctrl+C` in Terminal A, or `Get-Process | Where-Object { $_.ProcessName -eq 'python' } \| Stop-Process -Force` |
| Next.js (dev) | `Ctrl+C` in Terminal B |

---

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'ultralytics'` | Run `pip install ultralytics` inside `.venv` |
| `npm ERR!` on `npm install` | Delete `node_modules` and `package-lock.json`, then `npm install` again |
| Port 8000 already in use | `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess` then kill it |
| YOLO slow under pytest | Run `test_inference_performance_budget` in isolation: `pytest services/edge-agent/tests/test_yolo_detector.py::test_inference_performance_budget -v` |
| `.env` secrets missing | The API degrades safely to mock providers; demo still works |
| `RuntimeError: Form data requires "python-multipart" to be installed` | Run `pip install python-multipart` inside `.venv` (already in `services/api/requirements.txt`) |

---

## 10. File Summary (what you created/modified)

| Path | Purpose |
|------|---------|
| `services/edge-agent/inference/yolo_detector.py` | Real YOLOv8n edge detector |
| `services/edge-agent/tools/run_real_video_pipeline.py` | Full pipeline runner on real CCTV |
| `services/edge-agent/assets/videos/cctv_intrusion_1.mp4` | Real intrusion test footage (23.7 MB) |
| `services/edge-agent/tests/test_yolo_detector.py` | YOLO unit tests (4 tests) |
| `yolov8n.pt` | YOLOv8n model weights (6.2 MB, auto-managed by Ultralytics) |
| `plan/TASKS.md`, `plan/CHANGELOG.md`, `plan/STATE.md` | Updated plan artifacts (30/30 tasks, 41/41 tests) |

---

## Quick Reference (copy-paste all in order)

```powershell
# 1. Environment
copy .env.example .env
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r services/api\requirements.txt
pip install ultralytics opencv-python numpy yt-dlp python-multipart
npm install

# 2. Verify
python -m pytest services/api/tests services/edge-agent/tests -q
npm run lint --workspace=apps/web
npm run build --workspace=apps/web

# 3. Start backend (Terminal A)
cd services\api
python -m uvicorn app.main:app --port 8000 --reload

# 4. Start frontend (Terminal B)
npm run dev:web

# 5. Open http://localhost:3000

# 6. Real YOLO pipeline (after backend is up)
python services/edge-agent/tools/run_real_video_pipeline.py
```
