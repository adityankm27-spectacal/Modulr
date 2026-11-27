-- Security hygiene from the Supabase advisors. Nothing here changes what the app can do.

-- 1. Trigger functions are never meant to be called through the API (/rest/v1/rpc/...).
--    Postgres only checks EXECUTE when a trigger is created, not when it fires, so the
--    triggers keep working. mirror_target_module is an internal helper of the mirror_*
--    triggers, which run as their owner.
revoke execute on function
  public.handle_new_user(),
  public.claim_active_session(),
  public.profiles_guard_privileged(),
  public.mirror_document(),
  public.mirror_formula_card(),
  public.mirror_module(),
  public.mirror_question(),
  public.mirror_topic(),
  public.mirror_video(),
  public.mirror_target_module(uuid)
from public, anon, authenticated;

-- 2. subject_mirrors is only written by migrations and read by admins. RLS already
--    blocks writes; remove the grants as well so nothing relies on that alone.
revoke all on table public.subject_mirrors from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.subject_mirrors from authenticated;

-- 3. Pin search_path on the remaining trigger functions. Their bodies already use
--    schema-qualified names (public.*), and built-ins resolve from pg_catalog.
alter function public.set_updated_at() set search_path = '';
alter function public.bump_version() set search_path = '';
alter function public.questions_check_module_subject() set search_path = '';
alter function public.attendance_entries_check_owner() set search_path = '';
alter function public.modules_default_free_preview() set search_path = '';
alter function public.profiles_check_branch_college() set search_path = '';
