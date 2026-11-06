import React, { useState } from 'react';
import { UserRole, AuditLog } from '../../types';
import { 
  Shield, 
  Lock, 
  Key, 
  FileText, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  Download, 
  Check, 
  Sparkles, 
  AlertTriangle,
  Database,
  EyeOff
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface SettingsViewProps {
  currentRole: UserRole;
  onChangeRole: (newRole: UserRole) => void;
  auditLogs: AuditLog[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  onChangeRole,
  auditLogs
}) => {
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [soundMuted, setSoundMuted] = useState<boolean>(soundManager.isMuted);
  const [gdprEnabled, setGdprEnabled] = useState<boolean>(true);
  const [autoRedactFaces, setAutoRedactFaces] = useState<boolean>(false);
  const [autoRedactPlates, setAutoRedactPlates] = useState<boolean>(true);
  const [auditSearch, setAuditSearch] = useState<string>('');

  const roles: UserRole[] = [
    'Security Chief',
    'Surveillance Operator',
    'Threat Analyst',
    'System Auditor'
  ];

  const handleToggleSound = () => {
    const isNowMuted = soundManager.toggleMute();
    setSoundMuted(isNowMuted);
  };

  const handleRoleChange = (role: UserRole) => {
    soundManager.playSuccessChime();
    onChangeRole(role);
  };

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.target.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const exportAuditLog = () => {
    soundManager.playSuccessChime();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `DRISHTI_FLOW_AUDIT_LOG_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-orange-600 text-xs font-bold mb-1">
          <Shield className="w-4 h-4" />
          <span>CYBERSECURITY &amp; COMPLIANCE POLICIES</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          SYSTEM SETTINGS &amp; PRIVACY GOVERNANCE
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-based access controls, automated privacy redacting, immutable audit trail, and video retention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: RBAC & Privacy Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Role-Based Access Control Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-600" />
                <h3 className="font-bold text-xs text-slate-900">
                  ACTIVE USER ROLE ASSIGNMENT
                </h3>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                ACTIVE: {currentRole}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roles.map(role => {
                const isSelected = currentRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{role}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {role === 'Security Chief' && 'Full override, lockdown, and siren authority'}
                      {role === 'Surveillance Operator' && 'PTZ controls, incident dispatch, live monitoring'}
                      {role === 'Threat Analyst' && 'Detection scoring, model tuning, analytics export'}
                      {role === 'System Auditor' && 'Read-only compliance audit and logs review'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy & Redaction Settings */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-xs text-slate-900">
                AUTOMATED PRIVACY &amp; REDACTION POLICIES
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-slate-800 font-bold">AUTOMATIC VEHICLE LICENSE PLATE BLUR</div>
                  <div className="text-[11px] text-slate-500">Redacts civilian number plates before live stream rendering</div>
                </div>
                <button
                  onClick={() => setAutoRedactPlates(!autoRedactPlates)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    autoRedactPlates ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {autoRedactPlates ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-slate-800 font-bold">AUTOMATIC BIOMETRIC FACIAL MASKING</div>
                  <div className="text-[11px] text-slate-500">Gaussian blur on non-flagged pedestrian faces</div>
                </div>
                <button
                  onClick={() => setAutoRedactFaces(!autoRedactFaces)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    autoRedactFaces ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {autoRedactFaces ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>

          {/* Storage & Audio Preferences */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-xs text-slate-900">
                VIDEO RETENTION &amp; SOUND CONTROLS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-700 font-bold block">FOOTAGE RETENTION POLICY</span>
                <select
                  value={retentionDays}
                  onChange={e => setRetentionDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs"
                >
                  <option value={7}>7 Days (Perimeter buffer)</option>
                  <option value={30}>30 Days (Standard Enterprise)</option>
                  <option value={90}>90 Days (Financial / High Security)</option>
                  <option value={365}>365 Days (Statutory Archive)</option>
                </select>
                <div className="text-[10px] text-emerald-700 font-medium">
                  {gdprEnabled ? '✓ GDPR auto-purge enabled' : 'Manual purge'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-slate-700 font-bold block">SYNTHESIZED SOUND FX</span>
                  <div className="text-[11px] text-slate-500">Radar pings &amp; emergency siren audio</div>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    soundMuted ? 'bg-slate-200 text-slate-600' : 'bg-orange-600 text-white shadow-sm'
                  }`}
                >
                  {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{soundMuted ? 'SFX MUTED' : 'SFX ACTIVE'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Immutable Access & Audit Trail */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-xs text-slate-900">
                IMMUTABLE AUDIT TRAIL LOG
              </h3>
            </div>
            <button
              onClick={exportAuditLog}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
              title="Export Audit Log"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Search audit actions, users..."
            value={auditSearch}
            onChange={e => setAuditSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white"
          />

          <div className="space-y-2.5 overflow-y-auto max-h-[480px] flex-1 pr-1 text-xs">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-orange-600 font-bold">{log.id}</span>
                  <span className="text-slate-400">{log.timestamp}</span>
                </div>
                <div className="text-slate-900 font-bold">{log.action}</div>
                <div className="text-[11px] text-slate-600 font-sans">{log.target}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>BY: {log.user}</span>
                  <span className={log.status === 'ALERT' ? 'text-red-600 font-bold' : 'text-emerald-700 font-medium'}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

