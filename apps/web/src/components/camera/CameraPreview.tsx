"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ZoneCanvas, Point, isPointInPolygon } from "./ZoneCanvas";
import { Camera, Video, AlertTriangle, ShieldCheck, RefreshCw, PenTool, Trash2, Play, Upload, FileText } from "lucide-react";

interface ProcessedRecord {
  track_id: string;
  camera_id: string;
  entry_time: string;
  exit_time: string;
  duration_seconds: number;
  shelf_interaction: boolean;
  theft_suspected: boolean;
  detector_confidence: number;
  photo_url: string | null;
}

interface CameraPreviewProps {
  onCandidateTriggered: (eventData: any) => void;
  activeWorkflowId?: string | null;
  onOpenLog?: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  onCandidateTriggered,
  activeWorkflowId,
  onOpenLog,
}) => {
  const cameraId = "cam-warehouse-gate-01";
  const apiBase = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [sourceType, setSourceType] = useState<"sample" | "webcam" | "rtsp">("sample");
  const [streamUrl, setStreamUrl] = useState("0");
  const [activeStreamUrl, setActiveStreamUrl] = useState("0");
  const [annotateYolo, setAnnotateYolo] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [fps, setFps] = useState(24);
  const [isAlarming, setIsAlarming] = useState(false);
  const [personPos, setPersonPos] = useState({ x: 0.15, y: 0.65 });
  const [isSimulatingPerson, setIsSimulatingPerson] = useState(true);

  // Video upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{
    records_found: number;
    thefts_suspected: number;
    records: ProcessedRecord[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
  // Disabled when viewing uploaded video — no animation overlays on real footage.
  useEffect(() => {
    if (!isSimulatingPerson || uploadedVideoPath || sourceType !== "sample") return;
    const interval = setInterval(() => {
      setPersonPos((prev) => {
        let nextX = prev.x + 0.015;
        if (nextX > 0.95) nextX = 0.1;
        return { x: nextX, y: 0.65 };
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isSimulatingPerson, uploadedVideoPath, sourceType]);

  // Computed bounding box for the person — empty when viewing uploaded video
  const detectedBoxes = uploadedVideoPath || sourceType === "rtsp"
    ? []
    : [
        {
          x_min: personPos.x,
          y_min: personPos.y - 0.25,
          x_max: personPos.x + 0.12,
          y_max: personPos.y + 0.05,
          label: "person (0.89)",
        },
      ];

  // Point in polygon evaluation & 1.5s persistent debounce
  // Disabled when viewing uploaded video — no zone alarm overlays on real footage.
  const dwellCounterRef = useRef(0);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (uploadedVideoPath || detectedBoxes.length === 0) {
      dwellCounterRef.current = 0;
      hasTriggeredRef.current = false;
      setIsAlarming(false);
      return;
    }
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
  }, [personPos, zonePoints, uploadedVideoPath, sourceType]);

  const emitCandidateEvent = async (evidenceOverride?: string | null) => {
    let evidenceFrame: string | null = evidenceOverride ?? null;

    if (!evidenceFrame && sourceType === "webcam" && videoRef.current) {
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

    if (!evidenceFrame && detectedBoxes.length > 0 && typeof document !== "undefined") {
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
      camera_id: cameraId,
      workflow_id: activeWorkflowId || null,
      event_type: "restricted_zone_entry",
      occurred_at: new Date().toISOString(),
      source: sourceType === "webcam" ? "webcam" : sourceType === "rtsp" ? "local_agent" : "sample",
      detector: {
        name: sourceType === "rtsp" ? "yolov8n-edge" : "yolov8n-web",
        version: "8.1.0",
        confidence: 0.89,
        bounding_box: detectedBoxes[0] ?? null,
      },
      evidence_frame_base64: evidenceFrame,
    };

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

  // --- Live RTSP / Edge Stream ---
  const mjpegStreamUrl = `${apiBase}/api/v1/cameras/${encodeURIComponent(
    cameraId
  )}/stream?stream_url=${encodeURIComponent(activeStreamUrl)}&annotate=${
    annotateYolo ? "true" : "false"
  }`;

  const captureStreamSnapshot = async () => {
    setSnapshotBusy(true);
    setStreamError(null);

    try {
      const res = await fetch(
        `${apiBase}/api/v1/cameras/${encodeURIComponent(
          cameraId
        )}/snapshot?stream_url=${encodeURIComponent(activeStreamUrl)}&annotate=${
          annotateYolo ? "true" : "false"
        }`
      );
      if (!res.ok) {
        throw new Error(`Snapshot failed: HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read snapshot data"));
        reader.readAsDataURL(blob);
      });

      await emitCandidateEvent(dataUrl);
    } catch (err: any) {
      setStreamError(err?.message || "Snapshot capture failed");
    } finally {
      setSnapshotBusy(false);
    }
  };

  const handleClearZone = () => {
    setZonePoints([]);
  };

  // --- Video Upload & Processing ---
  const handleSelectVideo = () => {
    fileInputRef.current?.click();
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadedVideoPath(null);
    setUploadedVideoUrl(null);
    setProcessResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBase}/api/v1/shoplifting/upload-video`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }
      const data = await res.json();
      setUploadedVideoPath(data.path);
      setUploadedVideoUrl(data.url || null);
      // Switch the viewport to the uploaded clip; otherwise an active RTSP stream
      // would keep precedence and the uploaded video would appear to do nothing.
      setSourceType("sample");
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleProcessVideo = async () => {
    if (!uploadedVideoPath) return;
    setProcessing(true);
    setProcessResult(null);

    try {
      const res = await fetch(`${apiBase}/api/v1/shoplifting/process-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_path: uploadedVideoPath }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Processing failed: ${res.status}`);
      }
      const data = await res.json();
      setProcessResult({
        records_found: data.records_found ?? 0,
        thefts_suspected: data.thefts_suspected ?? 0,
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (err: any) {
      setUploadError(err.message || "Processing failed");
    } finally {
      setProcessing(false);
    }
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
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isAlarming ? "bg-red-400" : "bg-emerald-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isAlarming ? "bg-red-500" : "bg-emerald-500"}`}></span>
            </span>
            <span className="font-semibold text-sm tracking-wide">
              {sourceType === "webcam"
                ? "Live Local Webcam"
                : sourceType === "rtsp"
                ? "Live RTSP / Edge Stream"
                : "Warehouse Bay A (Simulated Sample Feed)"}
            </span>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            {fps} FPS • 640x360
          </span>
          {isAlarming && (
            <span className="text-xs bg-red-950 border border-red-500 text-red-300 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3 h-3 text-red-400" /> PERSON IN RESTRICTED AREA
            </span>
          )}
        </div>

        {/* Action Buttons — hidden when viewing uploaded video */}
        {!uploadedVideoPath && (
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-800 p-0.5">
            {(["sample", "webcam", "rtsp"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setStreamError(null);
                  setSourceType(mode);
                }}
                className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                  sourceType === mode
                    ? "bg-slate-700 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {mode === "sample" && <Video className="w-3.5 h-3.5" />}
                {mode === "webcam" && <Camera className="w-3.5 h-3.5" />}
                {mode === "rtsp" && <RefreshCw className="w-3.5 h-3.5" />}
                {mode === "sample" ? "Sample" : mode === "webcam" ? "Webcam" : "RTSP"}
              </button>
            ))}
          </div>

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
        )}
      </div>

      {/* Live RTSP / Edge Stream Configuration */}
      {sourceType === "rtsp" && (
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="rtsp-url-input" className="text-xs text-slate-300 font-medium">
              Stream source (rtsp://, http://, or 0 for server webcam)
            </label>
            <input
              id="rtsp-url-input"
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="rtsp://admin:pass@192.168.1.50:554/Streaming/Channels/101"
              className="flex-1 min-w-[240px] bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={annotateYolo}
                onChange={(e) => setAnnotateYolo(e.target.checked)}
                className="accent-emerald-500"
              />
              YOLOv8 boxes
            </label>
            <button
              onClick={() => {
                setStreamError(null);
                setActiveStreamUrl(streamUrl.trim() || "0");
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-medium transition"
            >
              Connect Stream
            </button>
            <button
              onClick={captureStreamSnapshot}
              disabled={snapshotBusy}
              className={`text-xs px-3 py-1.5 rounded font-medium transition ${
                snapshotBusy
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              {snapshotBusy ? "Capturing…" : "Capture Evidence Snapshot"}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            The edge/API agent decodes the stream and annotates frames with YOLOv8; the browser receives MJPEG.
          </p>
        </div>
      )}

      {/* Video Upload Section */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm tracking-wide">Upload Shop Video</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleUploadVideo}
              className="hidden"
            />
            <button
              onClick={handleSelectVideo}
              disabled={uploading}
              className={`text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                uploading
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {uploading ? "Uploading…" : "Select Video File"}
            </button>
            {uploadedVideoPath && (
              <button
                onClick={handleProcessVideo}
                disabled={processing}
                className={`text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                  processing
                    ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                {processing ? "Processing…" : "Run Shoplifting Detection"}
              </button>
            )}
          </div>
        </div>
        {uploadError && (
          <div className="mt-2 p-2 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
        {uploadedVideoPath && !processResult && (
          <div className="mt-2 p-2 bg-blue-950/30 border border-blue-900/50 rounded-lg text-xs text-blue-300 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="flex-1 truncate">Ready: {uploadedVideoPath}</span>
            <span className="text-blue-400">Click the detection button to analyze</span>
          </div>
        )}
        {processResult && (
          <div className="mt-2 p-2 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-xs text-emerald-300 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="flex-1">
                Detection complete — {processResult.records_found} person(s) tracked,{' '}
                {processResult.thefts_suspected} suspected theft(s).
              </span>
              {onOpenLog && (
                <button
                  onClick={onOpenLog}
                  className="text-emerald-300 hover:text-emerald-200 font-semibold underline underline-offset-2 shrink-0"
                >
                  View full log →
                </button>
              )}
            </div>

            {processResult.records.length > 0 && (
              <div className="divide-y divide-emerald-900/40 rounded border border-emerald-900/40 overflow-hidden">
                {processResult.records.slice(0, 5).map((record) => (
                  <div
                    key={`${record.track_id}-${record.entry_time}`}
                    className="flex items-center gap-2 px-2 py-1.5 bg-emerald-950/20"
                  >
                    <span className="font-mono text-emerald-200 w-20 shrink-0">{record.track_id}</span>
                    <span className="text-emerald-400/80 flex-1 truncate">
                      {new Date(record.entry_time).toLocaleTimeString()} ·{' '}
                      {record.duration_seconds.toFixed(1)}s in shop
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        record.theft_suspected
                          ? 'bg-red-950 text-red-300'
                          : 'bg-emerald-900/60 text-emerald-300'
                      }`}
                    >
                      {record.theft_suspected ? 'THEFT SUSPECTED' : 'CLEAR'}
                    </span>
                    <span className="text-emerald-500/80 w-10 text-right">
                      {(record.detector_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
                {processResult.records.length > 5 && (
                  <div className="px-2 py-1 text-[10px] text-emerald-500">
                    +{processResult.records.length - 5} more in the Shoplifting Log
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Viewport with Canvas Overlay */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {sourceType === "rtsp" ? (
          /* Live MJPEG stream annotated server-side by YOLOv8 */
          // eslint-disable-next-line @next/next/no-img-element -- MJPEG multipart streams cannot go through next/image
          <img
            src={mjpegStreamUrl}
            alt={`Live stream for ${cameraId}`}
            onError={() =>
              setStreamError(
                "Could not open the MJPEG stream. Verify the API is running on port 8000 and the RTSP/HTTP source is reachable."
              )
            }
            className="w-full h-full object-cover"
          />
        ) : sourceType === "webcam" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : uploadedVideoPath ? (
          /* Uploaded video playback */
          <video
            src={
              uploadedVideoUrl
                ? `${apiBase}${uploadedVideoUrl}`
                : `${apiBase}/api/v1/shoplifting/videos/${uploadedVideoPath.split(/[\\/]/).pop()}`
            }
            autoPlay
            playsInline
            muted
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          /* High-Fidelity Warehouse Security Scene Simulation (no animated person) */
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
              <span suppressHydrationWarning>
                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </span>
            </div>

            <div className="relative z-0 text-slate-600 text-[11px] font-mono">
              Person tracking active • Restricted area monitoring
            </div>
          </div>
        )}

        {/* Interactive Zone Canvas Layer — hidden when viewing uploaded video */}
        {!uploadedVideoPath && (
          <ZoneCanvas
            zonePoints={zonePoints}
            onZoneChange={setZonePoints}
            isDrawing={isDrawing}
            detectedBoxes={detectedBoxes}
            isAlarming={isAlarming}
          />
        )}

        {streamError && (
          <div className="absolute inset-x-4 bottom-4 z-10 rounded-md border border-red-500/40 bg-red-950/90 px-3 py-2 text-xs text-red-200">
            {streamError}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            {isDrawing
              ? "Tap the video to mark a restricted area. Tap 'Finish Drawing' when done."
              : "Monitoring is ON. If a person enters the marked area, an event is logged and verified."}
          </span>
        </div>
        <button
          onClick={() => (sourceType === "rtsp" ? captureStreamSnapshot() : emitCandidateEvent())}
          className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
        >
          <Play className="w-3 h-3" /> Log Manual Event
        </button>
      </div>
    </div>
  );
};

