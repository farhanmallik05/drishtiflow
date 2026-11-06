import React, { useEffect, useRef, useState } from 'react';
import { Camera, Detection } from '../../types';
import { 
  Maximize2, 
  Minimize2, 
  Eye, 
  Flame, 
  Camera as CameraIcon, 
  ShieldAlert, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Volume2,
  VolumeX,
  Video,
  Layers
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface ProceduralCameraFeedProps {
  camera: Camera;
  onSnapshot?: (snapshotData: string, camera: Camera) => void;
  onOpenDetails?: (camera: Camera) => void;
  isFocused?: boolean;
}

export const ProceduralCameraFeed: React.FC<ProceduralCameraFeedProps> = ({
  camera,
  onSnapshot,
  onOpenDetails,
  isFocused = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [nightVision, setNightVision] = useState<boolean>(camera.nightVision);
  const [thermalVision, setThermalVision] = useState<boolean>(camera.thermalVision);
  const [audioMuted, setAudioMuted] = useState<boolean>(!camera.audioActive);
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);
  const [useRealVideo, setUseRealVideo] = useState<boolean>(Boolean(camera.videoSrc));

  // Canvas HUD and Bounding Box Animation Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.save();

      // Zoom transform if applicable
      if (zoomLevel > 1) {
        ctx.translate(w / 2, h / 2);
        ctx.scale(zoomLevel, zoomLevel);
        ctx.translate(-w / 2, -h / 2);
      }

      // If user switched to Synthetic mode, render procedural environment
      if (!useRealVideo) {
        if (camera.zone === 'Rooftop') {
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, '#04060d');
          grad.addColorStop(0.6, '#091124');
          grad.addColorStop(1, '#0e182f');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Ledge floor
          ctx.fillStyle = '#162035';
          ctx.fillRect(0, h * 0.55, w, h * 0.45);

          // Edge danger boundary
          const ledgeX = w * 0.65;
          ctx.strokeStyle = Math.sin(t * 6) > 0 ? '#ef4444' : '#7f1d1d';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(ledgeX, h * 0.55);
          ctx.lineTo(ledgeX, h);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (camera.zone === 'Parking') {
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(0, 0, w, h);
          // Parking lines
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(w * 0.3, h * 0.6); ctx.lineTo(w * 0.45, h * 0.95);
          ctx.moveTo(w * 0.55, h * 0.6); ctx.lineTo(w * 0.7, h * 0.95);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#080d1a';
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Draw Privacy Masks (blackout blocks over sensitive areas)
      if (camera.privacyMasks && camera.privacyMasks.length > 0) {
        camera.privacyMasks.forEach(mask => {
          const mx = (mask.x / 100) * w;
          const my = (mask.y / 100) * h;
          const mw = (mask.w / 100) * w;
          const mh = (mask.h / 100) * h;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';
          ctx.fillRect(mx, my, mw, mh);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(mx, my, mw, mh);

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`[PRIVACY MASK: ${mask.label || 'REDACTED'}]`, mx + 4, my + 14);
        });
      }

      // Draw Real-time AI Bounding Boxes over video
      if (showBoxes && camera.activeDetections.length > 0) {
        camera.activeDetections.forEach((det, idx) => {
          // Slight oscillation to simulate dynamic neural tracking
          const oscX = Math.sin(t * 1.5 + idx) * 1.5;
          const oscY = Math.cos(t * 1.8 + idx) * 1.5;

          const bx = ((det.box.x + oscX) / 100) * w;
          const by = ((det.box.y + oscY) / 100) * h;
          const bw = (det.box.w / 100) * w;
          const bh = (det.box.h / 100) * h;

          const isCrit = det.severity === 'critical';
          const boxColor = isCrit ? '#ef4444' : '#00f0ff';

          // Box border
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = isCrit ? 2.5 : 1.5;
          ctx.strokeRect(bx, by, bw, bh);

          // Tactical Corner Reticles
          const cornerLen = 10;
          ctx.lineWidth = 3;
          // Top-left
          ctx.beginPath(); ctx.moveTo(bx, by + cornerLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerLen, by); ctx.stroke();
          // Top-right
          ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerLen); ctx.stroke();
          // Bottom-left
          ctx.beginPath(); ctx.moveTo(bx, by + bh - cornerLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerLen, by + bh); ctx.stroke();
          // Bottom-right
          ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerLen); ctx.stroke();

          // Label pill background
          const labelText = `${det.label} [${Math.round(det.confidence * 100)}%]`;
          ctx.font = 'bold 11px monospace';
          const textWidth = ctx.measureText(labelText).width;

          ctx.fillStyle = isCrit ? 'rgba(239, 68, 68, 0.95)' : 'rgba(0, 240, 255, 0.88)';
          ctx.fillRect(bx, by - 22 > 0 ? by - 22 : by, textWidth + 14, 20);

          ctx.fillStyle = isCrit ? '#ffffff' : '#040d1a';
          ctx.fillText(labelText, bx + 6, by - 22 > 0 ? by - 7 : by + 14);

          // Target Center Crosshair
          const cx = bx + bw / 2;
          const cy = by + bh / 2;
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy);
          ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6);
          ctx.stroke();
        });
      }

      // HUD Watermark: Camera ID, Name, UTC timestamp
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;

      const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      ctx.fillText(`REC ● [${camera.id}] ${camera.name.toUpperCase()}`, 14, 24);
      ctx.fillText(`${dateStr} | FPS: ${camera.fps} | ${camera.resolution}`, 14, 40);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [camera, zoomLevel, showBoxes, nightVision, thermalVision, useRealVideo]);

  const handleCaptureSnapshot = () => {
    soundManager.playSuccessChime();
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 200);

    const canvas = canvasRef.current;
    if (canvas && onSnapshot) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onSnapshot(dataUrl, camera);
    }
  };

  const toggleNight = () => {
    soundManager.playRadarPing();
    setNightVision(!nightVision);
    if (!nightVision) setThermalVision(false);
  };

  const toggleThermal = () => {
    soundManager.playRadarPing();
    setThermalVision(!thermalVision);
    if (!thermalVision) setNightVision(false);
  };

  const toggleVideoMode = () => {
    soundManager.playRadarPing();
    setUseRealVideo(!useRealVideo);
  };

  const isAlerting = camera.status === 'alert';

  // CSS Filter string for Night Vision and Thermal IR
  let videoFilterStyle = 'none';
  if (nightVision) {
    videoFilterStyle = 'brightness(1.15) contrast(1.4) hue-rotate(95deg) sepia(0.9) saturate(3.5)';
  } else if (thermalVision) {
    videoFilterStyle = 'invert(0.95) hue-rotate(180deg) saturate(3.2) contrast(1.6)';
  }

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden bg-white border transition-all duration-300 group flex flex-col shadow-sm ${
        isAlerting 
          ? 'border-red-500 shadow-md ring-1 ring-red-500' 
          : 'border-slate-200 hover:border-orange-300 hover:shadow-md'
      } ${isFocused ? 'ring-2 ring-orange-500' : ''} ${isFullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' : 'w-full'}`}
    >
      {/* Top Header Bar (Light Theme) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center">
            <span className={`w-2.5 h-2.5 rounded-full ${isAlerting ? 'bg-red-500 animate-ping' : camera.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className={`w-2 h-2 rounded-full absolute ${isAlerting ? 'bg-red-500' : camera.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-slate-800">{camera.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                {camera.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{camera.location}</p>
          </div>
        </div>

        {/* Video Source Toggle & Status Badge */}
        <div className="flex items-center gap-2">
          {camera.videoSrc && (
            <button
              onClick={toggleVideoMode}
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border transition flex items-center gap-1 cursor-pointer font-bold ${
                useRealVideo
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
              title="Toggle between Real Video and Synthetic Sensor"
            >
              <Video className="w-3 h-3 text-emerald-600" />
              <span>{useRealVideo ? 'REAL CCTV VIDEO' : 'SYNTHETIC'}</span>
            </button>
          )}

          {isAlerting && (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 flex items-center gap-1 font-bold animate-pulse">
              <ShieldAlert className="w-3 h-3 text-red-600" />
              ALERT
            </span>
          )}
        </div>
      </div>

      {/* Main Video Viewport (Real Video + Canvas AI Overlay) */}
      <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
        {/* Real Video Element Layer */}
        {camera.videoSrc && useRealVideo ? (
          <video
            ref={videoRef}
            src={camera.videoSrc}
            autoPlay
            loop
            muted={audioMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
            style={{ 
              filter: videoFilterStyle,
              transform: zoomLevel > 1 ? `scale(${zoomLevel})` : 'none'
            }}
          />
        ) : null}

        {/* Transparent Canvas Overlay for Neural Bounding Boxes & HUD */}
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Scanlines Effect */}
        <div className="absolute inset-0 pointer-events-none scanline opacity-25 z-10" />

        {/* Animated Laser Scanning Line */}
        <div className="absolute left-0 right-0 h-[2px] bg-orange-400/80 shadow-[0_0_8px_#ea580c] pointer-events-none animate-laser z-10" />

        {/* Snapshot Shutter Flash */}
        {snapshotFlash && (
          <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-fade-out" />
        )}

        {/* Overlay Badges for Zoom & Filters */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 pointer-events-none z-20">
          {thermalVision && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/90 text-orange-200 border border-red-500/60 backdrop-blur-sm shadow-md font-bold">
              THERMAL IR [IRONBOW]
            </span>
          )}
          {nightVision && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 backdrop-blur-sm shadow-md font-bold">
              NIGHT VISION [PHOSPHOR]
            </span>
          )}
          {zoomLevel > 1 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 text-orange-300 border border-orange-500/60 backdrop-blur-sm font-bold">
              PTZ ZOOM {zoomLevel}X
            </span>
          )}
        </div>

        {/* Floating Quick Action Overlay (Appears on Hover) */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <div className="flex items-center gap-1.5">
            {/* Toggle Night Vision */}
            <button
              onClick={toggleNight}
              title="Toggle Night Vision"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                nightVision 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Thermal Vision */}
            <button
              onClick={toggleThermal}
              title="Toggle Thermal Vision"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                thermalVision 
                  ? 'bg-red-100 text-red-800 border border-red-300' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Bounding Boxes */}
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              title="Toggle AI Bounding Boxes"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                showBoxes 
                  ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                setAudioMuted(!audioMuted);
                soundManager.playRadarPing();
              }}
              title={audioMuted ? 'Listen Feed Audio' : 'Mute Feed Audio'}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                !audioMuted 
                  ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center border-l border-slate-200 pl-1.5 ml-1 gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                title="Zoom In"
                className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}
                title="Zoom Out"
                className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Capture Snapshot */}
            <button
              onClick={handleCaptureSnapshot}
              title="Capture Evidence Snapshot"
              className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1 text-[11px] font-mono px-2 cursor-pointer font-bold"
            >
              <CameraIcon className="w-3.5 h-3.5" />
              <span>SNAP</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info Strip (Light Theme) */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
        <div className="flex items-center gap-3">
          <span className="text-orange-700 font-bold">LATENCY: {camera.latencyMs}ms</span>
          <span>ZONE: {camera.zone}</span>
        </div>
        <div className="flex items-center gap-2">
          {camera.activeDetections.length > 0 ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {camera.activeDetections.length} OBJECT(S) TRACKED
            </span>
          ) : (
            <span className="text-slate-400">SECTOR CLEAR</span>
          )}
          {onOpenDetails && (
            <button
              onClick={() => onOpenDetails(camera)}
              className="text-orange-600 hover:underline ml-1 cursor-pointer font-bold"
            >
              CONFIG &gt;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
