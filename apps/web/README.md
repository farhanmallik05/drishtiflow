# DRISHTI FLOW – AI-POWERED SMART SURVEILLANCE & EMERGENCY DETECTION PLATFORM

> **Tagline:** *"See Everything. Detect Instantly. Respond Intelligently."*

DRISHTI FLOW is a futuristic, cybersecurity-grade smart surveillance web application combining real-time computer vision, multi-camera CCTV monitoring, voice-controlled security automation, and instant emergency dispatch workflows into a single command operations center.

---

## ⚡ Live Access

The application is actively running locally on:
👉 **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**

---

## 🚀 Key Modules & Capabilities

### 1. Futuristic 3D Landing Page
- **Cybersecurity & Advanced AI Control Room Aesthetic:** Dark navy/black backdrop (`#05070e`), electric cyan (`#00f0ff`), vibrant purple (`#8b5cf6`), emergency crimson (`#ef4444`), and tactical glassmorphism.
- **Interactive 3D Three.js Surveillance Camera:** Dome PTZ camera assembly with rotating pan-tilt turret, glowing cyan optical lens, blinking infrared diode, holographic scanning laser cone, floating AI detection particles, and mouse-tracking crosshair.
- **Interactive Scenarios Preview & AI Detection Engine Walkthrough modal.**
- **One-click transition to Live Dashboard.**

### 2. Main Dashboard & Tactical Overview
- Collapsible sidebar with quick navigation across all 10 core views.
- **Top Metric Cards:** Total Cameras, Online Feeds, Offline Feeds, People Detected (with hourly trend), Active Alerts, and Active Emergencies.
- **DEFCON Emergency Alert Banner:** Pulses in real time when high-risk events occur, with instant "Acknowledge Alert" and "Command Center" buttons.
- **Real-Time Activity Timeline & Neural Diagnostic Strip:** Live latency (14.2ms), GPU Tensor core utilization, frame drop ratio, and tripwire statuses.

### 3. AI Live Camera Monitoring
- Procedural multi-environment canvas feeds for:
  1. **Main Gate Entrance** (Turnstiles, employee access validation, pedestrian tracking)
  2. **Underground Parking B2** (Vehicle lanes, headlights, license plate bounding boxes)
  3. **Executive Corridor 3F** (Office hallways, loitering detection, motion tracking)
  4. **Rooftop North Perimeter** (Ledge safety line, hazard zone, fall risk scenario)
  5. **Server Vault Restricted** (Biometric airlock, laser tripwire intrusion)
  6. **Loading Dock South** (Cargo transport, animal detection)
- **Live Feed Features:**
  - AI Bounding Boxes with confidence percentages (e.g. `96%`, `91%`).
  - **Phosphor Green Night Vision** filter.
  - **Thermal Ironbow IR False-Color** gradient shader.
  - Digital PTZ Zoom (1x, 2x, 3x).
  - Snapshot evidence capture with camera metadata.
  - Clear **SIMULATION MODE** vs **RTSP LIVE** distinction.

### 4. AI Emergency Detection Center
- Dedicated emergency triage interface with 4 interactive audit scenarios:
  - **Scenario A: Potential Fall / Rooftop Emergency** (Person near unbarricaded ledge, erratic trajectory, "POTENTIAL FALL RISK", red warning reticle).
  - **Scenario B: Fire & Smoke Detection** (Thermal spike > 185°C, billowing smoke opacity).
  - **Scenario C: Unauthorized Entry** (Airlock tripwire breach outside authorized hours).
  - **Scenario D: Person Down** (Motionless posture on floor > 60s, medical assistance trigger).
- **Cautious AI Classifications:** Complies with Section 5 by classifying spatial acceleration and pose keypoints without asserting human intent.
- **5-Stage Verified Emergency Response Workflow:**
  `Alert Generated` &rarr; `Alert Sent` &rarr; `Security Team Notified` &rarr; `Alert Acknowledged` &rarr; `Incident Resolved` (with celebration confetti and acoustic siren control).

### 5. Voice-Controlled AI Assistant: "LISTY AI"
- Large animated pulsing microphone button with audio waveform visualizer.
- Dual language support: **English** and **Hindi (हिंदी)**.
- Integrates browser Web Speech API with fallback sample voice prompts:
  - *"Notify me if someone enters the building after 10 PM."*
  - *"Alert me if a person enters the restricted area."*
  - *"Detect any vehicle entering the parking area after midnight."*
  - *"Send an alert if smoke is detected."*
  - *(Hindi)* *"Main gate par raat 10 baje ke baad alert bhejo."*
- **Natural Language Understanding (NLU):** Extracts Target, Zone, Time Window, Severity, and Action into a structured confirmation preview with audible AI voice response (`speechSynthesis`).
- Direct injection into the Automation Engine upon activation!

### 6. Smart Automation Rule Builder
- Visual condition builder:
  `IF [Detection Type] at [Zone] AND [Time Schedule / Days] THEN [Action] & [Notify Recipients]`
- Actions: Notify Security Team, Sound Perimeter Acoustic Siren, Magnetic Vault Lockdown, Dispatch Drone, Trigger Webhook.
- Full CRUD: Create, Edit, Toggle Enable/Disable, Delete, and Trigger Counter.

### 7. Notification Center & Multi-Channel Verification
- Verified delivery state pipeline: `Generated` &rarr; `Sent` &rarr; `Delivered` &rarr; `Acknowledged` &rarr; `Resolved`.
- Multi-channel delivery badges: In-App, Browser Push, Email, SMS/WhatsApp.
- Export incident reports in JSON format.

### 8. Analytics & Activity History
- **24-Hour Temporal Detection Density Chart** (SVG area line with alert beacons).
- **Category Distribution Breakdown** (Staff, Visitors, Vehicles, Emergencies).
- **24-Hour Day x Hour Security Activity Heatmap** matrix.
- **Most Active Camera Locations Leaderboard**.

### 9. Camera Fleet Management & Privacy Masking
- Connect IP cameras via RTSP, HLS, WebRTC, or Simulation.
- Realistic RTSP Handshake / Ping connectivity test.
- **Privacy Masking Editor:** Draw hardware-level blackout polygons over sensitive areas (e.g. keypads, private screens).

### 10. Privacy, Security & RBAC Governance
- Role-Based Access Control: *Security Chief*, *Surveillance Operator*, *Threat Analyst*, *System Auditor*.
- Automated License Plate & Facial Blur policies.
- Configurable video retention (7, 30, 90, 365 days) with GDPR auto-purge.
- Immutable, searchable audit trail log.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Three.js, Lucide Icons, Canvas Confetti.
- **Audio Synthesizer:** Web Audio API procedural synthesizer (no external audio assets required).
- **Speech Engine:** Web Speech API (Recognition) + SpeechSynthesis (TTS voice feedback).
- **Backend (Included):** Python FastAPI (`backend/main.py`) with WebSockets, camera streams, and event endpoints.

---

## 💻 Running the Backend (Optional)

To start the accompanying Python FastAPI server:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
