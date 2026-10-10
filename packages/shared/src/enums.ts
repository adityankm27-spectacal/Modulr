/**
 * Domain enums. Each list mirrors a Postgres enum in
 * supabase/migrations/20261008000100_schema.sql; keep them in sync.
 */
export const USER_ROLES = ["student", "contributor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DOCUMENT_KINDS = [
  "short_notes",
  "formula_sheet",
  "practical",
  "pyq_sheet",
  "important_sheet",
  "viva_sheet",
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const QUESTION_KINDS = ["pyq", "important", "viva"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

export const QUESTION_FREQUENCIES = ["very_frequent", "frequent", "sometimes"] as const;
export type QuestionFrequency = (typeof QUESTION_FREQUENCIES)[number];

export const VIDEO_PROVIDERS = ["vdocipher", "bunny", "dev"] as const;
export type VideoProviderName = (typeof VIDEO_PROVIDERS)[number];

export const VIDEO_PROCESSING_STATUSES = [
  "pending",
  "uploading",
  "processing",
  "ready",
  "failed",
] as const;
export type VideoProcessingStatus = (typeof VIDEO_PROCESSING_STATUSES)[number];

export const PLAN_INTERVALS = ["month", "one_time"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export const PLAN_SCOPES = ["all", "subject", "semester"] as const;
export type PlanScope = (typeof PLAN_SCOPES)[number];

export const SUBSCRIPTION_STATUSES = [
  "created",
  "active",
  "pending",
  "halted",
  "cancelled",
  "completed",
  "expired",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "created",
  "authorized",
  "captured",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const TOPIC_STATUSES = ["todo", "doing", "done"] as const;
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

export const REPORT_STATUSES = ["open", "in_progress", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_REASONS = [
  "wrong_content",
  "typo",
  "unclear",
  "broken_media",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const DEVICE_PLATFORMS = ["web", "android", "ios"] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export const CONTENT_ITEM_TYPES = [
  "module",
  "video",
  "document",
  "formula_card",
  "question",
  "experiment",
] as const;
export type ContentItemType = (typeof CONTENT_ITEM_TYPES)[number];

export const CALLOUT_KINDS = ["trick", "tip", "mistake", "definition"] as const;
export type CalloutKind = (typeof CALLOUT_KINDS)[number];
