"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ZoneCanvas, Point, isPointInPolygon } from "./ZoneCanvas";
import { Camera, Video, AlertTriangle, ShieldCheck, RefreshCw, PenTool, Trash2, Play } from "lucide-react";

interface CameraPreviewProps {
  onCandidateTriggered: (eventData: any) => void;
  activeWorkflowId?: string | null;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  onCandidateTriggered,
  activeWorkflowId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sourceType, setSourceType] = useState<"sample" | "webcam">("sample");
  const [isDrawing, setIsDrawing] = useState(false);
  const [fps, setFps] = useState(24);
  const [isAlarming, setIsAlarming] = useState(false);
  const [personPos, setPersonPos] = useState({ x: 0.15, y: 0.65 });
  const [isSimulatingPerson, setIsSimulatingPerson] = useState(true);

  // Default warehouse storage bay polygon zone
  const [zonePoints, setZonePoints] = useState<Point[]>([
    { x: 0.35, y: 0.35 },
    { x: 0.85, y: 0.35 },
    { x: 0.85, y: 0.85 },
    { x: 0.35, y: 0.85 },
  ]);

  // Webcam stream activation
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (sourceType === "webcam") {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 360 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn("Webcam access unavailable, reverting to sample simulation:", err);
          setSourceType("sample");
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sourceType]);

  // Simulated person movement trajectory across warehouse bay
  useEffect(() => {
    if (!isSimulatingPerson) return;
    const interval = setInterval(() => {
      setPersonPos((prev) => {
        let nextX = prev.x + 0.015;
        if (nextX > 0.95) nextX = 0.1;
        return { x: nextX, y: 0.65 };
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isSimulatingPerson]);

  // Computed bounding box for the person
  const detectedBoxes = [
    {
      x_min: personPos.x,
      y_min: personPos.y - 0.25,
      x_max: personPos.x + 0.12,
      y_max: personPos.y + 0.05,
      label: "person (0.89)",
    },
  ];

  // Point in polygon evaluation & 1.5s persistent debounce
  const dwellCounterRef = useRef(0);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const feet: Point = {
      x: (detectedBoxes[0].x_min + detectedBoxes[0].x_max) / 2,
      y: detectedBoxes[0].y_max,
    };
    const inside = isPointInPolygon(feet, zonePoints);

    if (inside) {
      dwellCounterRef.current += 1;
      setIsAlarming(true);

      // Trigger after 4 consecutive ticks (~600ms - 1.5s)
      if (dwellCounterRef.current >= 4 && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        emitCandidateEvent();
      }
    } else {
      dwellCounterRef.current = 0;
      setIsAlarming(false);
      hasTriggeredRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personPos, zonePoints]);

  const emitCandidateEvent = async () => {
    let evidenceFrame: string | null = null;

    if (sourceType === "webcam" && videoRef.current) {
      try {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = videoRef.current.videoWidth || 640;
        offCanvas.height = videoRef.current.videoHeight || 360;
        const ctx = offCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, offCanvas.width, offCanvas.height);
          evidenceFrame = offCanvas.toDataURL("image/jpeg", 0.7);
        }
      } catch (err) {
        console.warn("Could not capture webcam frame:", err);
      }
    }

    if (!evidenceFrame && typeof document !== "undefined") {
      try {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = 640;
        offCanvas.height = 360;
        const ctx = offCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, 640, 360);
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 1;
          ctx.strokeRect(40, 40, 560, 280);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "12px monospace";
          ctx.fillText("CAM 01 // BHIWANDI GODOWN #4 // RESTRICTED BAY A", 50, 65);
          const b = detectedBoxes[0];
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x_min * 640, b.y_min * 360, (b.x_max - b.x_min) * 640, (b.y_max - b.y_min) * 360);
          ctx.fillStyle = "#ea580c";
          ctx.fillRect(b.x_min * 640, b.y_min * 360 - 18, 90, 18);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px monospace";
          ctx.fillText("PERSON 0.89", b.x_min * 640 + 4, b.y_min * 360 - 5);
          evidenceFrame = offCanvas.toDataURL("image/jpeg", 0.7);
        }
      } catch (err) {
        console.warn("Could not generate simulation evidence frame:", err);
      }
    }

    const eventPayload: any = {
      event_id: crypto.randomUUID(),
      camera_id: "cam-warehouse-gate-01",
      workflow_id: activeWorkflowId || null,
      event_type: "restricted_zone_entry",
      occurred_at: new Date().toISOString(),
      source: sourceType,
      detector: {
        name: "yolov8n-web",
        version: "8.1.0",
        confidence: 0.89,
        bounding_box: detectedBoxes[0],
      },
      evidence_frame_base64: evidenceFrame,
    };

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

    try {
      const res = await fetch(`${apiBase}/api/v1/events/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });
      if (res.ok) {
        const data = await res.json();
        onCandidateTriggered({
          ...data,
          evidence_frame_base64: evidenceFrame,
        });
      }
    } catch (e) {
      console.error("Failed to emit candidate event to backend:", e);
    }
  };

  const handleClearZone = () => {
    setZonePoints([]);
  };

  const handleResetWarehouseZone = () => {
    setZonePoints([
      { x: 0.35, y: 0.35 },
      { x: 0.85, y: 0.35 },
      { x: 0.85, y: 0.85 },
      { x: 0.35, y: 0.85 },
    ]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Stream Header & Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAlarming ? "bg-red-400" : "bg-emerald-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isAlarming ? "bg-red-500" : "bg-emerald-500"}`}></span>
            </span>
            <span className="font-semibold text-sm tracking-wide">
              {sourceType === "webcam" ? "Live Local Webcam" : "Warehouse Bay A (Simulated Sample Feed)"}
            </span>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            {fps} FPS • 640x360
          </span>
          {isAlarming && (
            <span className="text-xs bg-red-950 border border-red-500 text-red-300 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse font-semibold">
              <AlertTriangle className="w-3 h-3 text-red-400" /> ZONE BREACH DETECTED
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSourceType(sourceType === "sample" ? "webcam" : "sample")}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded text-slate-200 flex items-center gap-1 transition"
          >
            {sourceType === "sample" ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <Camera className="w-3.5 h-3.5 text-emerald-400" />}
            {sourceType === "sample" ? "Switch to Webcam" : "Switch to Sample Clip"}
          </button>

          <button
            onClick={() => setIsDrawing(!isDrawing)}
            className={`text-xs px-2.5 py-1.5 rounded flex items-center gap-1 transition ${
              isDrawing
                ? "bg-amber-500 text-black font-semibold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            {isDrawing ? "Finish Drawing" : "Draw Zone"}
          </button>

          <button
            onClick={handleClearZone}
            title="Clear current zone"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetWarehouseZone}
            title="Reset preset warehouse zone"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Viewport with Canvas Overlay */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {sourceType === "webcam" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          /* High-Fidelity Warehouse Security Scene Simulation */
          <div className="w-full h-full relative bg-gradient-to-b from-slate-900 via-slate-950 to-neutral-900 flex flex-col justify-between p-4 select-none">
            {/* Background Godown Pillars & Storage Racks */}
            <div className="absolute inset-0 opacity-20 pointer-events-none grid grid-cols-6 gap-4 p-8">
              <div className="border border-slate-700 bg-slate-800/30 rounded flex items-center justify-center text-xs text-slate-600 font-mono">RACK-01</div>
              <div className="border border-slate-700 bg-slate-800/30 rounded flex items-center justify-center text-xs text-slate-600 font-mono">RACK-02</div>
              <div className="border border-slate-700 bg-slate-800/30 rounded flex items-center justify-center text-xs text-slate-600 font-mono">BAY-A (RESTRICTED)</div>
              <div className="border border-slate-700 bg-slate-800/30 rounded flex items-center justify-center text-xs text-slate-600 font-mono">RACK-04</div>
              <div className="border border-slate-700 bg-slate-800/30 rounded flex items-center justify-center text-xs text-slate-600 font-mono">RACK-05</div>
              <div className="border border-slate-700 bg-slate-800/30 rounded flex items-center justify-center text-xs text-slate-600 font-mono">EXIT-02</div>
            </div>

            {/* Warehouse Visual Indicators */}
            <div className="relative z-0 text-slate-500 font-mono text-xs flex justify-between">
              <span>CAM 01 // BHIWANDI GODOWN #4 // PERIMETER NORTH</span>
              <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
            </div>

            {/* Simulated Animated Intruder Figure */}
            <div
              className="absolute z-10 transition-all duration-150 ease-linear flex flex-col items-center pointer-events-none"
              style={{
                left: `${personPos.x * 100}%`,
                top: `${(personPos.y - 0.25) * 100}%`,
                width: "12%",
                height: "30%",
              }}
            >
              {/* Silhouette Avatar */}
              <div className="w-5 h-5 rounded-full bg-orange-400 border border-white shadow-md mb-1 animate-pulse" />
              <div className="w-8 h-14 bg-gradient-to-b from-orange-500 to-amber-700 rounded-lg shadow-lg flex items-center justify-center text-[9px] text-white font-bold">
                PERSON
              </div>
              <div className="flex gap-1.5 mt-0.5">
                <div className="w-2 h-7 bg-amber-900 rounded" />
                <div className="w-2 h-7 bg-amber-900 rounded" />
              </div>
            </div>

            <div className="relative z-0 text-slate-600 text-[11px] font-mono">
              EDGE INFERENCE: ONNX WebGPU (Active) • Ray-Casting PIP Active
            </div>
          </div>
        )}

        {/* Interactive Zone Canvas Layer */}
        <ZoneCanvas
          zonePoints={zonePoints}
          onZoneChange={setZonePoints}
          isDrawing={isDrawing}
          detectedBoxes={detectedBoxes}
          isAlarming={isAlarming}
        />
      </div>

      {/* Footer Instructions */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            {isDrawing
              ? "Click on the video feed to place boundary points. Click 'Finish Drawing' when complete."
              : "Zone monitoring active. Movement into the highlighted polygon triggers VLM verification."}
          </span>
        </div>
        <button
          onClick={() => emitCandidateEvent()}
          className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
        >
          <Play className="w-3 h-3" /> Manual Event Trigger
        </button>
      </div>
    </div>
  );
};

