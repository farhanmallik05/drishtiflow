import React, { useState } from 'react';
import { 
  Camera, 
  EmergencyEvent, 
  AutomationRule, 
  NotificationItem, 
  AuditLog, 
  UserRole 
} from './types';
import { 
  INITIAL_CAMERAS, 
  INITIAL_EMERGENCIES, 
  INITIAL_RULES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS 
} from './data/mockData';
import { soundManager } from './utils/soundEffects';

// Views
import { LandingPage } from './components/landing/LandingPage';
import { OverviewView } from './components/dashboard/OverviewView';
import { LiveCamerasView } from './components/dashboard/LiveCamerasView';
import { AiDetectionView } from './components/dashboard/AiDetectionView';
import { EmergencyCenterView } from './components/dashboard/EmergencyCenterView';
import { VoiceAssistantView } from './components/dashboard/VoiceAssistantView';
import { AutomationRulesView } from './components/dashboard/AutomationRulesView';
import { NotificationsView } from './components/dashboard/NotificationsView';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { CameraManagementView } from './components/dashboard/CameraManagementView';
import { SettingsView } from './components/dashboard/SettingsView';

// Icons
import {
  LayoutDashboard,
  Camera as CameraIcon,
  Cpu,
  ShieldAlert,
  Mic,
  Layers,
  BellRing,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  Radio,
  Volume2,
  VolumeX,
  UserCheck,
  Zap,
  ArrowLeft,
  ShieldCheck,
  Flame,
  AlertTriangle
} from 'lucide-react';

export function App() {
  // App Navigation: 'landing' or 'dashboard'
  const [currentPage, setCurrentPage] = useState<'landing' | 'dashboard'>('landing');

  // Dashboard Tab Navigation:
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Core Application State
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [emergencies, setEmergencies] = useState<EmergencyEvent[]>(INITIAL_EMERGENCIES);
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [currentRole, setCurrentRole] = useState<UserRole>('Security Chief');
  const [soundMuted, setSoundMuted] = useState<boolean>(soundManager.isMuted);

  // Selected Camera for deep inspection
  const [selectedCameraForDetail, setSelectedCameraForDetail] = useState<Camera | null>(null);

  // Add Camera Modal state in CameraManagement
  const [addCameraModalOpen, setAddCameraModalOpen] = useState(false);

  // Navigation Items (10 Items from Specification)
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'cameras', label: 'Live Cameras', icon: CameraIcon },
    { id: 'detection', label: 'AI Detection', icon: Cpu },
    { 
      id: 'emergency', 
      label: 'Emergency Center', 
      icon: ShieldAlert,
      badge: emergencies.filter(e => e.status !== 'resolved').length > 0 ? 'CRITICAL' : undefined,
      badgeColor: 'bg-red-500'
    },
    { id: 'voice', label: 'Voice Assistant (LISTY)', icon: Mic },
    { id: 'automation', label: 'Automation Rules', icon: Layers },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: BellRing,
      badge: notifications.filter(n => !n.read).length > 0 ? String(notifications.filter(n => !n.read).length) : undefined,
      badgeColor: 'bg-amber-500'
    },
    { id: 'history', label: 'Activity History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'manage_cameras', label: 'Camera Management', icon: Radio },
    { id: 'settings', label: 'Settings & Privacy', icon: Settings },
  ];

  // Global Audio Mute Toggle
  const handleToggleSound = () => {
    const isNowMuted = soundManager.toggleMute();
    setSoundMuted(isNowMuted);
  };

  // Switch to specific dashboard tab
  const handleNavigateToDashboard = (targetTab: string = 'overview') => {
    setCurrentPage('dashboard');
    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // State handlers for Emergencies
  const handleUpdateEmergency = (updated: EmergencyEvent) => {
    setEmergencies(prev => prev.map(e => e.id === updated.id ? updated : e));
    // Add audit log
    const log: AuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
      user: currentRole,
      role: currentRole,
      action: `EMERGENCY_STATUS_${updated.status.toUpperCase()}`,
      target: updated.headline,
      status: updated.status === 'resolved' ? 'SUCCESS' : 'ALERT'
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleAcknowledgeEmergency = (id: string) => {
    const target = emergencies.find(e => e.id === id);
    if (!target) return;
    handleUpdateEmergency({
      ...target,
      status: 'acknowledged'
    });
  };

  // State handlers for Rules
  const handleAddRule = (newRule: AutomationRule) => {
    setRules(prev => [newRule, ...prev]);
    const log: AuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
      user: currentRole,
      role: currentRole,
      action: 'AUTOMATION_RULE_CREATED',
      target: newRule.name,
      status: 'SUCCESS'
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleUpdateRule = (updatedRule: AutomationRule) => {
    setRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  // State handlers for Notifications
  const handleAcknowledgeNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, deliveryStatus: 'Acknowledged', read: true } : n));
  };

  const handleResolveNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, deliveryStatus: 'Resolved', read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Snapshot capture handler
  const handleCaptureSnapshot = (dataUrl: string, camera: Camera) => {
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      eventId: `EVT-${Math.floor(Math.random() * 8999 + 1000)}`,
      cameraId: camera.id,
      cameraName: camera.name,
      category: 'person',
      location: camera.location,
      timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
      relativeTime: 'Just now',
      severity: 'info',
      headline: `Evidence Snapshot Captured (${camera.name})`,
      details: `Operator manual snapshot logged for sector: ${camera.location}`,
      deliveryStatus: 'Delivered',
      channels: ['in_app'],
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Camera Management Handlers
  const handleAddCamera = (newCam: Camera) => {
    setCameras(prev => [...prev, newCam]);
  };

  const handleUpdateCamera = (updatedCam: Camera) => {
    setCameras(prev => prev.map(c => c.id === updatedCam.id ? updatedCam : c));
  };

  const handleDeleteCamera = (id: string) => {
    setCameras(prev => prev.filter(c => c.id !== id));
  };

  // If on Landing Page, render LandingPage component
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onEnterDashboard={(tab) => handleNavigateToDashboard(tab)}
      />
    );
  }

  // Active Critical Emergency Count
  const activeCriticalEmergencies = emergencies.filter(e => e.status !== 'resolved');

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-mono selection:bg-orange-500 selection:text-white">
      {/* Top Operations Header Bar (Light Theme) */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-xs">
        {/* Left: Brand & Return to Landing */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playRadarPing();
              setCurrentPage('landing');
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-orange-600 text-xs border border-slate-300 transition cursor-pointer"
            title="Return to Presentation Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">LANDING</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-600 p-[2px] shadow-xs">
              <div className="w-full h-full bg-white rounded-[6px] flex items-center justify-center">
                <Eye className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 font-mono">
                DrishtiFlow
              </span>
              <span className="text-xs font-bold text-orange-600 ml-1">
                (दृष्टि-फ़्लो)
              </span>
              <span className="hidden md:inline text-[10px] text-slate-500 font-bold ml-2 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                COMMAND CONSOLE
              </span>
            </div>
          </div>
        </div>

        {/* Center: Real-time Emergency Ticker */}
        {activeCriticalEmergencies.length > 0 && (
          <div 
            onClick={() => setActiveTab('emergency')}
            className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-300 text-red-800 text-xs cursor-pointer animate-pulse hover:bg-red-100 shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span className="font-bold">CRITICAL ALERT:</span>
            <span className="truncate max-w-sm">{activeCriticalEmergencies[0].headline}</span>
          </div>
        )}

        {/* Right: Audio Toggle, Mode Indicator, Role Selector */}
        <div className="flex items-center gap-3">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-lg text-xs font-mono border transition cursor-pointer ${
              soundMuted 
                ? 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600' 
                : 'bg-orange-50 border-orange-300 text-orange-700 shadow-xs'
            }`}
            title={soundMuted ? 'Unmute Synthesized SFX' : 'Mute Synthesized SFX'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Simulation Mode Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-[10px] text-emerald-800 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
            <span>EDGE INGEST: ACTIVE</span>
          </div>

          {/* Active Role Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800 font-bold">
            <UserCheck className="w-3.5 h-3.5 text-orange-600" />
            <span>{currentRole}</span>
          </div>
        </div>
      </header>

      {/* Main Body: Sidebar + Dynamic View Content (Light Theme) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <aside
          className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 shrink-0 shadow-xs ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundManager.playRadarPing();
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-orange-50 text-orange-800 border-l-4 border-orange-600 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-500 group-hover:text-slate-700'}`} />

                  {!sidebarCollapsed && (
                    <span className="truncate text-left flex-1">{item.label}</span>
                  )}

                  {!sidebarCollapsed && item.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] text-white font-bold ${item.badgeColor || 'bg-orange-600'}`}>
                      {item.badge}
                    </span>
                  )}

                  {sidebarCollapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Sidebar Collapse Toggle */}
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            {!sidebarCollapsed && <span className="font-bold text-slate-600">DRISHTIFLOW v2.6</span>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer mx-auto border border-slate-200"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Viewport Content Area (Light Grid) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100/70 cyber-grid relative text-slate-900">
          {activeTab === 'overview' && (
            <OverviewView
              cameras={cameras}
              emergencies={emergencies}
              notifications={notifications}
              onNavigate={(tab) => setActiveTab(tab)}
              onAcknowledgeEmergency={handleAcknowledgeEmergency}
              onSelectCamera={(cam) => {
                setSelectedCameraForDetail(cam);
                setActiveTab('cameras');
              }}
            />
          )}

          {activeTab === 'cameras' && (
            <LiveCamerasView
              cameras={cameras}
              onAddCameraModal={() => setActiveTab('manage_cameras')}
              onUpdateCamera={handleUpdateCamera}
              onCaptureSnapshot={handleCaptureSnapshot}
            />
          )}

          {activeTab === 'detection' && (
            <AiDetectionView
              cameras={cameras}
              onSelectCamera={(cam) => {
                setSelectedCameraForDetail(cam);
                setActiveTab('cameras');
              }}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencyCenterView
              cameras={cameras}
              emergencies={emergencies}
              onUpdateEmergency={handleUpdateEmergency}
              onSelectCamera={(cam) => {
                setSelectedCameraForDetail(cam);
                setActiveTab('cameras');
              }}
            />
          )}

          {activeTab === 'voice' && (
            <VoiceAssistantView
              cameras={cameras}
              onRuleCreated={handleAddRule}
              onNavigateToRules={() => setActiveTab('automation')}
            />
          )}

          {activeTab === 'automation' && (
            <AutomationRulesView
              rules={rules}
              cameras={cameras}
              onAddRule={handleAddRule}
              onUpdateRule={handleUpdateRule}
              onDeleteRule={handleDeleteRule}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onAcknowledge={handleAcknowledgeNotification}
              onResolve={handleResolveNotification}
              onMarkAllRead={handleMarkAllRead}
            />
          )}

          {activeTab === 'history' && (
            <NotificationsView
              notifications={notifications}
              onAcknowledge={handleAcknowledgeNotification}
              onResolve={handleResolveNotification}
              onMarkAllRead={handleMarkAllRead}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              cameras={cameras}
              notifications={notifications}
            />
          )}

          {activeTab === 'manage_cameras' && (
            <CameraManagementView
              cameras={cameras}
              onAddCamera={handleAddCamera}
              onUpdateCamera={handleUpdateCamera}
              onDeleteCamera={handleDeleteCamera}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentRole={currentRole}
              onChangeRole={(role) => setCurrentRole(role)}
              auditLogs={auditLogs}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
