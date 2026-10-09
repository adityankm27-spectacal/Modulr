-- M3: video. A local "dev" provider lets upload and playback be tested without a
-- Bunny account; the app refuses to use it in production (lib/video/index.ts).
alter type public.video_provider add value if not exists 'dev';

-- Lookups by provider id (Bunny webhooks) are already covered by
-- videos_provider_video_idx (provider, provider_video_id).

-- "Continue watching" reads a user's most recent unfinished videos.
create index if not exists watch_progress_continue_idx
  on public.watch_progress (user_id, updated_at desc)
  where not completed;
