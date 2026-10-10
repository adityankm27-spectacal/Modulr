-- One active device per account: the newest sign-in wins (spec §5, devices).
-- Every new Supabase Auth session becomes the account's active session; the app
-- signs out any request whose JWT session_id is not the active one.

alter table public.profiles add column active_session_id uuid;
-- Not in the profiles column grants, so users can't change it; only the trigger does.

-- Existing accounts: keep their most recent session.
update public.profiles p
set active_session_id = (
  select s.id from auth.sessions s where s.user_id = p.id order by s.created_at desc limit 1
);

create function public.claim_active_session() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set active_session_id = new.id where id = new.user_id;
  return new;
end;
$$;
revoke execute on function public.claim_active_session() from public, anon, authenticated;

create trigger on_auth_session_created
  after insert on auth.sessions
  for each row execute function public.claim_active_session();

-- Single device per account (spec §16 Q5).
update public.app_settings set value = '1' where key = 'devices.max_active';
