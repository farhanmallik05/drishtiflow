import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
  Clock,
  FileText,
  ExternalLink,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

interface ShopliftingRecord {
  track_id: string;
  camera_id: string;
  entry_time: string;
  exit_time: string;
  duration_seconds: number;
  shelf_interaction: boolean;
  theft_suspected: boolean;
  detector_confidence: number;
  photo_path: string | null;
  photo_url: string | null;
  logged_at: string;
}

interface LogResponse {
  count: number;
  thefts_suspected?: number;
  records: ShopliftingRecord[];
}

function formatTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  return `${seconds.toFixed(1)}s`;
}

export const ShopliftingLogView: React.FC = () => {
  const [records, setRecords] = useState<ShopliftingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/shoplifting/log`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Backend returned HTTP ${res.status}`);
      }
      const data: LogResponse = await res.json();
      setRecords(Array.isArray(data.records) ? data.records : []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(
        err?.message === 'Failed to fetch'
          ? 'Cannot reach the backend on port 8000. Start the API and try again.'
          : err?.message || 'Failed to load the shoplifting log',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  const thefts = records.filter((r) => r.theft_suspected).length;
  const interactions = records.filter((r) => r.shelf_interaction).length;
  const theftRate = records.length ? Math.round((thefts / records.length) * 100) : 0;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-600 text-xs font-bold mb-1">
            <FileText className="w-4 h-4" />
            <span>SHOPLIFTING DETECTION RESULTS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            SHOPLIFTING LOG
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Per-person tracks from the YOLOv8n + shelf-interaction pipeline, with evidence photos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400">Updated {lastUpdated}</span>
          )}
          <button
            onClick={loadLog}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              loading
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> PERSONS TRACKED
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{records.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Finalized tracks</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> SUSPECTED THEFTS
          </div>
          <div className="text-2xl font-extrabold text-red-600">{thefts}</div>
          <div className="text-[11px] text-red-500 mt-1">Shelf interaction + exit</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> THEFT RATE
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{theftRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Of tracked persons</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> SHELF INTERACTIONS
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{interactions}</div>
          <div className="text-[11px] text-slate-500 mt-1">Entered shelf zone</div>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">TRACKED PERSONS</h3>
          <span className="text-[11px] text-slate-400">Newest first</span>
        </div>

        {loading && records.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading records…</div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No detection records yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Open <span className="font-semibold">Video Upload &amp; Detection</span>, upload a shop
              video, then click <span className="font-semibold">Run Shoplifting Detection</span>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
                  <th className="px-4 py-3 text-left font-bold">Track</th>
                  <th className="px-4 py-3 text-left font-bold">Camera</th>
                  <th className="px-4 py-3 text-left font-bold">Entry</th>
                  <th className="px-4 py-3 text-left font-bold">Exit</th>
                  <th className="px-4 py-3 text-left font-bold">Duration</th>
                  <th className="px-4 py-3 text-left font-bold">Shelf</th>
                  <th className="px-4 py-3 text-left font-bold">Theft</th>
                  <th className="px-4 py-3 text-left font-bold">Conf.</th>
                  <th className="px-4 py-3 text-left font-bold">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={`${record.track_id}-${record.logged_at}`} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{record.track_id}</td>
                    <td className="px-4 py-3 text-slate-600">{record.camera_id}</td>
                    <td className="px-4 py-3 text-slate-600">{formatTime(record.entry_time)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatTime(record.exit_time)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDuration(record.duration_seconds)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          record.shelf_interaction
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {record.shelf_interaction ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          record.theft_suspected
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {record.theft_suspected ? 'SUSPECTED' : 'CLEAR'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(record.detector_confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3">
                      {record.photo_url ? (
                        <a
                          href={`${API_BASE}${record.photo_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-500 font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
