"use client";

import React, { useState, useEffect } from "react";

const formatTime = (iso: string | undefined) => {
  if (!iso) {
    return "-";
  }
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return iso;
  }
};

const photoUrl = (apiBase: string, path: string | undefined) => {
  if (!path) {
    return undefined;
  }
  const parts = path.split(/[\\/]/);
  const basename = parts[parts.length - 1];
  if (!basename) {
    return undefined;
  }
  return apiBase + "/api/v1/shoplifting/evidence/" + encodeURIComponent(basename);
};

interface ShopliftingRecord {
  track_id: string;
  camera_id: string;
  entry_time: string;
  exit_time: string;
  duration_seconds: string;
  shelf_interaction: string;
  theft_suspected: string;
  detector_confidence: string;
  photo_path: string;
  logged_at: string;
}

export const ShopliftingLog: React.FC = () => {
  const [records, setRecords] = useState<ShopliftingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    let cancelled = false;
    const fetchLog = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/v1/shoplifting/log`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error("Server returned " + res.status);
        }
        const data = await res.json();
        if (!cancelled) {
          setRecords(data.records || []);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setRecords([]);
          setError(err.message || "Could not load log.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchLog();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const theftCount = records.filter((r) => r.theft_suspected === "True").length;
  const totalSeconds = records.reduce(
    (sum, r) => sum + (parseFloat(r.duration_seconds) || 0),
    0
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col gap-4">
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-xs text-slate-400">Loading shoplifting log...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <span role="img" aria-label="alert">
                  ⚠
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                  Shoplifting Log
                </h2>
                <p className="text-xs text-slate-400">
                  Every person the camera saw: when they entered, when they left, and whether they lingered near items.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                People Seen
              </div>
              <div className="text-xl font-mono text-slate-200">{records.length}</div>
            </div>
            <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded">
              <div className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold mb-1">
                Suspected Theft
              </div>
              <div className={theftCount > 0 ? "text-xl font-mono text-amber-400" : "text-xl font-mono text-emerald-400"}>
                {theftCount}
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Total Time in Shop
              </div>
              <div className="text-xl font-mono text-slate-200">
                {Math.floor(totalSeconds / 60)}m {Math.round(totalSeconds % 60)}s
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <span role="img" aria-label="alert">
                ⚠
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Person</th>
                  <th className="text-left px-4 py-3 font-medium">Entered</th>
                  <th className="text-left px-4 py-3 font-medium">Left</th>
                  <th className="text-left px-4 py-3 font-medium">Duration</th>
                  <th className="text-left px-4 py-3 font-medium">Near Items</th>
                  <th className="text-left px-4 py-3 font-medium">Confidence</th>
                  <th className="text-left px-4 py-3 font-medium">Photo</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      <p className="text-slate-100 font-medium mb-1">No shoplifting records yet.</p>
                      <p className="text-slate-500">
                        Run the edge agent on your shop camera footage to generate the log.
                      </p>
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => {
                    const isTheft = rec.theft_suspected === "True";
                    const imgSrc = photoUrl(apiBase, rec.photo_path);
                    return (
                      <tr key={rec.track_id} className="border-b border-slate-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-300">
                              {rec.track_id}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                isTheft
                                  ? "bg-red-950/40 border-amber-500 text-amber-400"
                                  : "bg-slate-800 border-slate-700 text-slate-400"
                              }`}
                            >
                              {isTheft ? "SUSPECTED THEFT" : "NORMAL VISIT"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-200 font-mono text-xs">
                          {formatTime(rec.entry_time)}
                        </td>
                        <td className="px-4 py-3 text-slate-200 font-mono text-xs">
                          {formatTime(rec.exit_time)}
                        </td>
                        <td className="px-4 py-3 text-slate-200 font-mono text-xs">
                          {Math.round(parseFloat(rec.duration_seconds || "0")) + "s"}
                        </td>
                        <td className="px-4 py-3 text-slate-200 text-xs">
                          {rec.shelf_interaction === "True" ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3 text-slate-200 font-mono text-xs">
                          {Math.round(parseFloat(rec.detector_confidence || "0") * 100)}%
                        </td>
                        <td className="px-4 py-3">
                          {imgSrc ? (
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgSrc}
                                alt="Evidence photo"
                                className="w-10 h-10 rounded object-cover border border-slate-700"
                                loading="lazy"
                              />
                              <span className="text-[9px] text-slate-400 font-mono">
                                Photo
                              </span>
                              {isTheft && (
                                <span className="text-[9px] text-red-400 font-bold">
                                  THEFT
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-mono">No photo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer hint */}
          <div className="border-t border-slate-800 pt-2 px-3">
            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
              <span role="img" aria-label="zap">⚡</span>{" "}
              Rows marked{" "}
              <span className="text-amber-400 font-bold">SUSPECTED THEFT</span>{" "}
              were seen near items and then left the shop — review their photo and verify with staff.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
