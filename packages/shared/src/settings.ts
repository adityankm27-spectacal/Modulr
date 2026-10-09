/**
 * Runtime settings for the open decisions in spec §16. Stored in the
 * `app_settings` table (key → jsonb value) so they can be changed without a
 * deploy; these defaults must match the seed in
 * supabase/migrations/20261008000300_settings_seed.sql.
 */
export interface AppSettings {
  /** §16 Q4: module numbers that are free preview by default when a module is created. */
  "free_preview.default_module_numbers": number[];
  /** §16 Q4: optional time-limited trial for new accounts, in days. 0 = no trial. */
  "free_preview.trial_days": number;
  /** §16 Q5: max active devices per account. */
  "devices.max_active": number;
  /** Max device swaps (new registrations after the limit is reached) per calendar month. */
  "devices.max_swaps_per_month": number;
  /** Days of access kept after the paid period ends for cancelled/pending subscriptions. */
  "billing.grace_days": number;
  /** §16 Q3: how Android users pay. */
  "billing.android_payments": "website_only" | "play_billing";
  /** §16 Q6: whether watermarked PDF downloads of notes are offered. */
  "pdf.downloads_enabled": boolean;
  /** §16 Q7: who reviews content accuracy before publishing. */
  "content.reviewers": "toppers" | "faculty" | "both";
  /** §16 Q8: placeholders until the owner decides. */
  "site.domain": string | null;
  "site.support_email": string | null;
}

export type AppSettingKey = keyof AppSettings;

export const DEFAULT_SETTINGS: AppSettings = {
  "free_preview.default_module_numbers": [1],
  "free_preview.trial_days": 0,
  "devices.max_active": 2,
  "devices.max_swaps_per_month": 2,
  "billing.grace_days": 3,
  "billing.android_payments": "website_only",
  "pdf.downloads_enabled": false,
  "content.reviewers": "both",
  "site.domain": null,
  "site.support_email": null,
};

/** Merge rows from `app_settings` over the defaults, ignoring unknown keys. */
export function resolveSettings(rows: ReadonlyArray<{ key: string; value: unknown }>): AppSettings {
  const settings: AppSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in settings) {
      (settings as unknown as Record<string, unknown>)[row.key] = row.value;
    }
  }
  return settings;
}
