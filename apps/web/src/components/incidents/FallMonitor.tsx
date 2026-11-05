"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (e) {
    return iso;
  }
};

interface ActiveFall {
  track_id: string;
  camera_id: string;
  state: string;
  entered_fallen_at: string | null;
  confidence: number;
  bounding_box: { x_min: number; y_min: number; x_max: number; y_max: number } | null;
  emergency_triggered_at: string | null;
}

interface FallStatus {
  camera_id: string;
  active_falls: ActiveFall[];
  total_events: number;
  last_emergency_at: string | null;
}

export const FallMonitor: React.FC = () => {
  const [fallStatuses, setFallStatuses] = useState<FallStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergencySent, setEmergencySent] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  // Fetch fall status from backend
  const fetchFallStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/fall-monitor`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Server returned " + res.status);
      }
      const data: FallStatus[] = await res.json();
      setFallStatuses(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Could not load fall monitor data.");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Manual emergency trigger
  const triggerEmergency = async (cameraId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/fall-monitor/emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camera_id: cameraId,
          track_id: "manual",
          message: "Manual emergency trigger from Fall Monitor UI",
        }),
      });
      if (!res.ok) {
        throw new Error("Emergency dispatch failed: " + res.status);
      }
      const data = await res.json();
      setEmergencySent(data.event_id);
      setTimeout(() => setEmergencySent(null), 5000);
      // Refresh status after emergency
      await fetchFallStatus();
    } catch (err: any) {
      setError(err.message || "Emergency dispatch failed.");
    }
  };

  // Poll every 2 seconds for live fall updates
  useEffect(() => {
    fetchFallStatus();
    timerRef.current = setInterval(fetchFallStatus, 2000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [apiBase, fetchFallStatus]);

  // Calculate remaining time until emergency trigger (3 seconds from fallen_detected)
  const getTimeRemaining = (enteredFallenAt: string | null): number => {
    if (!enteredFallenAt) return 0;
    const entered = new Date(enteredFallenAt).getTime();
    const now = new Date().getTime();
    const elapsed = (now - entered) / 1000;
    const remaining = 3 - elapsed;
    return Math.max(0, Math.min(3, remaining));
  };

  const hasActiveFalls = fallStatuses.some((s) => s.active_falls.length > 0);
  const totalActiveFalls = fallStatuses.reduce((sum, s) => sum + s.active_falls.length, 0);
  const emergencyFalls = fallStatuses.flatMap((s) =>
    s.active_falls.filter((f) => f.state === "emergency_trigger")
  );

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading fall monitor...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
            <span role="img" aria-label="alert">🚨</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              Fall Monitor
              <span className="text-[10px] bg-orange-500/20 border border-orange-500/40 text-orange-300 px-2 py-0.5 rounded-full font-mono uppercase tracking-tighter">
                R1 USP
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">
              Person fall detection — 3s auto-emergency to hospital reception
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
            emergencyFalls.length > 0
              ? "bg-red-500/20 text-red-400 border border-red-500/40"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
          }`}>
            {emergencyFalls.length > 0 ? "🚨 EMERGENCY ACTIVE" : "🟢 ALL CLEAR"}
          </span>
          {emergencySent && (
            <span className="text-[10px] text-emerald-400 font-mono">
              Emergency dispatched: {emergencySent}
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {fallStatuses.length === 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400 text-sm">No cameras connected to fall monitor.</p>
          <p className="text-[10px] text-slate-500 mt-1">Start edge agent to begin fall detection.</p>
        </div>
      )}

      {/* Fall Status Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh]">
        {fallStatuses.map((status) => (
          <div
            key={status.camera_id}
            className="bg-slate-950/50 border rounded-xl p-4 flex flex-col gap-3 border-slate-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {status.camera_id.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-xs text-slate-300">{status.camera_id}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                status.active_falls.length > 0
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}>
                {status.active_falls.length} active
              </span>
            </div>

            {status.active_falls.length > 0 ? (
              status.active_falls.map((fall) => {
                const timeRemaining = getTimeRemaining(fall.entered_fallen_at);
                const isEmergency = fall.state === "emergency_trigger";
                const isFalling = fall.state === "fallen_detected";

                return (
                  <div
                    key={fall.track_id}
                    className={`p-3 rounded-lg border flex flex-col gap-2 ${
                      isEmergency
                        ? "bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        : isFalling
                        ? "bg-amber-500/10 border-amber-500/40 animate-pulse"
                        : "bg-emerald-500/10 border-emerald-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${
                        isEmergency ? "text-red-400" : isFalling ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {fall.state.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {fall.track_id}
                      </span>
                    </div>

                    {isFalling && !isEmergency && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Emergency in:</span>
                        <span className="text-sm font-bold text-red-400 font-mono">
                          {timeRemaining.toFixed(1)}s
                        </span>
                      </div>
                    )}

                    {isEmergency && (
                      <div className="flex items-center justify-between pt-2 border-t border-red-500/30">
                        <span className="text-[10px] text-red-400 font-bold">EMERGENCY</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTime(fall.emergency_triggered_at)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-slate-500">Confidence:</span>
                      <span className="text-[10px] text-slate-300 font-mono">
                        {(fall.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {!isEmergency && (
                      <button
                        onClick={() => triggerEmergency(status.camera_id)}
                        disabled={emergencySent !== null}
                        className="w-full mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded transition disabled:opacity-50"
                      >
                        🚨 Dispatch Reception
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>No active falls</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <span className="w-3 h-3 text-red-400 shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Summary footer */}
      <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Total Active Falls:</span>
          <span className={`font-bold ${totalActiveFalls > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {totalActiveFalls}
          </span>
        </div>
        <div className="text-slate-500">
          Polling every 2s • Auto-emergency at 3s
        </div>
      </div>
    </div>
  );
};

export default FallMonitor;
