import React, { useState } from 'react';
import { Camera } from '../../types';
import { ProceduralCameraFeed } from '../camera/ProceduralCameraFeed';
import { 
  Grid, 
  LayoutGrid, 
  Maximize2, 
  Filter, 
  Search, 
  Plus, 
  Sliders, 
  Radio, 
  Layers, 
  Lock,
  Camera as CameraIcon,
  Check
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface LiveCamerasViewProps {
  cameras: Camera[];
  onAddCameraModal: () => void;
  onUpdateCamera: (updated: Camera) => void;
  onCaptureSnapshot: (dataUrl: string, camera: Camera) => void;
}

export const LiveCamerasView: React.FC<LiveCamerasViewProps> = ({
  cameras,
  onAddCameraModal,
  onUpdateCamera,
  onCaptureSnapshot
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 1>(2);
  const [activeCameraConfig, setActiveCameraConfig] = useState<Camera | null>(null);

  const zones = ['All', 'Perimeter', 'Interior', 'Rooftop', 'Restricted', 'Parking'];

  const filteredCameras = cameras.filter(cam => {
    const matchesZone = selectedZone === 'All' || cam.zone === selectedZone;
    const matchesSearch = cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cam.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cam.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesZone && matchesSearch;
  });

  const handleToggleNightVision = (camera: Camera) => {
    soundManager.playRadarPing();
    const updated = { ...camera, nightVision: !camera.nightVision, thermalVision: false };
    onUpdateCamera(updated);
    if (activeCameraConfig?.id === camera.id) setActiveCameraConfig(updated);
  };

  const handleToggleThermal = (camera: Camera) => {
    soundManager.playRadarPing();
    const updated = { ...camera, thermalVision: !camera.thermalVision, nightVision: false };
    onUpdateCamera(updated);
    if (activeCameraConfig?.id === camera.id) setActiveCameraConfig(updated);
  };

  const handleToggleEnabled = (camera: Camera) => {
    soundManager.playRadarPing();
    const updated: Camera = { 
      ...camera, 
      enabled: !camera.enabled, 
      status: !camera.enabled ? 'online' : 'offline' 
    };
    onUpdateCamera(updated);
    if (activeCameraConfig?.id === camera.id) setActiveCameraConfig(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar (Light Theme) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {/* Left: Zone Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-mono font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-orange-600" />
            ZONE:
          </span>
          {zones.map(zone => (
            <button
              key={zone}
              onClick={() => {
                soundManager.playRadarPing();
                setSelectedZone(zone);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedZone === zone
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Right: Search, Grid Switcher, Add Camera */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter camera or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500 w-44 sm:w-56"
            />
          </div>

          {/* Grid Layout Switcher */}
          <div className="hidden sm:flex items-center rounded-xl bg-slate-100 border border-slate-200 p-0.5">
            <button
              onClick={() => setGridColumns(1)}
              title="Single Focus View"
              className={`p-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${gridColumns === 1 ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              1x1
            </button>
            <button
              onClick={() => setGridColumns(2)}
              title="2x2 Grid"
              className={`p-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${gridColumns === 2 ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              2x2
            </button>
            <button
              onClick={() => setGridColumns(3)}
              title="3x3 Matrix"
              className={`p-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${gridColumns === 3 ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              3x3
            </button>
          </div>

          <button
            onClick={() => {
              soundManager.playRadarPing();
              onAddCameraModal();
            }}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-mono text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition"
          >
            <Plus className="w-4 h-4" />
            <span>ADD CAMERA</span>
          </button>
        </div>
      </div>

      {/* Camera Grid */}
      <div 
        className={`grid gap-5 ${
          gridColumns === 1 
            ? 'grid-cols-1' 
            : gridColumns === 3 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 lg:grid-cols-2'
        }`}
      >
        {filteredCameras.map(camera => (
          <ProceduralCameraFeed
            key={camera.id}
            camera={camera}
            onOpenDetails={cam => setActiveCameraConfig(cam)}
            onSnapshot={onCaptureSnapshot}
          />
        ))}

        {filteredCameras.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 font-mono space-y-2 shadow-xs">
            <CameraIcon className="w-10 h-10 text-slate-400 mx-auto" />
            <p>No camera feeds found matching filter &quot;{selectedZone}&quot; or query &quot;{searchQuery}&quot;.</p>
          </div>
        )}
      </div>

      {/* Camera Configuration Slide-out Drawer / Modal (Light Theme) */}
      {activeCameraConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-xl w-full rounded-3xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl font-mono text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-sans">{activeCameraConfig.name}</h3>
                  <p className="text-xs text-slate-500">{activeCameraConfig.id} &bull; {activeCameraConfig.location}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCameraConfig(null)}
                className="text-slate-400 hover:text-slate-700 px-2 py-1 text-sm cursor-pointer font-bold"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Stream Parameters */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-orange-700 font-bold">STREAM PARAMETERS</div>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>RTSP URL: <span className="text-slate-500 truncate block text-[11px]">{activeCameraConfig.streamUrl}</span></div>
                  <div>IP ADDRESS: <span className="text-slate-500 block text-[11px]">{activeCameraConfig.ipAddress}</span></div>
                  <div>RESOLUTION: <span className="text-orange-700 font-bold block">{activeCameraConfig.resolution}</span></div>
                  <div>LATENCY: <span className="text-emerald-700 font-bold block">{activeCameraConfig.latencyMs}ms</span></div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-slate-800 font-bold">CAMERA FEED POWER</div>
                    <div className="text-[11px] text-slate-500">Enable or disable live stream ingest</div>
                  </div>
                  <button
                    onClick={() => handleToggleEnabled(activeCameraConfig)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeCameraConfig.enabled 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    {activeCameraConfig.enabled ? 'ACTIVE [ON]' : 'DISABLED [OFF]'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-slate-800 font-bold">PHOSPHOR NIGHT VISION</div>
                    <div className="text-[11px] text-slate-500">Hardware infrared illumination filter</div>
                  </div>
                  <button
                    onClick={() => handleToggleNightVision(activeCameraConfig)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeCameraConfig.nightVision 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {activeCameraConfig.nightVision ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-slate-800 font-bold">THERMAL IR SPECTRUM</div>
                    <div className="text-[11px] text-slate-500">Ironbow false-color temperature heatmap</div>
                  </div>
                  <button
                    onClick={() => handleToggleThermal(activeCameraConfig)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeCameraConfig.thermalVision 
                        ? 'bg-red-100 text-red-800 border border-red-300' 
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {activeCameraConfig.thermalVision ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              {/* Privacy Masks Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-orange-700 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    CONFIGURED PRIVACY MASKS ({activeCameraConfig.privacyMasks.length})
                  </span>
                </div>
                {activeCameraConfig.privacyMasks.length > 0 ? (
                  <div className="space-y-1 pt-1">
                    {activeCameraConfig.privacyMasks.map(mask => (
                      <div key={mask.id} className="text-[11px] text-slate-700 flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="font-bold">{mask.label || 'Redacted Area'}</span>
                        <span className="text-slate-500">{mask.w}% x {mask.h}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 pt-1">No active privacy blackout zones on this feed.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveCameraConfig(null)}
                className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition cursor-pointer shadow-sm"
              >
                APPLY &amp; RETURN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
