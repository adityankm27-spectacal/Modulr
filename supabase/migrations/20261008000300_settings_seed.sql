-- Default values for the open decisions in spec §16. These are configuration,
-- not dummy data, so they live in a migration and reach production.
-- Keep in sync with DEFAULT_SETTINGS in packages/shared/src/settings.ts.
insert into public.app_settings (key, value, description) values
  ('free_preview.default_module_numbers', '[1]',
   '§16 Q4: module numbers that are free preview by default when created'),
  ('free_preview.trial_days', '0',
   '§16 Q4: time-limited trial for new accounts, in days (0 = no trial)'),
  ('devices.max_active', '2',
   '§16 Q5: max active devices per account'),
  ('devices.max_swaps_per_month', '2',
   'Max new-device registrations per month once the device limit is reached'),
  ('billing.grace_days', '3',
   'Days of access after the paid period ends for cancelled/pending subscriptions'),
  ('billing.android_payments', '"website_only"',
   '§16 Q3: "website_only" or "play_billing"'),
  ('pdf.downloads_enabled', 'false',
   '§16 Q6: whether watermarked PDF downloads of notes are offered'),
  ('content.reviewers', '"both"',
   '§16 Q7: "toppers", "faculty" or "both"'),
  ('site.domain', 'null', '§16 Q8: production domain'),
  ('site.support_email', 'null', '§16 Q8: support email address')
on conflict (key) do nothing;
