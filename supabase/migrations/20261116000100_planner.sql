-- Study planner: a calendar (college events set by admins, personal events set by
-- students), to-do tasks, and a per-module checklist. Subscribers-only is enforced
-- by the app; every row here is either a student's own or a college event that
-- matches their college, branch and semester.

create type public.calendar_event_kind as enum ('exam', 'holiday', 'deadline', 'event', 'reminder');

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  -- College event (admin): college_id set, no user_id. Narrowed by branch and/or
  -- semester when those are set; null means "all".
  college_id uuid references public.colleges (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete cascade,
  semester smallint check (semester between 1 and 8),
  -- Personal event (student): user_id set, no college_id.
  user_id uuid references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  kind public.calendar_event_kind not null default 'event',
  starts_on date not null,
  ends_on date,
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((college_id is not null and user_id is null) or (college_id is null and user_id is not null)),
  check (user_id is null or (branch_id is null and semester is null)),
  check (ends_on is null or ends_on >= starts_on)
);
create index calendar_events_user_idx on public.calendar_events (user_id, starts_on);
create index calendar_events_college_idx on public.calendar_events (college_id, starts_on);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  module_id uuid references public.modules (id) on delete set null,
  due_on date,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index todos_user_idx on public.todos (user_id, done_at, due_on);

-- A row means the student ticked that step for that module.
create table public.module_steps (
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  step text not null check (step in ('video', 'notes', 'formulas', 'questions')),
  done_at timestamptz not null default now(),
  primary key (user_id, module_id, step)
);

create trigger set_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.todos
  for each row execute function public.set_updated_at();

-- Grants: start from nothing (Supabase grants everything by default).
revoke all on public.calendar_events, public.todos, public.module_steps from anon, authenticated;
grant all on public.calendar_events, public.todos, public.module_steps to service_role;
grant select, insert, update, delete on
  public.calendar_events, public.todos, public.module_steps
to authenticated;

alter table public.calendar_events enable row level security;
alter table public.todos enable row level security;
alter table public.module_steps enable row level security;

-- Students manage only their own personal events.
create policy own_all on public.calendar_events for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Students read the college events that match their college, branch and semester.
create policy college_read on public.calendar_events for select to authenticated
  using (
    college_id is not null
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.college_id = calendar_events.college_id
        and (calendar_events.branch_id is null or calendar_events.branch_id = p.branch_id)
        and (calendar_events.semester is null or calendar_events.semester = p.semester)
    )
  );

-- Admins manage college events.
create policy admin_all on public.calendar_events for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy own_all on public.todos for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy own_all on public.module_steps for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
