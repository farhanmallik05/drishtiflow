export type CameraStatus = 'online' | 'offline' | 'calibrating' | 'alert';

export type DetectionType = 
  | 'person' 
  | 'vehicle' 
  | 'animal' 
  | 'fall_risk' 
  | 'fire_smoke' 
  | 'unauthorized_entry' 
  | 'person_down' 
  | 'unknown';

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
}

export interface Detection {
  id: string;
  cameraId: string;
  cameraName: string;
  type: DetectionType;
  confidence: number;
  box: BoundingBox;
  timestamp: string;
  label: string;
  severity: AlertSeverity;
  details?: string;
}

export interface PrivacyMask {
  id: string;
  x: number; // percentage
  y: number; // percentage
  w: number;
  h: number;
  label?: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  zone: 'Perimeter' | 'Interior' | 'Rooftop' | 'Restricted' | 'Parking';
  status: CameraStatus;
  streamUrl: string;
  streamType: 'RTSP' | 'HLS' | 'SIMULATED';
  fps: number;
  resolution: string;
  latencyMs: number;
  isSimulation: boolean;
  videoSrc?: string;
  activeDetections: Detection[];
  privacyMasks: PrivacyMask[];
  detectionCapabilities: DetectionType[];
  enabled: boolean;
  nightVision: boolean;
  thermalVision: boolean;
  audioActive: boolean;
  ipAddress: string;
}

export type EmergencyStatus = 
  | 'generated' 
  | 'sent' 
  | 'notified' 
  | 'acknowledged' 
  | 'resolved';

export interface EmergencyTimelineStep {
  step: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending';
  actor?: string;
}

export interface EmergencyEvent {
  id: string;
  type: 'fall_risk' | 'fire_smoke' | 'unauthorized_entry' | 'person_down';
  cameraId: string;
  cameraName: string;
  location: string;
  timestamp: string;
  confidence: number;
  status: EmergencyStatus;
  severity: 'critical' | 'high';
  headline: string;
  cautiousDescription: string;
  timeline: EmergencyTimelineStep[];
  droneDispatched: boolean;
  alarmActive: boolean;
  snapshotUrl?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  cameraIds: string[];
  detectionType: DetectionType | 'any';
  zone: string;
  timeCondition: {
    type: '24_7' | 'after_hours' | 'custom';
    startTime?: string;
    endTime?: string;
  };
  days: string[];
  triggerCondition: 'immediate' | 'loitering_5min' | 'count_exceeded';
  alertSeverity: AlertSeverity;
  notificationChannels: ('in_app' | 'email' | 'push' | 'sms_whatsapp')[];
  action: 'notify_security' | 'sound_alarm' | 'lockdown' | 'dispatch_drone' | 'webhook';
  triggerCount: number;
  lastTriggered?: string;
  createdAt: string;
}

export type DeliveryStatus = 
  | 'Alert Generated' 
  | 'Alert Sent' 
  | 'Delivered' 
  | 'Acknowledged' 
  | 'Resolved' 
  | 'Failed';

export interface NotificationItem {
  id: string;
  eventId: string;
  cameraId: string;
  cameraName: string;
  category: DetectionType;
  location: string;
  timestamp: string;
  relativeTime: string;
  severity: AlertSeverity;
  headline: string;
  details: string;
  deliveryStatus: DeliveryStatus;
  channels: ('in_app' | 'email' | 'push' | 'sms_whatsapp')[];
  read: boolean;
}

export type UserRole = 'Security Chief' | 'Surveillance Operator' | 'Threat Analyst' | 'System Auditor';

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  target: string;
  status: 'SUCCESS' | 'WARNING' | 'ALERT';
}

