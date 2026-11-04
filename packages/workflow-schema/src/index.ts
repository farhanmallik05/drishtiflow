import { z } from 'zod';

// ==============================================================================
// Allowlisted Primitives & Enums
// ==============================================================================

export const DetectorClassSchema = z.enum([
  'person',
  'vehicle',
  'car',
  'truck',
  'motorcycle',
  'animal'
]);
export type DetectorClass = z.infer<typeof DetectorClassSchema>;

export const TriggerTypeSchema = z.enum([
  'object_in_zone',
  'schedule_match',
  'dwell_time_exceeded'
]);
export type TriggerType = z.infer<typeof TriggerTypeSchema>;

export const VerificationTypeSchema = z.enum([
  'temporal_scene_check',
  'semantic_vlm_verification',
  'human_confirmation'
]);
export type VerificationType = z.infer<typeof VerificationTypeSchema>;

export const ActionTypeSchema = z.enum([
  'dashboard_alert',
  'whatsapp_message',
  'voice_call',
  'local_siren'
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const VerificationDecisionSchema = z.enum([
  'confirmed',
  'not_confirmed',
  'uncertain',
  'needs_human_review',
  'processing_failed'
]);
export type VerificationDecision = z.infer<typeof VerificationDecisionSchema>;

export const IncidentStatusSchema = z.enum([
  'candidate',
  'verifying',
  'confirmed',
  'not_confirmed',
  'uncertain',
  'action_pending',
  'action_sent',
  'action_failed',
  'acknowledged',
  'resolved'
]);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const FeedbackLabelSchema = z.enum([
  'true_positive',
  'false_positive',
  'missed_event_report',
  'uncertain',
  'poor_evidence',
  'wrong_zone',
  'wrong_rule'
]);
export type FeedbackLabel = z.infer<typeof FeedbackLabelSchema>;

// ==============================================================================
// Workflow Node Schemas
// ==============================================================================

export const ScheduleConfigSchema = z.object({
  timezone: z.string().default('Asia/Kolkata'),
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).default([
    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
  ]),
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be in HH:MM format'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be in HH:MM format')
});
export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>;

export const TriggerConfigSchema = z.object({
  type: TriggerTypeSchema.default('object_in_zone'),
  classes: z.array(DetectorClassSchema).min(1).default(['person']),
  zone_id: z.string().nullable().default(null),
  schedule: ScheduleConfigSchema.optional().nullable(),
  minimum_confidence: z.number().min(0.0).max(1.0).default(0.55),
  dwell_seconds: z.number().min(0.0).default(1.5)
});
export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;

export const VerificationConfigSchema = z.object({
  type: VerificationTypeSchema.default('temporal_scene_check'),
  instruction: z.string().min(5),
  evidence_window_seconds: z.number().min(0.5).max(10.0).default(2.0),
  human_review_required: z.boolean().default(false)
});
export type VerificationConfig = z.infer<typeof VerificationConfigSchema>;

export const ActionItemSchema = z.object({
  type: ActionTypeSchema,
  enabled: z.boolean().default(true),
  recipient_ids: z.array(z.string()).default([]),
  parameters: z.record(z.any()).optional()
});
export type ActionItem = z.infer<typeof ActionItemSchema>;

export const SafetyConfigSchema = z.object({
  cooldown_seconds: z.number().int().min(5).default(60),
  max_actions_per_hour: z.number().int().min(1).max(100).default(5),
  escalation_policy_id: z.string().nullable().default(null)
});
export type SafetyConfig = z.infer<typeof SafetyConfigSchema>;

// ==============================================================================
// Workflow Definition (Compiler Output & Editor Contract)
// ==============================================================================

export const WorkflowDefinitionSchema = z.object({
  schema_version: z.string().default('1.0'),
  title: z.object({
    en: z.string(),
    hi: z.string().optional()
  }),
  source_text: z.string(),
  status: z.enum(['draft', 'needs_review', 'active', 'paused']).default('needs_review'),
  assumptions: z.array(z.string()).default([]),
  clarification_questions: z.array(z.string()).default([]),
  trigger: TriggerConfigSchema,
  verification: VerificationConfigSchema,
  actions: z.array(ActionItemSchema).min(1),
  safety: SafetyConfigSchema.default({
    cooldown_seconds: 60,
    max_actions_per_hour: 5,
    escalation_policy_id: null
  })
});
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

// ==============================================================================
// Candidate Event Contract (Edge -> Backend)
// ==============================================================================

export const CandidateEventSchema = z.object({
  event_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  site_id: z.string().uuid(),
  camera_id: z.string().uuid(),
  workflow_id: z.string().uuid().nullable().optional(),
  workflow_version: z.number().int().optional(),
  event_type: z.string().default('restricted_zone_entry'),
  occurred_at: z.string().datetime(),
  source: z.enum(['webcam', 'webrtc_gateway', 'local_agent', 'sample']),
  detector: z.object({
    name: z.string(),
    version: z.string(),
    confidence: z.number().min(0.0).max(1.0),
    bounding_box: z.object({
      x_min: z.number(),
      y_min: z.number(),
      x_max: z.number(),
      y_max: z.number()
    }).optional()
  }),
  evidence_frame_base64: z.string().optional(),
  evidence_url: z.string().optional()
});
export type CandidateEvent = z.infer<typeof CandidateEventSchema>;

// ==============================================================================
// Context Verification Contract (VLM -> Policy Engine)
// ==============================================================================

export const VerificationResultSchema = z.object({
  decision: VerificationDecisionSchema,
  event_type: z.string(),
  confidence: z.number().min(0.0).max(1.0),
  evidence_summary: z.string(),
  limitations: z.array(z.string()).default([]),
  requires_human_review: z.boolean().default(false),
  model_provider: z.string(),
  model_version: z.string()
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
