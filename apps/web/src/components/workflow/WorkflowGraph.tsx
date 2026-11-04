"use client";

import React, { useState } from "react";
import { ArrowRight, Eye, ShieldAlert, Bell, CheckCircle, Play, Pause, Settings, Sliders } from "lucide-react";

interface WorkflowGraphProps {
  workflow: any;
  onActivate: (workflowId: string) => void;
  onPause: (workflowId: string) => void;
}

export const WorkflowGraph: React.FC<WorkflowGraphProps> = ({
  workflow,
  onActivate,
  onPause,
}) => {
  const [selectedNode, setSelectedNode] = useState<"trigger" | "verify" | "action">("trigger");
  const [minConfidence, setMinConfidence] = useState(0.55);
  const [cooldown, setCooldown] = useState(60);
  const [enableWhatsApp, setEnableWhatsApp] = useState(true);
  const [enableVoice, setEnableVoice] = useState(false);
  const [status, setStatus] = useState<"draft" | "active" | "paused">("draft");

  if (!workflow) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        <Sliders className="w-10 h-10 mx-auto mb-2 text-slate-700" />
        <p className="text-sm font-medium">No workflow compiled yet.</p>
        <p className="text-xs text-slate-600 mt-1">
          Use the Vernacular Rule Builder above to generate a Trigger → Verify → Action workflow.
        </p>
      </div>
    );
  }

  const handleActivateToggle = async () => {
    if (status === "active") {
      setStatus("paused");
      onPause(workflow.id || "wf-demo");
    } else {
      setStatus("active");
      onActivate(workflow.id || "wf-demo");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-semibold text-base text-slate-100 flex items-center gap-2">
            Workflow Architecture Graph <span className="text-xs text-slate-400 font-mono">v1.0</span>
          </h2>
          <p className="text-xs text-slate-400">
            Click any node below to inspect and customize its runtime execution policies.
          </p>
        </div>

        {/* Workflow State Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleActivateToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              status === "active"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
            }`}
          >
            {status === "active" ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Monitoring Active (Pause)
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Activate Workflow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Three-Node Flowchart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative py-2">
        {/* 1. Trigger Node */}
        <div
          onClick={() => setSelectedNode("trigger")}
          className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            selectedNode === "trigger"
              ? "bg-orange-950/30 border-orange-500 shadow-lg shadow-orange-950/50"
              : "bg-slate-950 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-orange-400 tracking-wider font-semibold">
                Node 01 // Trigger
              </span>
              <Eye className="w-4 h-4 text-orange-400" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 mb-1">Edge Zone Detector</h3>
            <p className="text-xs text-slate-400">
              YOLOv8 Person detection inside restricted polygon coordinates with 1.5s persistence.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
            Conf: ≥ {minConfidence} • 1.5s Dwell
          </div>
        </div>

        {/* 2. Verify Node */}
        <div
          onClick={() => setSelectedNode("verify")}
          className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            selectedNode === "verify"
              ? "bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-950/50"
              : "bg-slate-950 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-blue-400 tracking-wider font-semibold">
                Node 02 // Verify
              </span>
              <ShieldAlert className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 mb-1">Contextual VLM Check</h3>
            <p className="text-xs text-slate-400">
              Evaluates keyframe against semantic prompt to reject shadows, glares, or non-breach motion.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
            5-State Decision • Cloud / Mock
          </div>
        </div>

        {/* 3. Action Node */}
        <div
          onClick={() => setSelectedNode("action")}
          className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            selectedNode === "action"
              ? "bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-950/50"
              : "bg-slate-950 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider font-semibold">
                Node 03 // Action
              </span>
              <Bell className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 mb-1">Idempotent Dispatcher</h3>
            <p className="text-xs text-slate-400">
              Pushes live dashboard cards, WhatsApp message with snapshot link, and optional voice alert.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
            Cooldown: {cooldown}s • Idempotent
          </div>
        </div>
      </div>

      {/* Selected Node Parameter Customizer Drawer */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-orange-400" />
          Configuring: {selectedNode.toUpperCase()} Node
        </h4>

        {selectedNode === "trigger" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Minimum Detection Confidence ({minConfidence}):</label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Persistent Dwell Threshold:</label>
              <span className="font-mono text-slate-200">1.5 seconds (4 consecutive frames)</span>
            </div>
          </div>
        )}

        {selectedNode === "verify" && (
          <div className="text-xs space-y-2">
            <label className="text-slate-400 block">Verification Prompt:</label>
            <input
              type="text"
              readOnly
              value={workflow.verification?.instruction || "Verify whether a person is clearly visible inside the designated zone."}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono text-xs"
            />
            <span className="text-[11px] text-slate-500 block">
              Fallback strategy: Offline mock verifier activates automatically if internet or VLM API times out.
            </span>
          </div>
        )}

        {selectedNode === "action" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Cooldown Suppression ({cooldown}s):</label>
              <input
                type="range"
                min="15"
                max="300"
                step="15"
                value={cooldown}
                onChange={(e) => setCooldown(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="wa"
                checked={enableWhatsApp}
                onChange={(e) => setEnableWhatsApp(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <label htmlFor="wa" className="text-slate-300">WhatsApp Notification</label>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="voice"
                checked={enableVoice}
                onChange={(e) => setEnableVoice(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <label htmlFor="voice" className="text-slate-300">Outbound Voice Call</label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
