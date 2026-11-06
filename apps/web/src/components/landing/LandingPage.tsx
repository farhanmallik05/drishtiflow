import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  AlertTriangle, 
  Mic, 
  BellRing, 
  Cpu, 
  Radio, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Pause,
  Lock,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  PhoneCall,
  MessageSquare,
  Siren,
  Building2,
  Factory,
  Stethoscope,
  Store,
  Users,
  Check,
  Zap,
  Volume2,
  VolumeX,
  Clock,
  Car
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface LandingPageProps {
  onEnterDashboard: (targetTab?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  // Police Incident Simulation State
  const [isPlayingIncident, setIsPlayingIncident] = useState<boolean>(true);
  const [incidentStep, setIncidentStep] = useState<number>(1);
  const [isSirenSounding, setIsSirenSounding] = useState<boolean>(false);
  const [activePresetTab, setActivePresetTab] = useState<'mandi' | 'msme' | 'hospital' | 'kirana'>('mandi');
  const [policeDispatchProgress, setPoliceDispatchProgress] = useState<number>(20);

  const incidentVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-advance the incident simulation steps when playing
  useEffect(() => {
    let timer: any;
    if (isPlayingIncident) {
      timer = setInterval(() => {
        setIncidentStep(prev => {
          if (prev >= 5) {
            return 1;
          }
          return prev + 1;
        });
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isPlayingIncident]);

  // Update progress bar based on incidentStep
  useEffect(() => {
    setPoliceDispatchProgress(incidentStep * 20);
    if (incidentStep === 3) {
      soundManager.playAlertBeep();
    } else if (incidentStep === 5) {
      soundManager.playSuccessChime();
    }
  }, [incidentStep]);

  const toggleSirenSound = () => {
    if (!isSirenSounding) {
      soundManager.playAlarmSiren();
      setIsSirenSounding(true);
    } else {
      setIsSirenSounding(false);
    }
  };

  const handleLaunchDashboard = (tab?: string) => {
    soundManager.playSuccessChime();
    onEnterDashboard(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* 🇮🇳 Top National Hackathon Announcement Ribbon */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 text-white text-xs font-mono py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 font-bold tracking-wide">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase">HACKATHON FINALE</span>
            <span>BUILD WITH भारत 5.0 &bull; NATIONAL LEVEL HACKATHON</span>
          </div>
          <div className="text-[11px] text-orange-100 flex items-center gap-3">
            <span>TEAM EMPTY</span>
            <span>&bull;</span>
            <span>KCC Institute of Technology &amp; Management, Greater Noida</span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation Bar (Light Theme) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Vernacular Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-600 p-[2px] shadow-md">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-mono">
                  DrishtiFlow
                </span>
                <span className="text-base font-bold text-orange-600 font-sans">
                  (दृष्टि-फ़्लो)
                </span>
                <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold border border-orange-200">
                  v2.6 Bharat AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-sm sm:max-w-none">
                Vernacular No-Code AI Automation for Existing CCTV Cameras
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#police-demo" className="hover:text-orange-600 transition flex items-center gap-1.5 text-orange-600 font-bold">
              <Siren className="w-4 h-4 animate-bounce text-orange-600" />
              <span>Live Police SOS Demo</span>
            </a>
            <a href="#problem" className="hover:text-orange-600 transition">The Problem</a>
            <a href="#solution" className="hover:text-orange-600 transition">3 Pillars</a>
            <a href="#presets" className="hover:text-orange-600 transition">Bharat Presets</a>
            <a href="#comparison" className="hover:text-orange-600 transition">Comparison</a>
            <a href="#team" className="hover:text-orange-600 transition">Team Empty</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLaunchDashboard('overview')}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>LAUNCH LIVE CONSOLE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Light Clean Theme) */}
      <section className="relative pt-12 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-white via-orange-50/30 to-slate-100/60 border-b border-slate-200 overflow-hidden">
        {/* Subtle Background Radial Highlights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/80 border border-orange-300 text-orange-800 text-xs font-mono font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping" />
              <span>BROWSER-BASED 'ZAPIER FOR CCTV' &bull; ZERO SERVER GPU LAG</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Turn Any Existing CCTV Camera into an{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600">
                Active AI Agent
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
              Millions of Indian CCTV cameras only record footage for post-theft review. 
              <strong> DrishtiFlow (दृष्टि-फ़्लो)</strong> brings vernacular voice-to-workflow automation in Hindi &amp; English, 
              in-browser edge vision, and instant real-world police/owner intervention with <strong>₹0 extra hardware CapEx</strong>.
            </p>

            {/* Quick CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <a
                href="#police-demo"
                className="px-7 py-3.5 rounded-xl font-mono text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Siren className="w-4 h-4 text-white" />
                <span>WATCH LIVE POLICE SOS DEMO</span>
              </a>

              <button
                onClick={() => handleLaunchDashboard('overview')}
                className="px-6 py-3.5 rounded-xl font-mono text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-orange-600" />
                <span>EXPLORE CAMERA DASHBOARD</span>
              </button>
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-3xl mx-auto">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-2xl font-extrabold text-orange-600 font-mono">₹0</div>
                <div className="text-xs text-slate-600 font-medium">Extra Hardware CapEx</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">&lt; 5s</div>
                <div className="text-xs text-slate-600 font-medium">Incident Action Time</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-2xl font-extrabold text-blue-600 font-mono">95%+</div>
                <div className="text-xs text-slate-600 font-medium">Cloud Bandwidth Cut</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-2xl font-extrabold text-purple-600 font-mono">हिंदी + EN</div>
                <div className="text-xs text-slate-600 font-medium">Voice Automation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚨 CORE HIGHLIGHT: LIVE EMERGENCY CAMERA DETECTION & AUTOMATED POLICE STATION INTERVENTION */}
      <section id="police-demo" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-mono text-xs font-bold border border-red-200">
              <Siren className="w-4 h-4 animate-spin text-red-600" />
              <span>CRITICAL REAL-WORLD DEMONSTRATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Autonomous Emergency Detection &amp; Nearest Police Dispatch
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Watch an active CCTV camera automatically detect a person in distress, transmit instant coordinates to the nearest Police Station, and coordinate rapid PCR police arrival to rescue the individual.
            </p>
          </div>

          {/* Interactive Incident Command Canvas */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl overflow-hidden font-mono">
            {/* Top Bar of the Incident Simulator */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">LIVE INCIDENT MONITOR #9042</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/50">
                      HIGH THREAT DETECTED
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans">
                    Camera: CAM-04 (Sector 62 Mandi Gate / Perimeter Observation) &bull; Location: Greater Noida
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <button
                  onClick={() => setIsPlayingIncident(!isPlayingIncident)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  {isPlayingIncident ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingIncident ? 'PAUSE SEQUENCE' : 'PLAY SEQUENCE'}</span>
                </button>

                <button
                  onClick={toggleSirenSound}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                    isSirenSounding
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isSirenSounding ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{isSirenSounding ? 'SIREN ON' : 'TEST SIREN'}</span>
                </button>
              </div>
            </div>

            {/* Main Stage Grid: Real Video with Bounding Box (Left 7 cols) + Digital Police Dispatch Telemetry (Right 5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
              {/* Left Column: Real CCTV Video Feed */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-slate-700 shadow-inner group">
                  {/* Real Video Player */}
                  <video
                    ref={incidentVideoRef}
                    src="/videos/cam_worker_zone.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Scanlines Effect */}
                  <div className="absolute inset-0 pointer-events-none scanline opacity-25" />

                  {/* Animated Laser Scanning Reticle */}
                  <div className="absolute left-0 right-0 h-[2px] bg-red-500/80 shadow-[0_0_10px_#ef4444] pointer-events-none animate-laser" />

                  {/* Live AI Detection Bounding Box Overlay */}
                  <div className="absolute top-[28%] left-[45%] w-[38%] h-[58%] border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] rounded pointer-events-none animate-pulse">
                    {/* Corner Reticles */}
                    <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                    <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />

                    {/* AI Label Pill */}
                    <div className="absolute -top-7 left-0 bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>DISTRESS / EMERGENCY HAZARD [96.4%]</span>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-red-300 border border-red-500/40">
                      LAT: 28.6139° N &bull; LON: 77.2090° E
                    </div>
                  </div>

                  {/* Timestamp & Watermark */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] text-white border border-white/20">
                    REC ● LIVE CCTV FEED #04 &bull; 1080P 60FPS
                  </div>

                  <div className="absolute bottom-3 right-3 bg-red-950/90 border border-red-500/60 text-red-200 text-[10px] px-2.5 py-1 rounded font-bold">
                    AUTOMATIC POLICE SOS TRIGGERED
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>ONNX WebGPU Edge Filter: 14ms Latency</span>
                  </div>
                  <span className="text-orange-400 font-bold">Zero Cloud Video Streaming Bills</span>
                </div>
              </div>

              {/* Right Column: Live Digital Police Dispatch Terminal */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Siren className="w-4 h-4 animate-bounce text-red-500" />
                      <span>NEAREST POLICE DISPATCH LOG</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                      DIAL 112 INTEGRATED
                    </span>
                  </div>

                  {/* Police Station Assigned */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">ASSIGNED POLICE STATION:</span>
                      <span className="text-orange-400 font-bold">Sector 62 Police Station</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">DISPATCHED UNIT:</span>
                      <span className="text-cyan-300 font-bold">Police PCR Van #04 (Sub-Insp. R. Yadav)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">DISTANCE TO SCENE:</span>
                      <span className="text-emerald-400 font-bold">
                        {incidentStep >= 5 ? 'Arrived on Scene (0m)' : incidentStep >= 4 ? '350 meters away' : '1.2 km away'}
                      </span>
                    </div>
                  </div>

                  {/* 5-Step Progress Steps */}
                  <div className="space-y-2 text-xs">
                    <div className="text-[11px] text-slate-400 font-bold mb-1">
                      REAL-WORLD INTERVENTION PIPELINE:
                    </div>

                    {[
                      { step: 1, title: 'Edge Camera Detects Emergency Anomaly', status: incidentStep >= 1 ? 'completed' : 'pending', time: '00:00.1s' },
                      { step: 2, title: 'Gemini Video Context Verified (Distress Confirmed)', status: incidentStep >= 2 ? 'completed' : 'pending', time: '00:00.4s' },
                      { step: 3, title: 'Auto SOS Sent to Nearest Police Station + WhatsApp Snapshot', status: incidentStep >= 3 ? 'completed' : 'pending', time: '00:01.2s' },
                      { step: 4, title: 'Police PCR Van #04 Dispatched & En Route', status: incidentStep >= 4 ? 'completed' : 'pending', time: '00:02.0s' },
                      { step: 5, title: 'Police Arrives On Scene & Rescues Victim (Resolved)', status: incidentStep >= 5 ? 'completed' : 'pending', time: '01:42.0s' }
                    ].map((s) => (
                      <div
                        key={s.step}
                        onClick={() => setIncidentStep(s.step)}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${
                          incidentStep === s.step
                            ? 'bg-orange-950/70 border-orange-500 text-orange-200 shadow-[0_0_15px_rgba(234,88,12,0.3)] font-bold'
                            : s.status === 'completed'
                            ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {s.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                              {s.step}
                            </span>
                          )}
                          <span className="line-clamp-1">{s.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">{s.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Real-world Action Preview Box (WhatsApp snapshot & VAPI Phone call) */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp Police Payload
                      </span>
                      <span className="text-[10px] text-slate-400">Delivered with GPS Pin</span>
                    </div>
                    <div className="p-2.5 rounded bg-black/60 border border-slate-800 font-sans text-[11px] text-slate-300">
                      &ldquo;🚨 <strong>EMERGENCY ALERT:</strong> Person in distress detected at Shop #14, Main Mandi Road. PCR Van #04 dispatched. Snapshot proof attached.&rdquo;
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="p-3.5 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-200 text-xs flex items-center justify-between">
                  <span>SYSTEM OUTCOME:</span>
                  <span className="font-bold text-white">
                    {incidentStep >= 5 ? '✓ Person Assisted & Scene Secured' : 'Dispatch & Tracking in Progress...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 2: The Problem Statement (Clean Light Cards) */}
      <section id="problem" className="py-16 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono font-bold text-orange-600 tracking-wider uppercase">
              THE PASSIVE CCTV CRISIS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Millions of Indian Cameras Only Record Footage for Post-Loss Review
            </h2>
            <p className="text-slate-600 text-sm">
              Traditional CCTV systems fail Indian MSMEs, hospitals, and mandis with prohibitive CapEx and zero proactive safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Problem Card 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg font-mono">
                99%
              </div>
              <h3 className="font-bold text-lg text-slate-900">Passive 'Dumb' CCTV</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Cameras in mandis, godowns, hospitals, and shops only store DVR video for review <em>after</em> a theft, fire, or tragedy has occurred.
              </p>
              <div className="text-xs text-orange-700 bg-orange-50 p-2.5 rounded-lg border border-orange-200 font-medium">
                Blindspots: Night godown break-ins and smoke discovered only the next morning.
              </div>
            </div>

            {/* Problem Card 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg font-mono">
                ₹1L+
              </div>
              <h3 className="font-bold text-lg text-slate-900">Prohibitive Upgrade Cost</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Smart AI NVR boxes, enterprise GPU servers, and 24/7 security guards cost ₹25,000 to ₹1 Lakh+ CapEx—completely out of reach for small businesses.
              </p>
              <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                Bandwidth Lock-in: 24/7 cloud uploads choke Tier-2/3 internet and inflate monthly bills.
              </div>
            </div>

            {/* Problem Card 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg font-mono">
                0%
              </div>
              <h3 className="font-bold text-lg text-slate-900">Complex Menus: Zero Hindi UX</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Existing VMS software requires technical coding, English-only enterprise menus, and causes massive alert fatigue from false motion alarms.
              </p>
              <div className="text-xs text-red-800 bg-red-50 p-2.5 rounded-lg border border-red-200 font-medium">
                OPD &amp; Factory Delays: Patient fainting spells or missing PPE are missed while staff is occupied.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 3: The DrishtiFlow Solution (The 3 Pillars) */}
      <section id="solution" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono font-bold text-orange-600 tracking-wider uppercase">
              THE 3 ARCHITECTURAL PILLARS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              How DrishtiFlow Solves the Surveillance Crisis
            </h2>
            <p className="text-slate-600 text-sm">
              A browser-native AI agent pipeline combining vernacular voice programming, two-stage context check, and instant real-world action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-orange-50/50 to-white border-2 border-orange-200 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md">
                <Mic className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono font-bold text-orange-600 uppercase">PILLAR 1</div>
              <h3 className="text-xl font-bold text-slate-900">Voice-to-Workflow Builder</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>Speak rules in Hindi / Hinglish:</strong><br />
                &ldquo;Agar godown mein raat 10 baje ke baad koi dikhe ya dhuwan uthe, toh mujhe call karo.&rdquo;
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-orange-100 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Gemini 2.5 compiles spoken words into visual node graph</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Zero extra hardware: runs in any standard web browser</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white border-2 border-blue-200 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono font-bold text-blue-600 uppercase">PILLAR 2</div>
              <h3 className="text-xl font-bold text-slate-900">Hybrid Edge + VLM Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>Zero-Server Edge Filter:</strong> In-browser vision (YOLOv8 + ONNX Runtime Web) detects motion and objects locally with zero lag.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-blue-100 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Gemini Video &amp; Groq verify context (bending down vs fainting)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Near-zero false alarms with 95%+ bandwidth reduction</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white border-2 border-emerald-200 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600 uppercase">PILLAR 3</div>
              <h3 className="text-xl font-bold text-slate-900">Real-World Actions &amp; Presets</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>Active Hindi AI Phone Call:</strong> Places an instant outbound call via VAPI to wake or alert the business owner or nearest police.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-emerald-100 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp photo proof &amp; loud regional siren</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>1-Click Bharat Presets for Mandi, MSME, OPD &amp; Kirana</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 4: Flow of Solution (The 4-Step Automation Loop) */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono font-bold text-orange-600 tracking-wider uppercase">
              4-STEP AUTOMATION LOOP
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              From Spoken Voice to Real-World Police &amp; Owner Action
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                  1
                </span>
                <span className="text-[10px] font-mono text-orange-600 font-bold">VOICE-TO-WORKFLOW</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Gemini 2.5 Compiler</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                User speaks in Hindi/Hinglish/English. Gemini converts it into a visual Trigger &rarr; Reason &rarr; Act JSON graph.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                  2
                </span>
                <span className="text-[10px] font-mono text-blue-600 font-bold">EDGE VISION FILTER</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">YOLOv8 + ONNX Web</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lightweight in-browser vision detects motion, people, or objects locally with zero cloud lag and zero GPU costs.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                  3
                </span>
                <span className="text-[10px] font-mono text-purple-600 font-bold">SMART CONTEXT CHECK</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Gemini Video + Groq</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verifies real semantic context when triggered (e.g. distinguishing bending down vs fainting in a hospital OPD).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                  4
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">INSTANT ACTION</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">VAPI + WhatsApp + Police</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically places an AI phone call in Hindi, sends a WhatsApp snapshot, or triggers nearest Police SOS dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 8: 1-Click Bharat Presets (Interactive Tabs) */}
      <section id="presets" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-mono font-bold text-orange-600 tracking-wider uppercase">
              TAILORED FOR INDIAN USE CASES
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              1-Click Bharat Security &amp; Safety Presets
            </h2>
            <p className="text-slate-600 text-sm">
              Instant pre-configured templates for 63M+ Indian MSMEs, Mandis, Kiranas, and Hospitals.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mb-8">
            {[
              { id: 'mandi', label: '🌾 Mandi & Godown', icon: Building2 },
              { id: 'msme', label: '🏭 MSME Factory Safety', icon: Factory },
              { id: 'hospital', label: '🏥 Hospital OPD Triage', icon: Stethoscope },
              { id: 'kirana', label: '🏪 Kirana Counter Alerts', icon: Store }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundManager.playRadarPing();
                    setActivePresetTab(tab.id as any);
                  }}
                  className={`p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition cursor-pointer ${
                    activePresetTab === tab.id
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Preset Active Detail Box */}
          <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm font-sans">
            {activePresetTab === 'mandi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xl text-slate-900">Mandi &amp; Godown Security Preset</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-100 text-orange-800">
                    PRESET ACTIVE
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Automatically detects night break-ins, unauthorized entry after 10 PM, thermal fire/smoke spikes, or stray cattle damaging grain storage bags.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">TRIGGER RULE</span>
                    <strong className="text-slate-900">Person / Cattle after 22:00</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">VERIFICATION</span>
                    <strong className="text-blue-600">Gemini Video Context Check</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">REAL-WORLD ACTION</span>
                    <strong className="text-emerald-600">VAPI Hindi Phone Call + Siren</strong>
                  </div>
                </div>
              </div>
            )}

            {activePresetTab === 'msme' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xl text-slate-900">MSME Factory Safety Preset</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                    PRESET ACTIVE
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Real-time worker pose and protective equipment inspection. Flags missing safety helmets, vests, or individuals stepping too close to active machinery.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">TRIGGER RULE</span>
                    <strong className="text-slate-900">Missing Helmet / Unsafe Zone</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">VERIFICATION</span>
                    <strong className="text-blue-600">YOLOv8 Pose + Edge Gating</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">REAL-WORLD ACTION</span>
                    <strong className="text-emerald-600">On-site Acoustic Alarm + WhatsApp</strong>
                  </div>
                </div>
              </div>
            )}

            {activePresetTab === 'hospital' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xl text-slate-900">Hospital OPD Triage Preset</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800">
                    PRESET ACTIVE
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Monitors crowded hospital waiting areas. Uses two-stage verification to distinguish someone simply bending down to tie their shoe vs a patient experiencing a sudden fainting spell or fall.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">TRIGGER RULE</span>
                    <strong className="text-slate-900">Motionless Subject on Floor</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">VERIFICATION</span>
                    <strong className="text-blue-600">Gemini Video Fall Discrimination</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">REAL-WORLD ACTION</span>
                    <strong className="text-emerald-600">Duty Nurse Pager &amp; Stretcher Call</strong>
                  </div>
                </div>
              </div>
            )}

            {activePresetTab === 'kirana' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xl text-slate-900">Kirana Counter Alerts Preset</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                    PRESET ACTIVE
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Protects retail shop counters when the owner steps away to the back store. Detects unattended customers waiting or unauthorized hands reaching over the cash drawer.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">TRIGGER RULE</span>
                    <strong className="text-slate-900">Customer at Counter &gt; 10s</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">VERIFICATION</span>
                    <strong className="text-blue-600">Local Edge Camera Bounding Box</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">REAL-WORLD ACTION</span>
                    <strong className="text-emerald-600">Backroom Chime + Phone Vibrate</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Slide 7: Competitor Benchmark Table (Light Table) */}
      <section id="comparison" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono font-bold text-orange-600 tracking-wider uppercase">
              COMPETITOR BENCHMARK
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Enterprise AI Vision on Zero-Cost Existing Hardware
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">Capability / Feature</th>
                  <th className="py-3.5 px-5">Legacy DVR / CCTV</th>
                  <th className="py-3.5 px-5">Enterprise AI NVR</th>
                  <th className="py-3.5 px-5">Cloud VMS</th>
                  <th className="py-3.5 px-5 bg-orange-50 text-orange-700 font-bold">DrishtiFlow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-800">Extra Hardware Cost</td>
                  <td className="py-3.5 px-5 text-slate-500">₹0 (Passive only)</td>
                  <td className="py-3.5 px-5 text-red-600">₹40k–₹1L+ Box</td>
                  <td className="py-3.5 px-5 text-red-600">Cloud GPU Fees</td>
                  <td className="py-3.5 px-5 bg-orange-50/70 font-bold text-emerald-600">₹0 (In-Browser)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-800">Vernacular Voice Setup</td>
                  <td className="py-3.5 px-5 text-slate-500">No</td>
                  <td className="py-3.5 px-5 text-slate-500">No (Tech UI)</td>
                  <td className="py-3.5 px-5 text-slate-500">English-only</td>
                  <td className="py-3.5 px-5 bg-orange-50/70 font-bold text-orange-600">Hindi / Hinglish</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-800">Edge + VLM Context</td>
                  <td className="py-3.5 px-5 text-slate-500">Motion only (False alarms)</td>
                  <td className="py-3.5 px-5 text-slate-500">Fixed rules</td>
                  <td className="py-3.5 px-5 text-slate-500">Cloud-heavy</td>
                  <td className="py-3.5 px-5 bg-orange-50/70 font-bold text-blue-600">YOLOv8 + Gemini Video</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-800">Hindi AI Phone Call / Police SOS</td>
                  <td className="py-3.5 px-5 text-slate-500">No</td>
                  <td className="py-3.5 px-5 text-slate-500">App push only</td>
                  <td className="py-3.5 px-5 text-slate-500">Webhook only</td>
                  <td className="py-3.5 px-5 bg-orange-50/70 font-bold text-emerald-600">Yes (VAPI + WA + SOS)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-800">1-Click Bharat Presets</td>
                  <td className="py-3.5 px-5 text-slate-500">No</td>
                  <td className="py-3.5 px-5 text-slate-500">No</td>
                  <td className="py-3.5 px-5 text-slate-500">Generic</td>
                  <td className="py-3.5 px-5 bg-orange-50/70 font-bold text-orange-600">Mandi / OPD / MSME</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Slide 9: Team Empty & College Attribution */}
      <section id="team" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-mono font-bold text-orange-600 tracking-wider uppercase">
              MEET THE BUILDERS
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Team Empty &bull; Build With भारत 5.0
            </h2>
            <p className="text-slate-600 text-sm">
              KCC Institute of Technology and Management, Greater Noida
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: 'Farhan Mallik', role: 'Team Lead & Presenter', focus: 'Gemini & Architecture' },
              { name: 'Kartikey Bisht', role: 'ML Specialist', focus: 'ONNX WebGPU & YOLO' },
              { name: 'Ankit Maurya', role: 'Backend Developer', focus: 'Groq & Video Engine' },
              { name: 'Piyush Kumar Gautam', role: 'Frontend UI/UX', focus: 'Vite, Three.js & Tail' },
              { name: 'Kaushendra Singh', role: 'AI Developer & Tester', focus: 'VAPI Voice & SOS API' }
            ].map(m => (
              <div key={m.name} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold font-mono mx-auto flex items-center justify-center text-sm">
                  {m.name.charAt(0)}
                </div>
                <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                <div className="text-xs text-orange-600 font-medium">{m.role}</div>
                <div className="text-[10px] text-slate-500 font-mono">{m.focus}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-10 bg-slate-900 text-slate-400 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-white">DrishtiFlow (दृष्टि-फ़्लो)</span>
            <span>&bull;</span>
            <span>Build with भारत 5.0 National Hackathon</span>
          </div>

          <div className="flex items-center gap-4">
            <span>KCC ITM, Greater Noida</span>
            <span>&bull;</span>
            <button
              onClick={() => handleLaunchDashboard('overview')}
              className="text-orange-400 hover:text-orange-300 font-bold cursor-pointer"
            >
              Open Dashboard Console &rarr;
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
