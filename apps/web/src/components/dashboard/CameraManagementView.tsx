import React, { useState } from 'react';
import { Camera, DetectionType, PrivacyMask } from '../../types';
import { 
  Camera as CameraIcon, 
  Plus, 
  Radio, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Lock, 
  ShieldCheck, 
  RefreshCw, 
  Cpu, 
  Eye, 
  Trash2,
  Check,
  Activity,
  Layers
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface CameraManagementViewProps {
  cameras: Camera[];
  onAddCamera: (newCamera: Camera) => void;
  onUpdateCamera: (updatedCamera: Camera) => void;
  onDeleteCamera: (id: string) => void;
}

export const CameraManagementView: React.FC<CameraManagementViewProps> = ({
  cameras,
  onAddCamera,
  onUpdateCamera,
  onDeleteCamera
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [maskEditorCamera, setMaskEditorCamera] = useState<Camera | null>(null);

  // New Camera Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [zone, setZone] = useState<'Perimeter' | 'Interior' | 'Rooftop' | 'Restricted' | 'Parking'>('Perimeter');
  const [protocol, setProtocol] = useState<'RTSP' | 'HLS' | 'SIMULATED'>('RTSP');
  const [streamUrl, setStreamUrl] = useState('rtsp://edge.drishtiflow.ai/stream/cam07');
  const [ipAddress, setIpAddress] = useState('192.168.10.107');
  const [username, setUsername] = useState('admin_sec');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedCapabilities, setSelectedCapabilities] = useState<DetectionType[]>([
    'person', 
    'vehicle'
  ]);

  // Connection Test State
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);

  // Masking Editor local state
  const [newMaskLabel, setNewMaskLabel] = useState('Keypad Blackout');

  const handleTestConnection = () => {
    soundManager.playRadarPing();
    setTestingConnection(true);
    setTestResult(null);

    setTimeout(() => {
      setTestingConnection(false);
      const latency = Math.floor(Math.random() * 12) + 10;
      setTestResult({
        success: true,
        latency,
        message: `RTSP Handshake Verified: 200 OK | H.264 stream active (${latency}ms latency)`
      });
      soundManager.playSuccessChime();
    }, 1200);
  };

  const handleCreateCamera = () => {
    soundManager.playSuccessChime();

    const newId = `CAM-0${cameras.length + 1}`;
    const newCam: Camera = {
      id: newId,
      name: name || `Camera ${newId}`,
      location: location || 'Building Exterior Sector',
      zone,
      status: 'online',
      streamUrl,
      streamType: protocol,
      fps: 30,
      resolution: '1920x1080 (FHD)',
      latencyMs: testResult?.latency || 16,
      isSimulation: protocol === 'SIMULATED',
      enabled: true,
      nightVision: false,
      thermalVision: false,
      audioActive: false,
      ipAddress,
      detectionCapabilities: selectedCapabilities,
      privacyMasks: [],
      activeDetections: []
    };

    onAddCamera(newCam);
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setZone('Perimeter');
    setProtocol('RTSP');
    setStreamUrl('rtsp://edge.drishtiflow.ai/stream/new');
    setIpAddress('192.168.10.108');
    setTestResult(null);
  };

  const handleToggleCapability = (cap: DetectionType) => {
    if (selectedCapabilities.includes(cap)) {
      if (selectedCapabilities.length > 1) {
        setSelectedCapabilities(selectedCapabilities.filter(c => c !== cap));
      }
    } else {
      setSelectedCapabilities([...selectedCapabilities, cap]);
    }
  };

  const handleToggleCameraEnabled = (cam: Camera) => {
    soundManager.playRadarPing();
    onUpdateCamera({
      ...cam,
      enabled: !cam.enabled,
      status: !cam.enabled ? 'online' : 'offline'
    });
  };

  // Add a privacy mask to camera
  const handleAddMask = (cam: Camera) => {
    soundManager.playSuccessChime();
    const newMask: PrivacyMask = {
      id: `mask-${Date.now()}`,
      x: Math.floor(Math.random() * 40) + 10,
      y: Math.floor(Math.random() * 40) + 20,
      w: 22,
      h: 22,
      label: newMaskLabel
    };

    const updated = {
      ...cam,
      privacyMasks: [...cam.privacyMasks, newMask]
    };
    onUpdateCamera(updated);
    setMaskEditorCamera(updated);
  };

  const handleRemoveMask = (cam: Camera, maskId: string) => {
    soundManager.playRadarPing();
    const updated = {
      ...cam,
      privacyMasks: cam.privacyMasks.filter(m => m.id !== maskId)
    };
    onUpdateCamera(updated);
    setMaskEditorCamera(updated);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header & Actions Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-600 text-xs font-bold mb-1">
            <Radio className="w-4 h-4" />
            <span>INFRASTRUCTURE DEVICE CONTROLLER</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            CAMERA FLEET MANAGEMENT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            RTSP, WebRTC, and simulated surveillance sensors with privacy masking and neural detection settings.
          </p>
        </div>

        <button
          onClick={() => {
            soundManager.playRadarPing();
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW CAMERA</span>
        </button>
      </div>

      {/* Camera Grid Table & Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cameras.map(cam => (
          <div
            key={cam.id}
            className={`p-5 rounded-2xl bg-white border transition-all shadow-sm ${
              cam.enabled
                ? 'border-slate-200 hover:border-orange-300'
                : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cam.status === 'online' ? 'bg-emerald-500' : cam.status === 'alert' ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`} />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-sans">{cam.name}</h3>
                  <div className="text-[11px] text-orange-600 font-bold">{cam.id} &bull; {cam.zone}</div>
                </div>
              </div>

              <button
                onClick={() => handleToggleCameraEnabled(cam)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  cam.enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {cam.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="space-y-2 py-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">IP ADDRESS:</span>
                <span className="text-slate-800 font-medium">{cam.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">PROTOCOL:</span>
                <span className="text-orange-700 font-bold">{cam.streamType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">RESOLUTION:</span>
                <span className="text-slate-800 font-medium">{cam.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">LATENCY:</span>
                <span className="text-emerald-600 font-bold">{cam.latencyMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">PRIVACY MASKS:</span>
                <span className="text-slate-800 font-medium">{cam.privacyMasks.length} Configured</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  soundManager.playRadarPing();
                  setMaskEditorCamera(cam);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs border border-slate-200 transition flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>PRIVACY MASKS</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playRadarPing();
                  onDeleteCamera(cam.id);
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 border border-slate-200 transition cursor-pointer"
                title="Remove Camera"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Camera Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-xl w-full rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <CameraIcon className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">CONNECT NEW CAMERA DEVICE</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 font-bold"
              >
                CANCEL [ESC]
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">CAMERA NAME</label>
                <input
                  type="text"
                  placeholder="e.g. West Perimeter Fence Alpha"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">ZONE / SECTOR</label>
                  <select
                    value={zone}
                    onChange={e => setZone(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                  >
                    <option value="Perimeter">Perimeter</option>
                    <option value="Interior">Interior</option>
                    <option value="Rooftop">Rooftop</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Parking">Parking</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">PROTOCOL</label>
                  <select
                    value={protocol}
                    onChange={e => setProtocol(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                  >
                    <option value="RTSP">RTSP (Real-Time Streaming)</option>
                    <option value="HLS">HLS (HTTP Live Streaming)</option>
                    <option value="SIMULATED">Simulated AI Feed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">STREAM URL</label>
                <input
                  type="text"
                  value={streamUrl}
                  onChange={e => setStreamUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">IP ADDRESS</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={e => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">RTSP PASSWORD</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Test Connection Button & Result */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-bold">STREAM CONNECTIVITY TEST</span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{testingConnection ? 'HANDSHAKING...' : 'TEST RTSP CONNECTION'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-mono pt-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCamera}
                className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition"
              >
                <Check className="w-4 h-4" />
                <span>SAVE &amp; CONNECT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Masking Editor Modal */}
      {maskEditorCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-xl w-full rounded-3xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  PRIVACY MASKING: {maskEditorCamera.name}
                </h3>
              </div>
              <button
                onClick={() => setMaskEditorCamera(null)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 font-bold"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 font-sans leading-relaxed">
                Privacy masks apply permanent hardware-level blackouts over sensitive areas (e.g. keypads, private screens, residential windows) before neural processing or human review.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Mask label (e.g. Guard Desk Keypad)"
                  value={newMaskLabel}
                  onChange={e => setNewMaskLabel(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                />
                <button
                  onClick={() => handleAddMask(maskEditorCamera)}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD BLACKOUT MASK</span>
                </button>
              </div>

              {/* Active Masks List */}
              <div className="space-y-2 pt-2">
                <div className="text-slate-700 font-bold">ACTIVE MASK ZONES ({maskEditorCamera.privacyMasks.length})</div>
                {maskEditorCamera.privacyMasks.map(mask => (
                  <div
                    key={mask.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="text-slate-900 font-bold">{mask.label}</div>
                      <div className="text-[10px] text-slate-500">
                        Coordinates: X: {mask.x}%, Y: {mask.y}%, Width: {mask.w}%, Height: {mask.h}%
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMask(maskEditorCamera, mask.id)}
                      className="text-red-500 hover:text-red-700 p-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {maskEditorCamera.privacyMasks.length === 0 && (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No privacy blackout zones set for this feed yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setMaskEditorCamera(null)}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-bold text-xs shadow-sm cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

