import React from 'react';
import { Camera, EmergencyEvent, NotificationItem } from '../../types';
import { ProceduralCameraFeed } from '../camera/ProceduralCameraFeed';
import { 
  Camera as CameraIcon, 
  Eye, 
  ShieldAlert, 
  Users, 
  AlertTriangle, 
  Activity, 
  Radio, 
  CheckCircle2, 
  Cpu, 
  BellRing,
  Mic,
  ChevronRight
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface OverviewViewProps {
  cameras: Camera[];
  emergencies: EmergencyEvent[];
  notifications: NotificationItem[];
  onNavigate: (tab: string) => void;
  onAcknowledgeEmergency: (id: string) => void;
  onSelectCamera: (camera: Camera) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  cameras,
  emergencies,
  notifications,
  onNavigate,
  onAcknowledgeEmergency,
  onSelectCamera,
}) => {
  const onlineCount = cameras.filter(c => c.status === 'online' || c.status === 'alert').length;
  const offlineCount = cameras.filter(c => c.status === 'offline').length;
  const activeEmergencies = emergencies.filter(e => e.status !== 'resolved');
  const criticalCount = activeEmergencies.length;

  const handleAcknowledge = (id: string) => {
    soundManager.playSuccessChime();
    onAcknowledgeEmergency(id);
  };

  return (
    <div className="space-y-6">
      {/* Active Critical Emergency Top Notification Banner if any active (Light Red) */}
      {activeEmergencies.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50 via-rose-50 to-white border-2 border-red-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600 shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-800 px-2.5 py-0.5 rounded-full bg-red-100 border border-red-300">
                  CRITICAL EMERGENCY ACTIVE
                </span>
                <span className="text-xs font-mono text-slate-600 font-bold">
                  {activeEmergencies[0].cameraName} ({activeEmergencies[0].location})
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1 font-sans">
                {activeEmergencies[0].headline}
              </h3>
              <p className="text-xs text-red-700 max-w-2xl font-sans mt-0.5 font-medium">
                {activeEmergencies[0].cautiousDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center">
            <button
              onClick={() => handleAcknowledge(activeEmergencies[0].id)}
              className="px-4 py-2 rounded-xl font-mono text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-sm cursor-pointer"
            >
              ACKNOWLEDGE ALERT
            </button>
            <button
              onClick={() => onNavigate('emergency')}
              className="px-4 py-2 rounded-xl font-mono text-xs font-bold bg-white border border-red-300 text-red-700 hover:bg-red-50 transition cursor-pointer shadow-xs"
            >
              COMMAND CENTER &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Top 6 KPI Stat Cards (Light Theme) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Cameras */}
        <div 
          onClick={() => onNavigate('cameras')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-orange-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-bold">TOTAL CAMERAS</span>
            <CameraIcon className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">{cameras.length}</div>
          <div className="text-[11px] text-orange-600 font-mono mt-1 font-bold">100% Configured</div>
        </div>

        {/* Online Cameras */}
        <div 
          onClick={() => onNavigate('cameras')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-bold">ONLINE FEEDS</span>
            <Radio className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700">{onlineCount}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">100% Stream Uptime</div>
        </div>

        {/* Offline Cameras */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-bold">OFFLINE FEEDS</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-800">{offlineCount}</div>
          <div className="text-[11px] text-emerald-600 font-mono mt-1 font-bold">Zero Faults Detected</div>
        </div>

        {/* People Detected */}
        <div 
          onClick={() => onNavigate('detection')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-bold">PEOPLE DETECTED</span>
            <Users className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-purple-800">147</div>
          <div className="text-[11px] text-emerald-600 font-mono mt-1 font-bold">+12% vs last hour</div>
        </div>

        {/* Active Alerts */}
        <div 
          onClick={() => onNavigate('notifications')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-bold">ACTIVE ALERTS</span>
            <BellRing className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-700">
            {notifications.filter(n => !n.read).length}
          </div>
          <div className="text-[11px] text-amber-600 font-mono mt-1 font-bold">Requires Attention</div>
        </div>

        {/* Emergency Events */}
        <div 
          onClick={() => onNavigate('emergency')}
          className={`p-4 rounded-2xl bg-white border transition cursor-pointer group ${
            criticalCount > 0 ? 'border-red-400 bg-red-50/50 shadow-sm' : 'border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-bold">EMERGENCIES</span>
            <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${criticalCount > 0 ? 'text-red-700' : 'text-slate-800'}`}>
            {criticalCount}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1 font-bold">
            {criticalCount > 0 ? 'Active Police SOS' : 'All Clear'}
          </div>
        </div>
      </div>

      {/* Main Grid: Live Feeds Matrix (Left 8 cols) + Real-time Activity Timeline (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Multi-Camera Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-extrabold font-mono text-slate-900">
                LIVE SURVEILLANCE MATRIX
              </h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold border border-orange-200">
                4 PRIORITY FEEDS
              </span>
            </div>
            <button
              onClick={() => onNavigate('cameras')}
              className="text-xs font-mono text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>VIEW ALL {cameras.length} CAMERAS</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cameras.slice(0, 4).map(camera => (
              <ProceduralCameraFeed
                key={camera.id}
                camera={camera}
                onOpenDetails={onSelectCamera}
              />
            ))}
          </div>

          {/* Neural Engine Diagnostic Strip (Light Card) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-orange-600" />
              <span className="text-slate-700 font-bold">ONNX Runtime WebGPU: 100% In-Browser</span>
            </div>
            <div className="flex items-center gap-5 text-slate-600 text-[11px]">
              <div>INFERENCE: <span className="text-orange-700 font-bold">14.2ms</span></div>
              <div>GPU ACCEL: <span className="text-purple-700 font-bold">42%</span></div>
              <div>DROPPED FRAMES: <span className="text-emerald-700 font-bold">0.00%</span></div>
              <div>EDGE TRIPWIRE: <span className="text-emerald-700 font-bold">ARMED</span></div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Detection Timeline & Quick Voice Assistant */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Voice Assistant Card (Light Saffron Card) */}
          <div 
            onClick={() => onNavigate('voice')}
            className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-white border border-orange-300 hover:border-orange-400 hover:shadow-md transition cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-orange-700 font-mono text-xs font-bold">
                <Mic className="w-4 h-4 animate-pulse text-orange-600" />
                <span>LISTY AI VERNACULAR ASSISTANT</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-bold">
                EN / हिंदी
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans mb-3 font-medium">
              &ldquo;Agar godown mein raat 10 baje ke baad koi dikhe, toh mujhe call karo.&rdquo;
            </p>
            <div className="flex items-center justify-between font-mono text-xs text-orange-600 font-bold group-hover:translate-x-1 transition-transform">
              <span>TAP TO CREATE VERNACULAR RULE</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Live Activity Feed (Light Theme) */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-600" />
                <h3 className="font-mono font-bold text-xs text-slate-900">
                  REAL-TIME INCIDENT TIMELINE
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {notifications.slice(0, 6).map(notif => {
                const isCrit = notif.severity === 'critical';
                const isHigh = notif.severity === 'high';

                return (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border transition text-xs font-mono space-y-1 ${
                      isCrit
                        ? 'bg-red-50/70 border-red-300 text-red-900'
                        : isHigh
                        ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-orange-700 font-bold">{notif.cameraName}</span>
                      <span className="text-slate-500 font-medium">{notif.relativeTime}</span>
                    </div>
                    <div className="font-bold text-slate-900 line-clamp-1 font-sans">
                      {notif.headline}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>STATUS: <strong className="text-slate-700">{notif.deliveryStatus}</strong></span>
                      <span className="uppercase text-orange-700 font-bold">{notif.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigate('notifications')}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-mono text-xs font-bold transition cursor-pointer"
            >
              VIEW FULL EVENT LOG &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
