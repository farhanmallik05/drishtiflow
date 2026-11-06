import React, { useState } from 'react';
import { Camera, EmergencyEvent, EmergencyStatus } from '../../types';
import { ProceduralCameraFeed } from '../camera/ProceduralCameraFeed';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Flame, 
  Lock, 
  HeartPulse, 
  BellRing, 
  CheckCircle2, 
  Radio, 
  Volume2, 
  VolumeX, 
  Zap,
  Siren
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/soundEffects';

interface EmergencyCenterViewProps {
  cameras: Camera[];
  emergencies: EmergencyEvent[];
  onUpdateEmergency: (updated: EmergencyEvent) => void;
  onSelectCamera: (camera: Camera) => void;
}

export const EmergencyCenterView: React.FC<EmergencyCenterViewProps> = ({
  cameras,
  emergencies,
  onUpdateEmergency,
  onSelectCamera
}) => {
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string>(
    emergencies[0]?.id || 'EMG-2026-001'
  );
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [droneDispatchedState, setDroneDispatchedState] = useState<boolean>(false);

  const currentEmergency = emergencies.find(e => e.id === selectedEmergencyId) || emergencies[0];
  
  const relatedCamera = React.useMemo(() => {
    const base = cameras.find(c => c.id === currentEmergency?.cameraId) || cameras[0];
    if (currentEmergency?.type === 'person_down') {
      return { ...base, videoSrc: '/videos/cam_walking_pause.mp4' };
    }
    if (currentEmergency?.type === 'fall_risk') {
      return { ...base, videoSrc: '/videos/cam_worker_zone.mp4' };
    }
    if (currentEmergency?.type === 'fire_smoke') {
      return { ...base, videoSrc: '/videos/cam_parking.mp4', thermalVision: true };
    }
    if (currentEmergency?.type === 'unauthorized_entry') {
      return { ...base, videoSrc: '/videos/cam_restricted.mp4' };
    }
    return base;
  }, [cameras, currentEmergency]);

  const handleToggleSiren = () => {
    if (!isSirenActive) {
      soundManager.playAlarmSiren();
      setIsSirenActive(true);
    } else {
      setIsSirenActive(false);
    }
  };

  const handleDispatchDrone = () => {
    soundManager.playRadarPing();
    setDroneDispatchedState(true);
    if (currentEmergency) {
      const updated: EmergencyEvent = {
        ...currentEmergency,
        droneDispatched: true
      };
      onUpdateEmergency(updated);
    }
  };

  const handleAdvanceStep = (nextStatus: EmergencyStatus) => {
    if (!currentEmergency) return;
    soundManager.playSuccessChime();

    const now = new Date().toISOString().slice(11, 19);
    const updatedTimeline = currentEmergency.timeline.map(step => {
      if (nextStatus === 'acknowledged' && step.step.includes('Verification')) {
        return { ...step, status: 'completed' as const, timestamp: now };
      }
      if (nextStatus === 'resolved' && step.step.includes('Resolution')) {
        return { ...step, status: 'completed' as const, timestamp: now };
      }
      return step;
    });

    const updated: EmergencyEvent = {
      ...currentEmergency,
      status: nextStatus,
      timeline: updatedTimeline,
      resolvedAt: nextStatus === 'resolved' ? now + ' UTC' : undefined
    };

    if (nextStatus === 'resolved') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      setIsSirenActive(false);
    }

    onUpdateEmergency(updated);
  };

  const launchScenario = (scenarioKey: 'fall' | 'fire' | 'vault' | 'medical') => {
    soundManager.playAlertBeep();
    let targetId = 'EMG-2026-001';
    if (scenarioKey === 'fire') targetId = 'EMG-2026-002';
    if (scenarioKey === 'vault') targetId = 'EMG-2026-003';
    if (scenarioKey === 'medical') targetId = 'EMG-2026-004';
    setSelectedEmergencyId(targetId);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Scenario Launcher Cards (Light Theme) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2 text-orange-600 font-bold">
            <Zap className="w-4 h-4 text-orange-600 animate-pulse" />
            <span>SELECT INCIDENT SCENARIO SIMULATION</span>
          </div>
          <span className="text-slate-500 text-[11px] font-bold">4 INTERACTIVE AUDIT SCENARIOS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Scenario A */}
          <button
            onClick={() => launchScenario('fall')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              currentEmergency?.type === 'fall_risk'
                ? 'bg-red-50 border-red-500 text-red-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-red-600 mb-1 font-bold">
              <span>SCENARIO A</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Rooftop Fall Risk</div>
            <div className="text-[11px] text-slate-500 mt-1">CAM-04 &bull; Tower Alpha</div>
          </button>

          {/* Scenario B */}
          <button
            onClick={() => launchScenario('fire')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              currentEmergency?.type === 'fire_smoke'
                ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-orange-600 mb-1 font-bold">
              <span>SCENARIO B</span>
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Fire &amp; Smoke Detection</div>
            <div className="text-[11px] text-slate-500 mt-1">CAM-02 &bull; Parking B2</div>
          </button>

          {/* Scenario C */}
          <button
            onClick={() => launchScenario('vault')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              currentEmergency?.type === 'unauthorized_entry'
                ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-purple-600 mb-1 font-bold">
              <span>SCENARIO C</span>
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Unauthorized Vault Entry</div>
            <div className="text-[11px] text-slate-500 mt-1">CAM-05 &bull; Server Vault</div>
          </button>

          {/* Scenario D */}
          <button
            onClick={() => launchScenario('medical')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              currentEmergency?.type === 'person_down'
                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-blue-600 mb-1 font-bold">
              <span>SCENARIO D</span>
              <HeartPulse className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Motionless Person Down</div>
            <div className="text-[11px] text-slate-500 mt-1">CAM-03 &bull; Corridor 3F</div>
          </button>
        </div>
      </div>

      {/* Main Focus: Live Scene Feed + Real-time Incident Triage Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Emergency Camera Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <h3 className="font-extrabold text-sm text-slate-900">
                ACTIVE INCIDENT LIVE FEED &bull; {currentEmergency?.cameraName}
              </h3>
            </div>
            <span className="text-xs text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-300 font-bold">
              HIGH CONFIDENCE: {Math.round(currentEmergency?.confidence * 100)}%
            </span>
          </div>

          {/* Dedicated Camera Feed Display */}
          {relatedCamera && (
            <ProceduralCameraFeed
              camera={relatedCamera}
              isFocused={true}
            />
          )}

          {/* Cautious Classification Notice (Light Theme) */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs space-y-1 text-amber-900 shadow-xs">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>CAUTIOUS AI CLASSIFICATION PROTOCOL (SECTION 5 COMPLIANCE)</span>
            </div>
            <p className="text-amber-800 font-sans leading-relaxed text-[11px] font-medium">
              &ldquo;{currentEmergency?.cautiousDescription}&rdquo;
            </p>
            <p className="text-[10px] text-amber-600 pt-1">
              * Note: The AI classifies spatial velocity, pose keypoints, and trajectory contours. It does not impute human intent.
            </p>
          </div>
        </div>

        {/* Right Column: 5-Stage Response Workflow & Incident Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold">INCIDENT ID</span>
                <div className="font-extrabold text-slate-900 text-sm">{currentEmergency?.id}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs uppercase font-bold border ${
                currentEmergency?.status === 'resolved'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-red-100 text-red-800 border-red-300 animate-pulse'
              }`}>
                STATUS: {currentEmergency?.status}
              </span>
            </div>

            {/* Headline and Location */}
            <div>
              <h4 className="text-base font-extrabold text-slate-900 font-sans">
                {currentEmergency?.headline}
              </h4>
              <p className="text-xs text-orange-600 mt-1 font-bold">
                LOCATION: {currentEmergency?.location}
              </p>
            </div>

            {/* 5-Stage Step Workflow Progress */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>INCIDENT RESPONSE WORKFLOW</span>
                <span className="text-[11px] text-slate-400 font-bold">5-STAGE DISPATCH</span>
              </div>

              <div className="space-y-2">
                {currentEmergency?.timeline.map((item, idx) => {
                  const isDone = item.status === 'completed';
                  const isInProgress = item.status === 'in_progress';

                  return (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        isDone 
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' 
                          : isInProgress 
                          ? 'bg-orange-50 border-orange-400 text-orange-900 animate-pulse font-bold' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-bold">
                            {idx + 1}
                          </span>
                        )}
                        <span className="font-medium">{item.step}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {item.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons for Incident Control */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                {/* Acoustic Siren Toggle */}
                <button
                  onClick={handleToggleSiren}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                    isSirenActive
                      ? 'bg-red-600 text-white border-red-500 animate-bounce'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSirenActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>{isSirenActive ? 'SIREN ON [MUTE]' : 'SOUND SIREN'}</span>
                </button>

                {/* Drone Dispatch */}
                <button
                  onClick={handleDispatchDrone}
                  disabled={droneDispatchedState || currentEmergency?.droneDispatched}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs ${
                    droneDispatchedState || currentEmergency?.droneDispatched
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 cursor-pointer'
                  }`}
                >
                  <Radio className="w-4 h-4 text-purple-600" />
                  <span>
                    {droneDispatchedState || currentEmergency?.droneDispatched ? 'DRONE ON SCENE' : 'DISPATCH DRONE'}
                  </span>
                </button>
              </div>

              {/* Progress Incident Steps: Acknowledge & Resolve */}
              {currentEmergency?.status !== 'resolved' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleAdvanceStep('acknowledged')}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    ACKNOWLEDGE
                  </button>
                  <button
                    onClick={() => handleAdvanceStep('resolved')}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer transition"
                  >
                    RESOLVE INCIDENT
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-center text-emerald-900 text-xs font-bold">
                  &check; INCIDENT OFFICIALLY RESOLVED AT {currentEmergency.resolvedAt || 'JUST NOW'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
