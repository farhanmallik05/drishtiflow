import React, { useState } from 'react';
import { Camera, Detection, DetectionType } from '../../types';
import { 
  Cpu, 
  Search, 
  Filter, 
  Sparkles, 
  Eye, 
  ShieldAlert, 
  Layers, 
  Sliders, 
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface AiDetectionViewProps {
  cameras: Camera[];
  onSelectCamera: (camera: Camera) => void;
}

export const AiDetectionView: React.FC<AiDetectionViewProps> = ({
  cameras,
  onSelectCamera
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(75);
  const [activeModel, setActiveModel] = useState<'yolov10' | 'pose' | 'thermal'>('yolov10');

  // Collect all active detections from cameras
  const allDetections: (Detection & { cameraZone: string })[] = [];
  cameras.forEach(cam => {
    cam.activeDetections.forEach(det => {
      allDetections.push({ ...det, cameraZone: cam.zone });
    });
  });

  // Additional historical simulated detections for rich table
  const historicalDetections = [
    {
      id: 'det-hist-01',
      cameraId: 'CAM-04',
      cameraName: 'Rooftop North Perimeter',
      type: 'fall_risk' as DetectionType,
      confidence: 0.91,
      box: { x: 68, y: 22, w: 22, h: 62 },
      timestamp: '2 mins ago',
      label: 'POTENTIAL FALL RISK (High Risk Boundary)',
      severity: 'critical' as const,
      cameraZone: 'Rooftop',
      details: 'Subject trajectory approached 0.5m of safety ledge with high deceleration.'
    },
    {
      id: 'det-hist-02',
      cameraId: 'CAM-01',
      cameraName: 'Main Gate Entrance',
      type: 'person' as DetectionType,
      confidence: 0.96,
      box: { x: 38, y: 35, w: 18, h: 48 },
      timestamp: '5 mins ago',
      label: 'Person Detected (Employee Turnstile #2)',
      severity: 'info' as const,
      cameraZone: 'Perimeter',
      details: 'Biometric pass granted; access ID #9921'
    },
    {
      id: 'det-hist-03',
      cameraId: 'CAM-02',
      cameraName: 'Underground Parking B2',
      type: 'vehicle' as DetectionType,
      confidence: 0.94,
      box: { x: 25, y: 42, w: 32, h: 36 },
      timestamp: '12 mins ago',
      label: 'Vehicle: Sedan (DL-08-AB-4921)',
      severity: 'info' as const,
      cameraZone: 'Parking',
      details: 'Entered via ramp B; parked in designated Bay 14'
    },
    {
      id: 'det-hist-04',
      cameraId: 'CAM-05',
      cameraName: 'Server Vault Restricted',
      type: 'unauthorized_entry' as DetectionType,
      confidence: 0.95,
      box: { x: 12, y: 30, w: 20, h: 55 },
      timestamp: '45 mins ago',
      label: 'Tripwire Breach: Biometric Airlock',
      severity: 'critical' as const,
      cameraZone: 'Restricted',
      details: 'Unregistered personnel detected in Zone 0 airlock'
    },
    {
      id: 'det-hist-05',
      cameraId: 'CAM-03',
      cameraName: 'Executive Corridor 3F',
      type: 'person_down' as DetectionType,
      confidence: 0.93,
      box: { x: 40, y: 65, w: 45, h: 22 },
      timestamp: '1 hr ago',
      label: 'Motionless Subject on Floor',
      severity: 'critical' as const,
      cameraZone: 'Interior',
      details: 'Pose keypoints indicate prone position > 60s'
    },
    {
      id: 'det-hist-06',
      cameraId: 'CAM-06',
      cameraName: 'Loading Dock South',
      type: 'animal' as DetectionType,
      confidence: 0.84,
      box: { x: 55, y: 70, w: 15, h: 18 },
      timestamp: '2 hrs ago',
      label: 'Animal Detected (Stray Canine)',
      severity: 'low' as const,
      cameraZone: 'Perimeter',
      details: 'Perimeter exterior zone non-threat'
    }
  ];

  const combinedDetections = [...allDetections, ...historicalDetections];

  const filteredDetections = combinedDetections.filter(d => {
    const matchesType = selectedType === 'all' || d.type === selectedType;
    const matchesConf = d.confidence * 100 >= confidenceThreshold;
    return matchesType && matchesConf;
  });

  const detectionCategories: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'All Detections', count: combinedDetections.length },
    { key: 'person', label: 'People', count: combinedDetections.filter(d => d.type === 'person').length },
    { key: 'vehicle', label: 'Vehicles', count: combinedDetections.filter(d => d.type === 'vehicle').length },
    { key: 'fall_risk', label: 'Fall Risk', count: combinedDetections.filter(d => d.type === 'fall_risk').length },
    { key: 'unauthorized_entry', label: 'Unauthorized Entry', count: combinedDetections.filter(d => d.type === 'unauthorized_entry').length },
    { key: 'person_down', label: 'Person Down', count: combinedDetections.filter(d => d.type === 'person_down').length },
    { key: 'animal', label: 'Animals / Other', count: combinedDetections.filter(d => d.type === 'animal' || d.type === 'unknown').length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Neural Engine Control Banner (Light Theme) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-mono text-xs font-bold mb-1">
            <Cpu className="w-4 h-4 animate-spin text-orange-600" />
            <span>DEEP LEARNING INFERENCE TELEMETRY</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
            NEURAL OBJECT &amp; EVENT RECOGNITION
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time multi-task network pipeline parsing spatial bounding boxes, confidence scoring, and motion kinematics.
          </p>
        </div>

        {/* Model Switcher Pills */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200 font-mono text-xs">
          <button
            onClick={() => {
              soundManager.playRadarPing();
              setActiveModel('yolov10');
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
              activeModel === 'yolov10'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            YOLOv8 ONNX (Objects)
          </button>
          <button
            onClick={() => {
              soundManager.playRadarPing();
              setActiveModel('pose');
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
              activeModel === 'pose'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            HRNet-Pose (Fall &amp; Posture)
          </button>
          <button
            onClick={() => {
              soundManager.playRadarPing();
              setActiveModel('thermal');
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
              activeModel === 'thermal'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thermal-Spike (Fire/Smoke)
          </button>
        </div>
      </div>

      {/* Filters and Confidence Slider Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-mono text-xs">
        {/* Detection Type Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {detectionCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => {
                soundManager.playRadarPing();
                setSelectedType(cat.key);
              }}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer font-bold ${
                selectedType === cat.key
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Confidence Threshold Slider */}
        <div className="flex items-center gap-3 self-end md:self-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="text-slate-600 font-bold">MIN CONFIDENCE:</span>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={confidenceThreshold}
            onChange={e => setConfidenceThreshold(Number(e.target.value))}
            className="w-24 accent-orange-600 cursor-pointer"
          />
          <span className="text-orange-700 font-bold w-9">{confidenceThreshold}%</span>
        </div>
      </div>

      {/* Detections List & Detailed Breakdown Table (Light Table) */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden font-mono shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Activity className="w-4 h-4 text-orange-600" />
            <span>REAL-TIME INFERENCE LOG ({filteredDetections.length} CLASSIFICATIONS)</span>
          </div>
          <span className="text-slate-500 text-[11px] font-bold">SORTED BY RECENCY</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">DETECTION / OBJECT</th>
                <th className="py-3 px-4 font-bold">CAMERA LOCATION</th>
                <th className="py-3 px-4 font-bold">CONFIDENCE</th>
                <th className="py-3 px-4 font-bold">SEVERITY</th>
                <th className="py-3 px-4 font-bold">BOUNDING BOX</th>
                <th className="py-3 px-4 font-bold">TIMESTAMP</th>
                <th className="py-3 px-4 text-right font-bold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDetections.map(det => {
                const isCrit = det.severity === 'critical';
                const isHigh = det.severity === 'high';

                return (
                  <tr key={det.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {isCrit && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
                        <span>{det.label}</span>
                      </div>
                      {det.details && (
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                          {det.details}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-orange-700 font-bold">{det.cameraName}</div>
                      <div className="text-[11px] text-slate-500">{det.cameraId} &bull; {det.cameraZone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className={`h-full ${isCrit ? 'bg-red-600' : 'bg-orange-500'}`}
                            style={{ width: `${det.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">
                          {Math.round(det.confidence * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        isCrit 
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : isHigh
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-orange-100 text-orange-800 border-orange-300'
                      }`}>
                        {det.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      [{det.box.x}%, {det.box.y}%, {det.box.w}x{det.box.h}]
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {det.timestamp}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          const targetCam = cameras.find(c => c.id === det.cameraId);
                          if (targetCam) onSelectCamera(targetCam);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-600 hover:text-white text-orange-700 text-[11px] transition font-bold cursor-pointer border border-slate-200"
                      >
                        VIEW FEED &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
