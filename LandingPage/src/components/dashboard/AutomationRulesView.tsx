import React, { useState } from 'react';
import { AutomationRule, Camera, DetectionType, AlertSeverity } from '../../types';
import { 
  Layers, 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  Power, 
  Clock, 
  BellRing, 
  ShieldAlert, 
  Volume2, 
  Lock, 
  Radio, 
  Send,
  Calendar,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface AutomationRulesViewProps {
  rules: AutomationRule[];
  cameras: Camera[];
  onAddRule: (rule: AutomationRule) => void;
  onUpdateRule: (rule: AutomationRule) => void;
  onDeleteRule: (id: string) => void;
}

export const AutomationRulesView: React.FC<AutomationRulesViewProps> = ({
  rules,
  cameras,
  onAddRule,
  onUpdateRule,
  onDeleteRule
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Form State for Rule Builder
  const [name, setName] = useState('');
  const [selectedCameras, setSelectedCameras] = useState<string[]>([cameras[0]?.id || 'CAM-01']);
  const [detectionType, setDetectionType] = useState<string>('person');
  const [zone, setZone] = useState('Main Gate Entrance');
  const [timeType, setTimeType] = useState<'24_7' | 'after_hours' | 'custom'>('after_hours');
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('06:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [triggerCondition, setTriggerCondition] = useState<'immediate' | 'loitering_5min' | 'count_exceeded'>('immediate');
  const [severity, setSeverity] = useState<AlertSeverity>('critical');
  const [action, setAction] = useState<'notify_security' | 'sound_alarm' | 'lockdown' | 'dispatch_drone' | 'webhook'>('notify_security');
  const [channels, setChannels] = useState<('in_app' | 'email' | 'push' | 'sms_whatsapp')[]>(['in_app', 'push', 'sms_whatsapp']);

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleOpenCreateModal = () => {
    soundManager.playRadarPing();
    setEditingRule(null);
    setName('');
    setSelectedCameras([cameras[0]?.id || 'CAM-01']);
    setDetectionType('person');
    setZone('Main Gate Entrance');
    setTimeType('after_hours');
    setStartTime('22:00');
    setEndTime('06:00');
    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    setTriggerCondition('immediate');
    setSeverity('critical');
    setAction('notify_security');
    setChannels(['in_app', 'push', 'sms_whatsapp']);
    setModalOpen(true);
  };

  const handleOpenEditModal = (rule: AutomationRule) => {
    soundManager.playRadarPing();
    setEditingRule(rule);
    setName(rule.name);
    setSelectedCameras(rule.cameraIds);
    setDetectionType(rule.detectionType);
    setZone(rule.zone);
    setTimeType(rule.timeCondition.type);
    setStartTime(rule.timeCondition.startTime || '22:00');
    setEndTime(rule.timeCondition.endTime || '06:00');
    setSelectedDays(rule.days);
    setTriggerCondition(rule.triggerCondition);
    setSeverity(rule.alertSeverity);
    setAction(rule.action);
    setChannels(rule.notificationChannels);
    setModalOpen(true);
  };

  const handleToggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleToggleChannel = (chan: 'in_app' | 'email' | 'push' | 'sms_whatsapp') => {
    if (channels.includes(chan)) {
      if (channels.length > 1) {
        setChannels(channels.filter(c => c !== chan));
      }
    } else {
      setChannels([...channels, chan]);
    }
  };

  const handleSaveRule = () => {
    soundManager.playSuccessChime();

    const ruleObj: AutomationRule = {
      id: editingRule ? editingRule.id : `RULE-${Math.floor(Math.random() * 899 + 200)}`,
      name: name || `Rule: ${detectionType.toUpperCase()} at ${zone}`,
      enabled: editingRule ? editingRule.enabled : true,
      cameraIds: selectedCameras,
      detectionType: detectionType as any,
      zone,
      timeCondition: {
        type: timeType,
        startTime: timeType !== '24_7' ? startTime : undefined,
        endTime: timeType !== '24_7' ? endTime : undefined
      },
      days: selectedDays,
      triggerCondition,
      alertSeverity: severity,
      notificationChannels: channels,
      action,
      triggerCount: editingRule ? editingRule.triggerCount : 0,
      createdAt: editingRule ? editingRule.createdAt : new Date().toISOString().slice(0, 10)
    };

    if (editingRule) {
      onUpdateRule(ruleObj);
    } else {
      onAddRule(ruleObj);
    }
    setModalOpen(false);
  };

  const handleToggleRuleStatus = (rule: AutomationRule) => {
    soundManager.playRadarPing();
    onUpdateRule({ ...rule, enabled: !rule.enabled });
  };

  const handleDelete = (id: string) => {
    soundManager.playRadarPing();
    onDeleteRule(id);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header & Quick Builder Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-600 text-xs font-bold mb-1">
            <Layers className="w-4 h-4" />
            <span>POLICY ENGINE &bull; SMART AUTOMATION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            SURVEILLANCE AUTOMATION RULES
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Event-driven condition pipelines executing autonomous lockdown, siren broadcast, and verified alert delivery.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW RULE</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map(rule => {
          const isCrit = rule.alertSeverity === 'critical';

          return (
            <div
              key={rule.id}
              className={`p-5 rounded-2xl bg-white border transition-all shadow-sm ${
                rule.enabled
                  ? isCrit
                    ? 'border-red-300 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.08)]'
                    : 'border-slate-200 hover:border-orange-300'
                  : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleRuleStatus(rule)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer ${
                      rule.enabled
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                    title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 font-sans">{rule.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-bold">
                        {rule.id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>SECTOR: {rule.zone}</span>
                      <span>&bull;</span>
                      <span>CAMERAS: {rule.cameraIds.join(', ')}</span>
                      <span>&bull;</span>
                      <span>FIRED: {rule.triggerCount} TIMES</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center">
                  <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold border ${
                    isCrit 
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {rule.alertSeverity} SEVERITY
                  </span>

                  <button
                    onClick={() => handleOpenEditModal(rule)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                    title="Edit Rule"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200 transition cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Logic Breakdown Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
                {/* IF */}
                <div className="p-3 rounded-xl bg-orange-50/40 border border-orange-100">
                  <span className="text-orange-700 font-bold block text-[10px] mb-1">IF TRIGGER</span>
                  <div className="text-slate-800">
                    <strong className="text-slate-900 uppercase">{rule.detectionType}</strong> detected in {rule.zone}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Condition: {rule.triggerCondition}</div>
                </div>

                {/* AND */}
                <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-100">
                  <span className="text-amber-700 font-bold block text-[10px] mb-1">AND CONSTRAINTS</span>
                  <div className="text-slate-800">
                    Time: {rule.timeCondition.type === '24_7' ? '24/7 All Hours' : `${rule.timeCondition.startTime} - ${rule.timeCondition.endTime}`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Days: {rule.days.join(', ')}</div>
                </div>

                {/* THEN */}
                <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100">
                  <span className="text-emerald-700 font-bold block text-[10px] mb-1">THEN ACTION</span>
                  <div className="text-emerald-700 font-bold uppercase">
                    {rule.action.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Channels: {rule.notificationChannels.join(', ')}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Rule Builder Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingRule ? 'EDIT AUTOMATION RULE' : 'CREATE VISUAL AUTOMATION RULE'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 font-bold"
              >
                CANCEL [ESC]
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Rule Name */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">RULE NAME</label>
                <input
                  type="text"
                  placeholder="e.g. After-Hours Vault Lockdown Protocol"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-sans"
                />
              </div>

              {/* Camera & Detection Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">CAMERA FEED</label>
                  <select
                    value={selectedCameras[0]}
                    onChange={e => setSelectedCameras([e.target.value])}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-orange-500 text-xs"
                  >
                    {cameras.map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.id}] {c.name} ({c.zone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">DETECTION TYPE</label>
                  <select
                    value={detectionType}
                    onChange={e => setDetectionType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-orange-500 text-xs"
                  >
                    <option value="person">Person</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="fall_risk">Potential Fall Risk</option>
                    <option value="fire_smoke">Fire / Smoke</option>
                    <option value="unauthorized_entry">Unauthorized Entry</option>
                    <option value="person_down">Person Down (Medical)</option>
                  </select>
                </div>
              </div>

              {/* Time Condition */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">TIME SCHEDULE CONDITION</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTimeType('24_7')}
                      className={`px-3 py-1 rounded-lg transition ${
                        timeType === '24_7' ? 'bg-orange-600 text-white font-bold' : 'text-slate-600 bg-slate-200'
                      }`}
                    >
                      24/7 Always
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeType('after_hours')}
                      className={`px-3 py-1 rounded-lg transition ${
                        timeType === 'after_hours' ? 'bg-orange-600 text-white font-bold' : 'text-slate-600 bg-slate-200'
                      }`}
                    >
                      After Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeType('custom')}
                      className={`px-3 py-1 rounded-lg transition ${
                        timeType === 'custom' ? 'bg-orange-600 text-white font-bold' : 'text-slate-600 bg-slate-200'
                      }`}
                    >
                      Custom Window
                    </button>
                  </div>
                </div>

                {timeType !== '24_7' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1 font-bold">START TIME</span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1 font-bold">END TIME</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Days Selection */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">ACTIVE DAYS OF WEEK</label>
                <div className="flex flex-wrap gap-2">
                  {daysList.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleToggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        selectedDays.includes(d)
                          ? 'bg-orange-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action to Perform and Alert Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">ACTION TO EXECUTE</label>
                  <select
                    value={action}
                    onChange={e => setAction(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-orange-500 text-xs"
                  >
                    <option value="notify_security">Notify Security Team</option>
                    <option value="sound_alarm">Sound Perimeter Acoustic Siren</option>
                    <option value="lockdown">Magnetic Vault Lockdown</option>
                    <option value="dispatch_drone">Dispatch Surveillance Drone</option>
                    <option value="webhook">Trigger External Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">ALERT SEVERITY</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as AlertSeverity)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-orange-500 text-xs"
                  >
                    <option value="critical">Critical (Red Escalation)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Notification Channels */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">NOTIFICATION CHANNELS</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'in_app' as const, label: 'In-App Console' },
                    { key: 'push' as const, label: 'Browser Push' },
                    { key: 'email' as const, label: 'Security Email' },
                    { key: 'sms_whatsapp' as const, label: 'SMS / WhatsApp' },
                  ].map(chan => (
                    <button
                      key={chan.key}
                      type="button"
                      onClick={() => handleToggleChannel(chan.key)}
                      className={`p-2.5 rounded-xl border text-xs text-center transition ${
                        channels.includes(chan.key)
                          ? 'bg-orange-50 text-orange-700 border-orange-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {chan.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition"
              >
                <Check className="w-4 h-4" />
                <span>SAVE &amp; ARM RULE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

