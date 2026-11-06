import { Camera, EmergencyEvent, AutomationRule, NotificationItem, AuditLog } from '../types';

export const INITIAL_CAMERAS: Camera[] = [
  {
    id: 'CAM-01',
    name: 'Main Gate Entrance',
    location: 'Building A - North Lobby',
    zone: 'Perimeter',
    status: 'online',
    streamUrl: 'rtsp://edge.drishtiflow.ai/stream/cam01',
    streamType: 'SIMULATED',
    fps: 30,
    resolution: '3840x2160 (4K)',
    latencyMs: 14,
    isSimulation: false,
    videoSrc: '/videos/cam_entrance.mp4',
    enabled: true,
    nightVision: false,
    thermalVision: false,
    audioActive: true,
    ipAddress: '192.168.10.101',
    detectionCapabilities: ['person', 'vehicle', 'unauthorized_entry'],
    privacyMasks: [
      { id: 'm1', x: 2, y: 78, w: 18, h: 20, label: 'Guard Desk Keypad' }
    ],
    activeDetections: [
      {
        id: 'det-01',
        cameraId: 'CAM-01',
        cameraName: 'Main Gate Entrance',
        type: 'person',
        confidence: 0.96,
        box: { x: 38, y: 35, w: 18, h: 48 },
        timestamp: 'Just now',
        label: 'Person Detected (Employee ID verified)',
        severity: 'info',
        details: 'Staff member entered through Turnstile #2'
      },
      {
        id: 'det-02',
        cameraId: 'CAM-01',
        cameraName: 'Main Gate Entrance',
        type: 'person',
        confidence: 0.92,
        box: { x: 62, y: 40, w: 14, h: 42 },
        timestamp: 'Just now',
        label: 'Person Detected (Visitor)',
        severity: 'info'
      }
    ]
  },
  {
    id: 'CAM-02',
    name: 'Underground Parking B2',
    location: 'Sub-Level -2, Bay 4',
    zone: 'Parking',
    status: 'online',
    streamUrl: 'rtsp://edge.drishtiflow.ai/stream/cam02',
    streamType: 'SIMULATED',
    fps: 30,
    resolution: '1920x1080 (FHD)',
    latencyMs: 18,
    isSimulation: false,
    videoSrc: '/videos/cam_parking.mp4',
    enabled: true,
    nightVision: true,
    thermalVision: false,
    audioActive: false,
    ipAddress: '192.168.10.102',
    detectionCapabilities: ['vehicle', 'person', 'fire_smoke'],
    privacyMasks: [],
    activeDetections: [
      {
        id: 'det-03',
        cameraId: 'CAM-02',
        cameraName: 'Underground Parking B2',
        type: 'vehicle',
        confidence: 0.94,
        box: { x: 25, y: 42, w: 32, h: 36 },
        timestamp: '1m ago',
        label: 'Vehicle: Sedan (DL-08-AB-4921)',
        severity: 'info',
        details: 'Vehicle parked in Bay 14'
      }
    ]
  },
  {
    id: 'CAM-03',
    name: 'Executive Corridor 3F',
    location: 'Floor 3, West Wing Wing-B',
    zone: 'Interior',
    status: 'online',
    streamUrl: 'rtsp://edge.drishtiflow.ai/stream/cam03',
    streamType: 'SIMULATED',
    fps: 30,
    resolution: '1920x1080 (FHD)',
    latencyMs: 12,
    isSimulation: false,
    videoSrc: '/videos/cam_corridor.mp4',
    enabled: true,
    nightVision: false,
    thermalVision: false,
    audioActive: true,
    ipAddress: '192.168.10.103',
    detectionCapabilities: ['person', 'person_down', 'fire_smoke', 'loitering' as unknown as any],
    privacyMasks: [
      { id: 'm2', x: 82, y: 25, w: 15, h: 30, label: 'Confidential Whiteboard' }
    ],
    activeDetections: [
      {
        id: 'det-04',
        cameraId: 'CAM-03',
        cameraName: 'Executive Corridor 3F',
        type: 'person',
        confidence: 0.91,
        box: { x: 45, y: 30, w: 16, h: 50 },
        timestamp: 'Just now',
        label: 'Person Detected',
        severity: 'info'
      }
    ]
  },
  {
    id: 'CAM-04',
    name: 'Rooftop North Perimeter',
    location: 'Tower Alpha - Observation Deck',
    zone: 'Rooftop',
    status: 'alert',
    streamUrl: 'rtsp://edge.drishtiflow.ai/stream/cam04',
    streamType: 'SIMULATED',
    fps: 30,
    resolution: '3840x2160 (4K)',
    latencyMs: 15,
    isSimulation: false,
    videoSrc: '/videos/cam_worker_zone.mp4',
    enabled: true,
    nightVision: false,
    thermalVision: false,
    audioActive: true,
    ipAddress: '192.168.10.104',
    detectionCapabilities: ['person', 'fall_risk', 'unauthorized_entry'],
    privacyMasks: [],
    activeDetections: [
      {
        id: 'det-05',
        cameraId: 'CAM-04',
        cameraName: 'Rooftop North Perimeter',
        type: 'fall_risk',
        confidence: 0.91,
        box: { x: 68, y: 22, w: 22, h: 62 },
        timestamp: '30s ago',
        label: 'POTENTIAL FALL RISK (High Risk Boundary)',
        severity: 'critical',
        details: 'Individual identified near unbarricaded ledge; erratic acceleration pattern detected.'
      }
    ]
  },
  {
    id: 'CAM-05',
    name: 'Server Vault Restricted',
    location: 'Basement Core - Zone 0',
    zone: 'Restricted',
    status: 'online',
    streamUrl: 'rtsp://edge.drishtiflow.ai/stream/cam05',
    streamType: 'SIMULATED',
    fps: 60,
    resolution: '1920x1080 (60FPS)',
    latencyMs: 9,
    isSimulation: false,
    videoSrc: '/videos/cam_restricted.mp4',
    enabled: true,
    nightVision: true,
    thermalVision: false,
    audioActive: false,
    ipAddress: '192.168.10.105',
    detectionCapabilities: ['person', 'unauthorized_entry', 'fire_smoke'],
    privacyMasks: [
      { id: 'm3', x: 10, y: 35, w: 14, h: 22, label: 'Vault Dial Keypad' }
    ],
    activeDetections: []
  },
  {
    id: 'CAM-06',
    name: 'Loading Dock South',
    location: 'Logistics Bay 2',
    zone: 'Perimeter',
    status: 'online',
    streamUrl: 'rtsp://edge.drishtiflow.ai/stream/cam06',
    streamType: 'SIMULATED',
    fps: 30,
    resolution: '1920x1080',
    latencyMs: 22,
    isSimulation: false,
    videoSrc: '/videos/cam_loading_dock.mp4',
    enabled: true,
    nightVision: false,
    thermalVision: false,
    audioActive: false,
    ipAddress: '192.168.10.106',
    detectionCapabilities: ['vehicle', 'person', 'unknown'],
    privacyMasks: [],
    activeDetections: [
      {
        id: 'det-06',
        cameraId: 'CAM-06',
        cameraName: 'Loading Dock South',
        type: 'vehicle',
        confidence: 0.89,
        box: { x: 15, y: 38, w: 35, h: 42 },
        timestamp: '4m ago',
        label: 'Cargo Van: Unloaded',
        severity: 'info'
      }
    ]
  }
];

export const INITIAL_EMERGENCIES: EmergencyEvent[] = [
  {
    id: 'EMG-2026-001',
    type: 'fall_risk',
    cameraId: 'CAM-04',
    cameraName: 'Rooftop North Perimeter',
    location: 'Tower Alpha - Observation Deck Ledge',
    timestamp: '22:58:12 UTC',
    confidence: 0.91,
    status: 'notified',
    severity: 'critical',
    headline: 'POTENTIAL FALL RISK – Unsafe Proximity to Roof Perimeter',
    cautiousDescription: 'Movement pattern indicates person approaching restricted safety barrier with irregular pacing. Caution: AI classification reflects visual trajectory anomaly and does not assert human intent.',
    timeline: [
      { step: 'Alert Generated by Neural Pose Engine (v4.2)', timestamp: '22:58:12', status: 'completed' },
      { step: 'Alert Dispatched across In-App & Push Channels', timestamp: '22:58:14', status: 'completed' },
      { step: 'Security Duty Officer Notified via Priority Channel', timestamp: '22:58:16', status: 'completed' },
      { step: 'Officer On-Site Verification & Intervention', timestamp: 'Pending', status: 'in_progress', actor: 'Team Lead Vikram' },
      { step: 'Incident Resolution & Safety Confirmation', timestamp: 'Pending', status: 'pending' }
    ],
    droneDispatched: true,
    alarmActive: true
  },
  {
    id: 'EMG-2026-002',
    type: 'fire_smoke',
    cameraId: 'CAM-02',
    cameraName: 'Underground Parking B2',
    location: 'Sub-Level -2, Bay 4 (Near Electrical Room)',
    timestamp: '21:14:05 UTC',
    confidence: 0.88,
    status: 'resolved',
    severity: 'critical',
    headline: 'Thermal Spike & Smoke Signature Detected',
    cautiousDescription: 'Visual smoke convection and heat radiance threshold exceeded 185°C. Immediate automated suppression warning issued.',
    timeline: [
      { step: 'Thermal gradient alert triggered', timestamp: '21:14:05', status: 'completed' },
      { step: 'Fire suppression system alerted', timestamp: '21:14:08', status: 'completed' },
      { step: 'Facilities response unit dispatched', timestamp: '21:14:22', status: 'completed' },
      { step: 'False ignition / exhaust plume verified', timestamp: '21:19:30', status: 'completed', actor: 'Officer S. Mehta' },
      { step: 'Zone cleared & re-armed', timestamp: '21:21:00', status: 'completed' }
    ],
    droneDispatched: false,
    alarmActive: false,
    resolvedAt: '21:21:00 UTC',
    acknowledgedBy: 'Chief R. Sharma'
  },
  {
    id: 'EMG-2026-003',
    type: 'unauthorized_entry',
    cameraId: 'CAM-05',
    cameraName: 'Server Vault Restricted',
    location: 'Basement Core - Zone 0',
    timestamp: '20:45:18 UTC',
    confidence: 0.95,
    status: 'resolved',
    severity: 'high',
    headline: 'Perimeter Tripwire Breach – Restricted Server Vault',
    cautiousDescription: 'Unauthenticated presence detected inside Biometric Airlock outside scheduled maintenance window.',
    timeline: [
      { step: 'Infrared beam interrupt detected', timestamp: '20:45:18', status: 'completed' },
      { step: 'Access badge challenge: No badge presented', timestamp: '20:45:21', status: 'completed' },
      { step: 'Vault magnetic seals engaged', timestamp: '20:45:24', status: 'completed' },
      { step: 'Security team verified authorized sysadmin with misplaced badge', timestamp: '20:48:10', status: 'completed' },
      { step: 'Log updated & normal access restored', timestamp: '20:50:00', status: 'completed' }
    ],
    droneDispatched: false,
    alarmActive: false,
    resolvedAt: '20:50:00 UTC',
    acknowledgedBy: 'Chief R. Sharma'
  },
  {
    id: 'EMG-2026-004',
    type: 'person_down',
    cameraId: 'CAM-03',
    cameraName: 'Executive Corridor 3F',
    location: 'Floor 3, West Wing Wing-B',
    timestamp: '18:30:22 UTC',
    confidence: 0.93,
    status: 'resolved',
    severity: 'critical',
    headline: 'Medical Alert – Motionless Individual Detected',
    cautiousDescription: 'Subject posture shifted from upright to horizontal on floor with zero ambulation for > 60 seconds. Potential medical distress flag.',
    timeline: [
      { step: 'Anomaly detected by Pose Keypoint Analysis', timestamp: '18:30:22', status: 'completed' },
      { step: 'Medical First Responder paging triggered', timestamp: '18:30:25', status: 'completed' },
      { step: 'Floor emergency ward arrived on scene', timestamp: '18:32:00', status: 'completed' },
      { step: 'Patient attended (mild syncope / dehydration)', timestamp: '18:37:00', status: 'completed' },
      { step: 'Paramedic handover complete', timestamp: '18:45:00', status: 'completed' }
    ],
    droneDispatched: false,
    alarmActive: false,
    resolvedAt: '18:45:00 UTC',
    acknowledgedBy: 'Medic Dr. Patel'
  }
];

export const INITIAL_RULES: AutomationRule[] = [
  {
    id: 'RULE-101',
    name: 'After-Hours Building Vault Breach',
    enabled: true,
    cameraIds: ['CAM-05'],
    detectionType: 'person',
    zone: 'Restricted Vault',
    timeCondition: {
      type: 'after_hours',
      startTime: '22:00',
      endTime: '06:00'
    },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    triggerCondition: 'immediate',
    alertSeverity: 'critical',
    notificationChannels: ['in_app', 'sms_whatsapp', 'push'],
    action: 'lockdown',
    triggerCount: 4,
    lastTriggered: 'Yesterday at 23:14',
    createdAt: '2026-10-15'
  },
  {
    id: 'RULE-102',
    name: 'Rooftop Perimeter Fall Prevention',
    enabled: true,
    cameraIds: ['CAM-04'],
    detectionType: 'fall_risk',
    zone: 'Observation Deck Ledge',
    timeCondition: { type: '24_7' },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    triggerCondition: 'immediate',
    alertSeverity: 'critical',
    notificationChannels: ['in_app', 'push', 'sms_whatsapp'],
    action: 'sound_alarm',
    triggerCount: 1,
    lastTriggered: 'Today at 22:58',
    createdAt: '2026-10-20'
  },
  {
    id: 'RULE-103',
    name: 'Midnight Parking Vehicle Patrol',
    enabled: true,
    cameraIds: ['CAM-02'],
    detectionType: 'vehicle',
    zone: 'Underground B2',
    timeCondition: {
      type: 'custom',
      startTime: '00:00',
      endTime: '05:00'
    },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    triggerCondition: 'immediate',
    alertSeverity: 'medium',
    notificationChannels: ['in_app', 'push'],
    action: 'notify_security',
    triggerCount: 18,
    lastTriggered: 'Today at 02:14',
    createdAt: '2026-10-22'
  },
  {
    id: 'RULE-104',
    name: 'Thermal Spike & Smoke Early Warning',
    enabled: true,
    cameraIds: ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-05'],
    detectionType: 'fire_smoke',
    zone: 'All Monitored Sectors',
    timeCondition: { type: '24_7' },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    triggerCondition: 'immediate',
    alertSeverity: 'critical',
    notificationChannels: ['in_app', 'sms_whatsapp', 'push', 'email'],
    action: 'dispatch_drone',
    triggerCount: 2,
    lastTriggered: 'Today at 21:14',
    createdAt: '2026-10-25'
  },
  {
    id: 'RULE-105',
    name: 'Main Gate Loitering Alert (> 5 min)',
    enabled: true,
    cameraIds: ['CAM-01'],
    detectionType: 'person',
    zone: 'Main Gate Exterior',
    timeCondition: { type: '24_7' },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    triggerCondition: 'loitering_5min',
    alertSeverity: 'low',
    notificationChannels: ['in_app'],
    action: 'notify_security',
    triggerCount: 37,
    lastTriggered: 'Today at 17:42',
    createdAt: '2026-10-28'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-901',
    eventId: 'EVT-9042',
    cameraId: 'CAM-04',
    cameraName: 'Rooftop North Perimeter',
    category: 'fall_risk',
    location: 'Tower Alpha Ledge',
    timestamp: '22:58:12 UTC',
    relativeTime: '2 mins ago',
    severity: 'critical',
    headline: 'CRITICAL: Potential Fall Risk Detected',
    details: 'Individual identified near safety barrier. Erratic movement pattern flagged with 91% confidence.',
    deliveryStatus: 'Acknowledged',
    channels: ['in_app', 'push', 'sms_whatsapp'],
    read: false
  },
  {
    id: 'NOTIF-902',
    eventId: 'EVT-8920',
    cameraId: 'CAM-02',
    cameraName: 'Underground Parking B2',
    category: 'fire_smoke',
    location: 'Sub-Level -2, Bay 4',
    timestamp: '21:14:05 UTC',
    relativeTime: '1 hr ago',
    severity: 'critical',
    headline: 'FIRE ALERT: Smoke & Heat Gradient Exceeded',
    details: 'Thermal camera registered sudden +45°C shift. Facilities response unit dispatched.',
    deliveryStatus: 'Resolved',
    channels: ['in_app', 'email', 'push', 'sms_whatsapp'],
    read: true
  },
  {
    id: 'NOTIF-903',
    eventId: 'EVT-8814',
    cameraId: 'CAM-05',
    cameraName: 'Server Vault Restricted',
    category: 'unauthorized_entry',
    location: 'Basement Core - Zone 0',
    timestamp: '20:45:18 UTC',
    relativeTime: '2 hrs ago',
    severity: 'high',
    headline: 'SECURITY: Vault Tripwire Breached After Hours',
    details: 'Airlock infrared sensor interrupted. Badge verification failed.',
    deliveryStatus: 'Resolved',
    channels: ['in_app', 'push', 'sms_whatsapp'],
    read: true
  },
  {
    id: 'NOTIF-904',
    eventId: 'EVT-8761',
    cameraId: 'CAM-03',
    cameraName: 'Executive Corridor 3F',
    category: 'person_down',
    location: 'Floor 3, West Wing',
    timestamp: '18:30:22 UTC',
    relativeTime: '4 hrs ago',
    severity: 'critical',
    headline: 'MEDICAL: Motionless Person Detected on Floor',
    details: 'Keypoint pose analysis detected horizontal motionless state exceeding 60s.',
    deliveryStatus: 'Resolved',
    channels: ['in_app', 'push'],
    read: true
  },
  {
    id: 'NOTIF-905',
    eventId: 'EVT-8622',
    cameraId: 'CAM-01',
    cameraName: 'Main Gate Entrance',
    category: 'vehicle',
    location: 'Building A North Gate',
    timestamp: '16:12:00 UTC',
    relativeTime: '6 hrs ago',
    severity: 'info',
    headline: 'LOG: VIP Transport Arrival Logged',
    details: 'Authorized vehicle (DL-01-EQ-9901) granted automatic gate opening.',
    deliveryStatus: 'Delivered',
    channels: ['in_app'],
    read: true
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-301',
    timestamp: '22:58:30 UTC',
    user: 'Security Chief (Rajesh K.)',
    role: 'Security Chief',
    action: 'ACKNOWLEDGED_ALERT',
    target: 'EMG-2026-001 (Rooftop Fall Risk)',
    status: 'ALERT'
  },
  {
    id: 'AUD-302',
    timestamp: '22:45:10 UTC',
    user: 'Surveillance Operator (Amina P.)',
    role: 'Surveillance Operator',
    action: 'CAMERA_PTZ_ZOOM',
    target: 'CAM-01 Main Gate Entrance',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-303',
    timestamp: '21:30:00 UTC',
    user: 'LISTY AI Assistant',
    role: 'Threat Analyst',
    action: 'AUTOMATION_RULE_ACTIVATED',
    target: 'RULE-102 Rooftop Perimeter Fall Prevention',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-304',
    timestamp: '21:19:35 UTC',
    user: 'Officer Vikram (Field Response)',
    role: 'Surveillance Operator',
    action: 'RESOLVED_INCIDENT',
    target: 'EMG-2026-002 (Parking Thermal)',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-305',
    timestamp: '20:10:00 UTC',
    user: 'Security Auditor (Elena V.)',
    role: 'System Auditor',
    action: 'EXPORT_AUDIT_REPORT',
    target: 'Daily Compliance Matrix (GDPR Retention)',
    status: 'SUCCESS'
  }
];

