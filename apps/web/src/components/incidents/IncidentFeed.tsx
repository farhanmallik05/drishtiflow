"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Clock, ShieldCheck, ThumbsUp, ThumbsDown, HelpCircle, BellRing, PhoneCall, MessageSquare } from "lucide-react";
import { ActionTester } from "./ActionTester";

export interface Incident {
  id: string;
  camera_id: string;
  camera_name?: string;
  event_type: string;
  status: string;
  detector_confidence: number;
  verifier_confidence?: number;
  reason?: string;
  occurred_at: string;
  evidence_frame_base64?: string;
  evidence_url?: string;
}

interface IncidentFeedProps {
  latestIncident?: Incident | null;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({ latestIncident }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<Record<string, string>>({});

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  // Fetch recent incidents on mount
  useEffect(() => {
    fetch(`${apiBase}/api/v1/incidents?limit=20`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setIncidents(data);
      })
      .catch((err) => console.warn("Failed to fetch initial incidents:", err));
  }, [apiBase]);

  // Prepend latest incident when candidate triggered
  useEffect(() => {
    if (latestIncident) {
      setIncidents((prev) => {
        const exists = prev.some((i) => i.id === latestIncident.id);
        if (exists) return prev;
        return [latestIncident, ...prev];
      });
    }
  }, [latestIncident]);

  const handleFeedback = async (incidentId: string, label: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/incidents/${incidentId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, note: "Operator evaluation input" }),
      });
      if (res.ok) {
        setFeedbackSuccess((prev) => ({ ...prev, [incidentId]: label }));
      }
    } catch (e) {
      console.error("Failed to submit feedback:", e);
    }
  };

  const handleAcknowledge = async (incidentId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/incidents/${incidentId}/acknowledge`, {
        method: "POST",
      });
      if (res.ok) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? { ...i, status: "acknowledged" } : i))
        );
      }
    } catch (e) {
      console.error("Failed to acknowledge incident:", e);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-slate-100 flex items-center gap-2">
              Live Incident Center <span className="text-xs text-slate-400 font-mono">({incidents.length} events)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Contextually verified candidate events with operator audit feedback.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsTesterOpen(true)}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          Test Notification Channels
        </button>
      </div>

      {/* Incidents List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {incidents.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            No incidents detected yet. Area perimeter is secure.
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition flex flex-col gap-3"
            >
              {/* Event Header */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      inc.status === "action_sent" || inc.status === "confirmed"
                        ? "bg-red-500"
                        : inc.status === "uncertain"
                        ? "bg-amber-500"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="font-semibold text-slate-100 uppercase tracking-wide">
                    {inc.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {inc.camera_name || "Perimeter Camera"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(inc.occurred_at).toLocaleTimeString()}
                </div>
              </div>

              {/* Confidence Comparison Band (PRD §13.3) */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Edge Detector Conf:
                  </span>
                  <span className="font-mono text-orange-400 font-semibold">
                    {Math.round(inc.detector_confidence * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Context VLM Conf:
                  </span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {inc.verifier_confidence ? `${Math.round(inc.verifier_confidence * 100)}%` : "Pending"}
                  </span>
                </div>
              </div>

              {/* Reasoning Description */}
              {inc.reason && (
                <div className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded border border-slate-800/50">
                  <span className="font-semibold text-slate-400 block text-[10px] uppercase mb-0.5">
                    Verifier Explanation:
                  </span>
                  {inc.reason}
                </div>
              )}

              {/* Snapshot Evidence Thumbnail (PRD §13.3) */}
              {(inc.evidence_frame_base64 || inc.evidence_url) && (
                <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black/50 w-full max-w-sm aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inc.evidence_frame_base64 || inc.evidence_url}
                    alt={`Incident evidence for ${inc.id}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 border border-slate-700 text-[10px] font-mono text-slate-300 px-2 py-0.5 rounded shadow">
                    Keyframe Evidence
                  </span>
                </div>
              )}

              {/* Actions & Feedback Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-slate-300">
                    Status: {inc.status}
                  </span>
                  {inc.status !== "acknowledged" && (
                    <button
                      onClick={() => handleAcknowledge(inc.id)}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 underline font-medium"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>

                {/* Operator Feedback Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 mr-1">Feedback:</span>
                  {feedbackSuccess[inc.id] ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      Recorded: {feedbackSuccess[inc.id]}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleFeedback(inc.id, "true_positive")}
                        title="Mark as True Positive"
                        className="px-2 py-1 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 rounded text-[11px] flex items-center gap-1 text-slate-400 transition"
                      >
                        <ThumbsUp className="w-3 h-3" /> Real Event
                      </button>
                      <button
                        onClick={() => handleFeedback(inc.id, "false_positive")}
                        title="Mark as False Positive"
                        className="px-2 py-1 bg-slate-800 hover:bg-red-950/60 hover:text-red-300 rounded text-[11px] flex items-center gap-1 text-slate-400 transition"
                      >
                        <ThumbsDown className="w-3 h-3" /> False Alarm
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ActionTester
        isOpen={isTesterOpen}
        onClose={() => setIsTesterOpen(false)}
      />
    </div>
  );
};

