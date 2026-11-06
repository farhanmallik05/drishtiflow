import React, { useState } from 'react';
import { NotificationItem, DeliveryStatus, AlertSeverity } from '../../types';
import { 
  BellRing, 
  Check, 
  CheckCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Mail, 
  Smartphone, 
  Download, 
  Filter, 
  Search, 
  CheckCircle2, 
  XCircle,
  ExternalLink
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onAcknowledge,
  onResolve,
  onMarkAllRead
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const deliveryStages: DeliveryStatus[] = [
    'Alert Generated',
    'Alert Sent',
    'Delivered',
    'Acknowledged',
    'Resolved'
  ];

  const filtered = notifications.filter(n => {
    const matchesSev = filterSeverity === 'all' || n.severity === filterSeverity;
    const matchesSearch = n.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.eventId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const exportIncidentReport = (item: NotificationItem) => {
    soundManager.playSuccessChime();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `INCIDENT_${item.eventId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header & Filters Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-600 text-xs font-bold mb-1">
            <BellRing className="w-4 h-4" />
            <span>REAL-TIME DISPATCH MONITOR</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            NOTIFICATION CENTER
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict verified multi-channel delivery states: Generated &rarr; Sent &rarr; Delivered &rarr; Acknowledged &rarr; Resolved.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            {['all', 'critical', 'high', 'info'].map(sev => (
              <button
                key={sev}
                onClick={() => {
                  soundManager.playRadarPing();
                  setFilterSeverity(sev);
                }}
                className={`px-3 py-1.5 rounded-lg transition uppercase ${
                  filterSeverity === sev
                    ? 'bg-orange-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              soundManager.playSuccessChime();
              onMarkAllRead();
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs border border-slate-200 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer font-bold"
          >
            <CheckCheck className="w-3.5 h-3.5 text-orange-600" />
            <span>MARK ALL READ</span>
          </button>
        </div>
      </div>

      {/* Notifications Queue List */}
      <div className="space-y-4">
        {filtered.map(item => {
          const isCrit = item.severity === 'critical';
          const isHigh = item.severity === 'high';

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl bg-white border transition-all shadow-sm ${
                !item.read
                  ? isCrit
                    ? 'border-red-300 bg-red-50/20 shadow-[0_0_15px_rgba(239,68,68,0.06)]'
                    : 'border-orange-200 bg-orange-50/20'
                  : 'border-slate-200 bg-white opacity-90'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isCrit 
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : isHigh
                      ? 'bg-purple-50 text-purple-600 border border-purple-200'
                      : 'bg-orange-50 text-orange-600 border border-orange-200'
                  }`}>
                    {isCrit ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <BellRing className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 font-sans">{item.headline}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                        {item.eventId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.relativeTime} ({item.timestamp})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-sans max-w-3xl leading-relaxed">
                      {item.details}
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1.5">
                      <span>LOCATION: <strong className="text-orange-700">{item.location}</strong></span>
                      <span>CAMERA: <strong className="text-slate-800">{item.cameraName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center">
                  <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold border ${
                    isCrit 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {item.severity}
                  </span>

                  {item.deliveryStatus !== 'Resolved' && (
                    <button
                      onClick={() => {
                        soundManager.playSuccessChime();
                        onAcknowledge(item.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs border border-slate-200 transition cursor-pointer font-bold"
                    >
                      ACKNOWLEDGE
                    </button>
                  )}

                  {item.deliveryStatus !== 'Resolved' ? (
                    <button
                      onClick={() => {
                        soundManager.playSuccessChime();
                        onResolve(item.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                    >
                      RESOLVE
                    </button>
                  ) : (
                    <span className="text-emerald-700 text-xs flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded border border-emerald-200 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      RESOLVED
                    </span>
                  )}

                  <button
                    onClick={() => exportIncidentReport(item)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 transition"
                    title="Export Incident JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delivery State Pipeline */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold">DISPATCH PIPELINE VERIFICATION:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-bold">CHANNELS:</span>
                    {item.channels.map(chan => (
                      <span key={chan} className="text-slate-700 uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                        {chan.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {deliveryStages.map((stage, idx) => {
                    const currentIdx = deliveryStages.indexOf(item.deliveryStatus);
                    const isCompleted = currentIdx >= idx;
                    const isCurrent = item.deliveryStatus === stage;

                    return (
                      <div
                        key={stage}
                        className={`p-2 rounded-lg border text-center text-[10px] transition ${
                          isCurrent
                            ? 'bg-orange-50 border-orange-400 text-orange-800 font-bold shadow-sm'
                            : isCompleted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isCompleted && <Check className="w-3 h-3 text-emerald-600" />}
                          <span>{stage}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 font-mono shadow-sm">
            Zero active notifications found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
};

