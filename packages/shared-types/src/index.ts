// ==============================================================================
// Domain Entity Interfaces matching PRD §8 SQL Foundation
// ==============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  timezone: string;
  created_at: string;
}

export interface Point {
  x: number; // 0.0 to 1.0 (normalized)
  y: number; // 0.0 to 1.0 (normalized)
}

export interface Zone {
  id: string;
  camera_id: string;
  name: string;
  polygon: Point[];
  color?: string;
  created_at: string;
}

export interface Camera {
  id: string;
  organization_id: string;
  site_id: string;
  name: string;
  source_type: 'webcam' | 'webrtc_gateway' | 'local_agent' | 'sample';
  stream_url?: string;
  status: 'pending' | 'online' | 'degraded' | 'offline';
  last_heartbeat_at?: string;
  fps?: number;
  zones?: Zone[];
  created_at: string;
}

export interface Incident {
  id: string;
  organization_id: string;
  site_id: string;
  camera_id: string;
  camera_name?: string;
  workflow_id?: string;
  workflow_version?: number;
  event_type: string;
  status:
    | 'candidate'
    | 'verifying'
    | 'confirmed'
    | 'not_confirmed'
    | 'uncertain'
    | 'action_pending'
    | 'action_sent'
    | 'action_failed'
    | 'acknowledged'
    | 'resolved';
  detector_confidence: number;
  verifier_confidence?: number;
  evidence_url?: string;
  evidence_frame_base64?: string;
  reason?: string;
  occurred_at: string;
  created_at: string;
}

export interface Action {
  id: string;
  incident_id: string;
  action_type: 'dashboard_alert' | 'whatsapp_message' | 'voice_call' | 'local_siren';
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'suppressed';
  idempotency_key: string;
  recipient_ref?: string;
  provider_reference?: string;
  attempts: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  incident_id: string;
  label:
    | 'true_positive'
    | 'false_positive'
    | 'missed_event_report'
    | 'uncertain'
    | 'poor_evidence'
    | 'wrong_zone'
    | 'wrong_rule';
  note?: string;
  created_by?: string;
  created_at: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  database: boolean;
  vision_provider: string;
  vision_ready: boolean;
  active_cameras_count: number;
  incidents_today_count: number;
}

