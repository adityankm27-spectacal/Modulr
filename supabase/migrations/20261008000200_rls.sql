-- Entitlement functions and Row Level Security (spec §2 roles, §6 security, §8 entitlement).
--
-- Principles:
--   * Every table has RLS enabled. The service role (server route handlers, webhooks)
--     bypasses RLS; browsers/apps use anon or authenticated keys and are bound by it.
--   * Paid content rows (notes, formula cards, answers, video metadata) are only
--     returned when has_access() is true, so unentitled clients never receive them.
--   * Catalog titles (subjects, modules, topics) are public once published.
--   * Billing, devices and webhook rows are written only by the server.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.setting(p_key text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select value from public.app_settings where key = p_key
$$;

create function public.is_admin(p_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = p_user and role = 'admin'
  )
$$;

-- True when the caller may ask about p_user: themselves, an admin, or the server
-- (service role / direct DB connection without an end-user JWT).
create function public.can_inspect_user(p_user uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_user = auth.uid()
    or public.is_admin(auth.uid())
    or coalesce(auth.jwt() ->> 'role', 'service_role') = 'service_role'
$$;

create function public.subject_visible(p_subject uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.subjects where id = p_subject and is_published)
$$;

create function public.module_visible(p_module uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.modules m
    join public.subjects s on s.id = m.subject_id
    where m.id = p_module and m.is_published and s.is_published
  )
$$;

-- ---------------------------------------------------------------------------
-- Entitlement: single source of truth on the database side.
-- TypeScript twin: packages/shared/src/entitlement.ts (keep in sync).
-- ---------------------------------------------------------------------------

-- Paid access to every module of a subject: admin, comp access, trial,
-- a subscription in good standing, or a purchase covering the subject.
create function public.has_subject_access(p_user uuid, p_subject uuid) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_subject public.subjects;
  v_grace_days integer := coalesce((public.setting('billing.grace_days') #>> '{}')::integer, 3);
  v_trial_days integer := coalesce((public.setting('free_preview.trial_days') #>> '{}')::integer, 0);
begin
  if p_user is null or not public.can_inspect_user(p_user) then
    return false;
  end if;

  select * into v_profile from public.profiles where id = p_user;
  if not found then
    return false;
  end if;

  if v_profile.role = 'admin' then
    return true;
  end if;

  if v_profile.comp_access_until is not null and v_profile.comp_access_until > now() then
    return true;
  end if;

  if v_trial_days > 0 and now() < v_profile.created_at + make_interval(days => v_trial_days) then
    return true;
  end if;

  if exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user
      and (
        s.status = 'active'
        or (
          s.status in ('cancelled', 'pending')
          and now() < coalesce(
            s.grace_until,
            s.current_period_end + make_interval(days => v_grace_days)
          )
        )
      )
  ) then
    return true;
  end if;

  select * into v_subject from public.subjects where id = p_subject;
  if not found then
    return false;
  end if;

  return exists (
    select 1 from public.purchases p
    where p.user_id = p_user
      and p.valid_until > now()
      and (
        p.scope = 'all'
        or (p.scope = 'subject' and p.subject_id = v_subject.id)
        or (
          p.scope = 'semester'
          and p.syllabus_version_id = v_subject.syllabus_version_id
          and p.semester = v_subject.semester
        )
      )
  );
end;
$$;

-- Access to a module's content. Visitors never; signed-in users on free-preview
-- modules; otherwise paid subject access. Publish state is checked separately
-- (module_visible) so admins can preview drafts.
create function public.has_access(p_user uuid, p_module uuid) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_module public.modules;
begin
  if p_user is null or not public.can_inspect_user(p_user) then
    return false;
  end if;

  select * into v_module from public.modules where id = p_module;
  if not found then
    return false;
  end if;

  if v_module.is_free_preview then
    return exists (select 1 from public.profiles where id = p_user);
  end if;

  return public.has_subject_access(p_user, v_module.subject_id);
end;
$$;

-- Per-module counts of published content for a subject page (lock icons + counts),
-- available to everyone without exposing the content itself.
create function public.module_content_counts(p_subject uuid)
returns table (
  module_id uuid,
  videos bigint,
  has_short_notes boolean,
  has_formula_sheet boolean,
  formula_cards bigint,
  pyqs bigint,
  important_questions bigint,
  viva_questions bigint
)
language sql stable security definer set search_path = ''
as $$
  select
    m.id,
    (select count(*) from public.videos v where v.module_id = m.id and v.is_published),
    exists (select 1 from public.documents d
            where d.module_id = m.id and d.kind = 'short_notes' and d.is_published),
    exists (select 1 from public.documents d
            where d.module_id = m.id and d.kind = 'formula_sheet' and d.is_published),
    (select count(*) from public.formula_cards f where f.module_id = m.id and f.is_published),
    (select count(*) from public.questions q
     where q.module_id = m.id and q.kind = 'pyq' and q.is_published),
    (select count(*) from public.questions q
     where q.module_id = m.id and q.kind = 'important' and q.is_published),
    (select count(*) from public.questions q
     where q.module_id = m.id and q.kind = 'viva' and q.is_published)
  from public.modules m
  join public.subjects s on s.id = m.subject_id
  where m.subject_id = p_subject
    and ((m.is_published and s.is_published) or public.is_admin(auth.uid()))
  order by m.sort_order, m.number
$$;

-- ---------------------------------------------------------------------------
-- Grants. Supabase grants everything to anon/authenticated by default; start
-- from nothing and grant only what each role needs. RLS still filters rows.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;

-- Public read (visitors): catalog, published content metadata, plans, settings.
grant select on
  public.app_settings, public.colleges, public.branches, public.syllabus_versions,
  public.subjects, public.modules, public.topics, public.plans,
  public.videos, public.documents, public.formula_cards, public.questions, public.experiments
to anon;

-- Signed-in users: read everything RLS allows; write only their own personal data.
grant select on all tables in schema public to authenticated;
grant insert, update, delete on
  public.watch_progress, public.module_completion, public.bookmarks,
  public.topic_progress, public.attendance_subjects, public.attendance_entries
to authenticated;

-- Profiles: users may edit onboarding fields only, never role or comp access.
grant update (
  full_name, college_id, branch_id, semester, age_confirmed_at, consent_accepted_at, onboarded_at
) on public.profiles to authenticated;

-- Reports: users file them; status/resolution is admin-only (via the admin policy below).
grant insert (user_id, item_type, item_id, reason, message) on public.content_reports to authenticated;

-- Admin-editable tables (admins are `authenticated` with role = 'admin' in profiles).
grant insert, update, delete on
  public.app_settings, public.colleges, public.branches, public.syllabus_versions,
  public.subjects, public.modules, public.videos, public.documents, public.formula_cards,
  public.questions, public.experiments, public.topics, public.plans
to authenticated;
grant update (role, comp_access_until) on public.profiles to authenticated;
grant update (status, resolved_by, resolved_at) on public.content_reports to authenticated;
grant insert on public.admin_audit_log to authenticated;

revoke execute on all functions in schema public from public;
grant execute on function
  public.setting(text), public.is_admin(uuid), public.can_inspect_user(uuid),
  public.subject_visible(uuid), public.module_visible(uuid),
  public.has_subject_access(uuid, uuid), public.has_access(uuid, uuid),
  public.module_content_counts(uuid)
to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- Admin full access on admin-managed tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'app_settings', 'colleges', 'branches', 'syllabus_versions', 'subjects', 'modules',
    'videos', 'documents', 'formula_cards', 'questions', 'experiments', 'topics', 'plans'
  ] loop
    execute format(
      'create policy admin_all on public.%I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;

  -- Admin read on user/billing/ops tables (writes go through the server).
  foreach t in array array[
    'subscriptions', 'purchases', 'payments', 'webhook_events', 'devices',
    'watch_progress', 'module_completion', 'admin_audit_log'
  ] loop
    execute format(
      'create policy admin_read on public.%I for select to authenticated
         using ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- Settings and catalog structure: public read.
create policy public_read on public.app_settings for select to anon, authenticated using (true);
create policy public_read on public.colleges for select to anon, authenticated using (true);
create policy public_read on public.branches for select to anon, authenticated using (true);
create policy public_read on public.syllabus_versions for select to anon, authenticated using (true);

-- Subjects/modules/topics: titles are public once published.
create policy public_read on public.subjects for select to anon, authenticated
  using (is_published);
create policy public_read on public.modules for select to anon, authenticated
  using (public.module_visible(id));
create policy public_read on public.topics for select to anon, authenticated
  using (public.module_visible(module_id));

-- Paid module content: published, visible, and entitled.
create policy entitled_read on public.videos for select to anon, authenticated
  using (is_published and public.module_visible(module_id)
         and public.has_access((select auth.uid()), module_id));
create policy entitled_read on public.documents for select to anon, authenticated
  using (is_published and public.module_visible(module_id)
         and public.has_access((select auth.uid()), module_id));
create policy entitled_read on public.formula_cards for select to anon, authenticated
  using (is_published and public.module_visible(module_id)
         and public.has_access((select auth.uid()), module_id));
create policy entitled_read on public.questions for select to anon, authenticated
  using (
    is_published and (
      case when module_id is null
        then public.subject_visible(subject_id)
             and public.has_subject_access((select auth.uid()), subject_id)
        else public.module_visible(module_id)
             and public.has_access((select auth.uid()), module_id)
      end
    )
  );
create policy entitled_read on public.experiments for select to anon, authenticated
  using (is_published and public.subject_visible(subject_id)
         and public.has_subject_access((select auth.uid()), subject_id));

-- Plans: active plans are public (pricing page).
create policy public_read on public.plans for select to anon, authenticated using (is_active);

-- Profiles.
create policy own_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy own_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));
-- Column grants above already stop users editing role/comp access; this trigger
-- makes the rule hold even if grants are widened by mistake.
create function public.profiles_guard_privileged() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.comp_access_until is distinct from old.comp_access_until)
     and coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'only admins can change role or comp access' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger profiles_guard_privileged before update on public.profiles
  for each row execute function public.profiles_guard_privileged();

-- Billing and devices: owners read their own rows.
create policy own_read on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_read on public.purchases for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_read on public.payments for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_read on public.devices for select to authenticated
  using (user_id = (select auth.uid()));

-- Personal study data: owners have full control.
create policy own_all on public.watch_progress for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    -- Only for videos the user can see (the subquery is itself filtered by RLS).
    and exists (select 1 from public.videos v where v.id = video_id)
  );
create policy own_all on public.module_completion for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.module_visible(module_id));
create policy own_all on public.bookmarks for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy own_all on public.topic_progress for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy own_all on public.attendance_subjects for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy own_all on public.attendance_entries for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Content reports.
create policy own_insert on public.content_reports for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy own_read on public.content_reports for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy admin_update on public.content_reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Audit log: admins append their own entries.
create policy admin_insert on public.admin_audit_log for insert to authenticated
  with check ((select public.is_admin()) and admin_id = (select auth.uid()));

-- webhook_events: no user policies (server only; admin_read above).
