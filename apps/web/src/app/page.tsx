"use client";

import React, { useState } from "react";
import { CameraPreview } from "@/components/camera/CameraPreview";
import { RuleBuilder } from "@/components/workflow/RuleBuilder";
import { WorkflowGraph } from "@/components/workflow/WorkflowGraph";
import { IncidentFeed, Incident } from "@/components/incidents/IncidentFeed";
import { ShopliftingLog } from "@/components/incidents/ShopliftingLog";
import { FallMonitor } from "@/components/incidents/FallMonitor";
import { Shield, Eye, Activity, Sliders, BellRing, Sparkles, Server, FileText, User } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"monitor" | "workflow" | "incidents" | "shoplifting-log" | "fall-monitor">("monitor");
  const [activeWorkflow, setActiveWorkflow] = useState<any>(null);
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);

  const handleCandidateTriggered = (data: any) => {
    if (data.incident_id) {
      setLatestIncident({
        id: data.incident_id,
        camera_id: "cam-warehouse-gate-01",
        camera_name: data.camera_name || "North Gate Perimeter Cam",
        event_type: "restricted_zone_entry",
        status: data.status,
        detector_confidence: data.detector_confidence,
        verifier_confidence: data.verifier_confidence,
        reason: data.policy_reason || "Verified presence inside restricted perimeter bay.",
        occurred_at: data.occurred_at || new Date().toISOString(),
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation & Status Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Eye className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  DrishtiFlow <span className="text-orange-400 font-hindi">(दृष्टि-फ़्लो)</span>
                </h1>
                <span className="text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Build with Bharat 5.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Shop theft detection — see who entered, when they left, and review suspect photos.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("monitor")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "monitor"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" /> Live Monitor
            </button>
            <button
              onClick={() => setActiveTab("workflow")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "workflow"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-4 h-4" /> Set Up Rules
            </button>
            <button
              onClick={() => setActiveTab("incidents")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "incidents"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BellRing className="w-4 h-4" /> Recent Events
            </button>
            <button
              onClick={() => setActiveTab("shoplifting-log")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "shoplifting-log"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" /> Shoplifting Log
            </button>
            <button
              onClick={() => setActiveTab("fall-monitor")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "fall-monitor"
                  ? "bg-red-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" /> Fall Monitor
            </button>
          </div>

          {/* System Telemetry Indicator */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>FastAPI Gateway: 8000</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>VLM Mode: Verified Fallback</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {activeTab === "monitor" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Camera Viewport (Left 7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <CameraPreview
                onCandidateTriggered={handleCandidateTriggered}
                activeWorkflowId={activeWorkflow?.id}
              />
            </div>

            {/* Realtime Incident Feed (Right 5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <IncidentFeed latestIncident={latestIncident} />
            </div>
          </div>
        )}

        {activeTab === "workflow" && (
          <div className="flex flex-col gap-6">
            <RuleBuilder
              onWorkflowCompiled={(wf) => setActiveWorkflow(wf)}
              selectedCameraId="cam-warehouse-gate-01"
            />
            <WorkflowGraph
              workflow={activeWorkflow}
              onActivate={(id) => console.log("Activated workflow:", id)}
              onPause={(id) => console.log("Paused workflow:", id)}
            />
          </div>
        )}

        {activeTab === "incidents" && (
          <div className="flex flex-col gap-4">
            <IncidentFeed latestIncident={latestIncident} />
          </div>
        )}

        {activeTab === "shoplifting-log" && (
          <div className="flex flex-col gap-4">
            <ShopliftingLog />
          </div>
        )}

        {activeTab === "fall-monitor" && (
          <div className="flex flex-col gap-4">
            <FallMonitor />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          DrishtiFlow (दृष्टि-फ़्लो) v3.0 • Built with Bharat 5.0 • Shop theft detection: entry/exit times + suspect photos •
          All actions governed by Deterministic Policy
        </p>
      </footer>
    </main>
  );
}

