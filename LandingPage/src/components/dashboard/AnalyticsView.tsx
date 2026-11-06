import React, { useState } from 'react';
import { Camera, NotificationItem } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Calendar, 
  Clock, 
  Filter, 
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  Sliders
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface AnalyticsViewProps {
  cameras: Camera[];
  notifications: NotificationItem[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  cameras,
  notifications
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Simulated 24-hour activity trend data
  const hourlyData = [
    { hour: '00:00', detections: 12, alerts: 0 },
    { hour: '02:00', detections: 8, alerts: 1 },
    { hour: '04:00', detections: 5, alerts: 0 },
    { hour: '06:00', detections: 19, alerts: 0 },
    { hour: '08:00', detections: 64, alerts: 1 },
    { hour: '10:00', detections: 92, alerts: 0 },
    { hour: '12:00', detections: 85, alerts: 0 },
    { hour: '14:00', detections: 110, alerts: 2 },
    { hour: '16:00', detections: 98, alerts: 0 },
    { hour: '18:00', detections: 72, alerts: 1 },
    { hour: '20:00', detections: 48, alerts: 1 },
    { hour: '22:00', detections: 35, alerts: 2 },
  ];

  // Category Distribution
  const categoryStats = [
    { label: 'Authorized Staff', count: 184, color: '#00f0ff', percent: 45 },
    { label: 'Visitors & Vendors', count: 112, color: '#8b5cf6', percent: 28 },
    { label: 'Vehicles', count: 68, color: '#38bdf8', percent: 17 },
    { label: 'Emergency Events', count: 14, color: '#ef4444', percent: 6 },
    { label: 'Unidentified/Animal', count: 18, color: '#eab308', percent: 4 },
  ];

  // Top Active Cameras Leaderboard
  const cameraRankings = [
    { id: 'CAM-01', name: 'Main Gate Entrance', zone: 'Perimeter', count: 245, alertRate: '1.2%' },
    { id: 'CAM-03', name: 'Executive Corridor 3F', zone: 'Interior', count: 198, alertRate: '0.8%' },
    { id: 'CAM-02', name: 'Underground Parking B2', zone: 'Parking', count: 142, alertRate: '2.1%' },
    { id: 'CAM-04', name: 'Rooftop North Perimeter', zone: 'Rooftop', count: 87, alertRate: '4.8%' },
    { id: 'CAM-05', name: 'Server Vault Restricted', zone: 'Restricted', count: 32, alertRate: '6.2%' },
  ];

  // 24-Hour Security Heatmap (Hours 0-23 across 7 days)
  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header & Range Filters */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-600 text-xs font-bold mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>AI TELEMETRY &amp; PATTERN INTELLIGENCE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            SURVEILLANCE ANALYTICS ENGINE
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal heatmaps, detection volumetric trends, and emergency response performance indexes.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          {(['24h', '7d', '30d'] as const).map(range => (
            <button
              key={range}
              onClick={() => {
                soundManager.playRadarPing();
                setTimeRange(range);
              }}
              className={`px-3 py-1.5 rounded-lg transition uppercase ${
                timeRange === range
                  ? 'bg-orange-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold mb-1">AVG RESPONSE TIME</div>
          <div className="text-2xl font-extrabold text-slate-900">18.4s</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">&darr; 24% faster than target</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold mb-1">TOTAL INFERENCES</div>
          <div className="text-2xl font-extrabold text-orange-600">682,410</div>
          <div className="text-[11px] text-slate-500 mt-1">100% Neural Coverage</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold mb-1">CONFIRMED RESOLUTIONS</div>
          <div className="text-2xl font-extrabold text-emerald-600">97.8%</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Audit Grade Verified</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold mb-1">ANOMALY ESCALATION RATE</div>
          <div className="text-2xl font-extrabold text-amber-600">2.4%</div>
          <div className="text-[11px] text-slate-500 mt-1">Low False Alert Ratio</div>
        </div>
      </div>

      {/* Charts Grid: 24h Area Trend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24h Detections & Alerts Area Chart */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-xs text-slate-900">
                TEMPORAL DETECTION DENSITY (24-HOUR TIMELINE)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-orange-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                Detections
              </span>
              <span className="flex items-center gap-1.5 text-red-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                Emergency Alerts
              </span>
            </div>
          </div>

          {/* SVG Area & Bar Chart */}
          <div className="relative h-64 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
              <defs>
                <linearGradient id="saffronArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#e2e8f0" strokeDasharray="3 3" />

              {/* Area Path */}
              <path
                d={`M 0,${200 - (hourlyData[0].detections / 120) * 180} ` + 
                   hourlyData.map((d, i) => `L ${(i / (hourlyData.length - 1)) * 600},${200 - (d.detections / 120) * 180}`).join(' ') + 
                   ` L 600,200 L 0,200 Z`}
                fill="url(#saffronArea)"
              />

              {/* Line Stroke */}
              <path
                d={`M 0,${200 - (hourlyData[0].detections / 120) * 180} ` + 
                   hourlyData.map((d, i) => `L ${(i / (hourlyData.length - 1)) * 600},${200 - (d.detections / 120) * 180}`).join(' ')}
                fill="none"
                stroke="#ea580c"
                strokeWidth="2.5"
              />

              {/* Alert Spikes as Red Vertical Beacons */}
              {hourlyData.map((d, i) => {
                const x = (i / (hourlyData.length - 1)) * 600;
                const y = 200 - (d.detections / 120) * 180;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#ea580c" />
                    {d.alerts > 0 && (
                      <>
                        <line x1={x} y1={y} x2={x} y2={y - 25} stroke="#ef4444" strokeWidth="2" strokeDasharray="2 2" />
                        <circle cx={x} cy={y - 25} r="4" fill="#ef4444" className="animate-ping" />
                        <circle cx={x} cy={y - 25} r="3" fill="#ef4444" />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-slate-500 pt-3">
              {hourlyData.map((d, i) => (
                <span key={i}>{d.hour}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detection Category Distribution */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-orange-600" />
              <span>CATEGORY DISTRIBUTION</span>
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.map(stat => (
              <div key={stat.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{stat.label}</span>
                  <span className="font-bold text-slate-900">{stat.percent}% ({stat.count})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.percent}%`, backgroundColor: stat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-sans mt-4">
            AI classification confidence averages <strong>94.2%</strong> across non-threat pedestrian events and <strong>91.8%</strong> for structural hazard triggers.
          </div>
        </div>
      </div>

      {/* Heatmap & Most Active Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-Hour Day/Hour Heatmap Matrix */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>24-HOUR SECURITY ACTIVITY HEATMAP (DAY X HOUR)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">INCIDENT DENSITY</span>
          </div>

          <div className="space-y-2 pt-1">
            {heatmapDays.map((day, dIdx) => (
              <div key={day} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-[11px] text-slate-500 font-bold">{day}</span>
                <div className="grid grid-cols-12 gap-1.5 flex-1">
                  {Array.from({ length: 12 }).map((_, hIdx) => {
                    const intensity = (dIdx * 3 + hIdx * 7) % 5;
                    const colors = [
                      'bg-slate-100 border-slate-200',
                      'bg-orange-100 border-orange-200',
                      'bg-orange-300 border-orange-400',
                      'bg-orange-500 border-orange-600',
                      'bg-red-500 border-red-600 shadow-sm'
                    ];

                    return (
                      <div
                        key={hIdx}
                        title={`${day} @ ${hIdx * 2}:00 - Level ${intensity}`}
                        className={`h-5 rounded-[4px] border ${colors[intensity]} transition-transform hover:scale-110 cursor-pointer`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-bold">
            <span>00:00 (MIDNIGHT)</span>
            <span>12:00 (NOON)</span>
            <span>22:00 (NIGHT)</span>
          </div>
        </div>

        {/* Right: Most Active Camera Locations Leaderboard */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-600" />
              <span>MOST ACTIVE CAMERA LOCATIONS</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {cameraRankings.map((cam, idx) => (
              <div
                key={cam.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:bg-orange-50/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] border border-slate-300">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{cam.name}</div>
                    <div className="text-[10px] text-slate-500">{cam.id} &bull; {cam.zone}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-orange-700 font-bold">{cam.count} Detections</div>
                  <div className="text-[10px] text-red-600 font-semibold">{cam.alertRate} alert rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

