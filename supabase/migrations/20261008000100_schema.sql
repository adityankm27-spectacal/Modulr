-- Modulr schema (spec §8).
-- Conventions:
--   * every table has id uuid pk, created_at, updated_at (except pure join tables keyed by user + item)
--   * `order` from the spec is named `sort_order` (ORDER is a reserved word in SQL)
--   * content tables carry is_published + version; version bumps on every content update
--   * enums mirror packages/shared/src/enums.ts

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'contributor', 'admin');
create type public.document_kind as enum ('short_notes', 'formula_sheet', 'practical');
create type public.question_kind as enum ('pyq', 'important', 'viva');
create type public.question_frequency as enum ('very_frequent', 'frequent', 'sometimes');
create type public.video_provider as enum ('vdocipher', 'bunny');
create type public.video_processing_status as enum ('pending', 'uploading', 'processing', 'ready', 'failed');
create type public.plan_interval as enum ('month', 'one_time');
create type public.plan_scope as enum ('all', 'subject', 'semester');
create type public.subscription_status as enum (
  'created', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'
);
create type public.payment_status as enum ('created', 'authorized', 'captured', 'failed', 'refunded');
create type public.topic_status as enum ('todo', 'doing', 'done');
create type public.report_status as enum ('open', 'in_progress', 'resolved', 'dismissed');
create type public.report_reason as enum ('wrong_content', 'typo', 'unclear', 'broken_media', 'other');
create type public.device_platform as enum ('web', 'android', 'ios');
create type public.content_item_type as enum (
  'module', 'video', 'document', 'formula_card', 'question', 'experiment'
);

-- ---------------------------------------------------------------------------
-- Generic triggers
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Bumps `version` whenever a content row actually changes (no-op updates keep the version).
create function public.bump_version() returns trigger
language plpgsql as $$
begin
  if row(new.*) is distinct from row(old.*) then
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Settings (spec §16 open decisions, see packages/shared/src/settings.ts)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog: College → Branch → Syllabus version → (Semester) → Subject → Module
-- ---------------------------------------------------------------------------
create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (college_id, code)
);

create table public.syllabus_versions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  label text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, label)
);
-- At most one current syllabus per branch.
create unique index syllabus_versions_one_current
  on public.syllabus_versions (branch_id) where is_current;

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  syllabus_version_id uuid not null references public.syllabus_versions (id) on delete cascade,
  semester smallint not null check (semester between 1 and 8),
  code text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (syllabus_version_id, code)
);
create index subjects_semester_idx on public.subjects (syllabus_version_id, semester, sort_order);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  number smallint not null check (number > 0),
  title text not null,
  sort_order integer not null default 0,
  -- No default on purpose: when omitted, set from app_settings by modules_default_free_preview().
  is_free_preview boolean not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, number)
);
create index modules_subject_idx on public.modules (subject_id, sort_order);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  college_id uuid references public.colleges (id) on delete set null,
  branch_id uuid references public.branches (id) on delete set null,
  semester smallint check (semester between 1 and 8),
  role public.user_role not null default 'student',
  comp_access_until timestamptz,
  -- "I am 18+ or have parental consent" (spec §6, under-18 users).
  age_confirmed_at timestamptz,
  -- DPDP consent to Terms + Privacy at sign-up (spec §6).
  consent_accepted_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role) where role <> 'student';

-- ---------------------------------------------------------------------------
-- Module pack content
-- ---------------------------------------------------------------------------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  provider public.video_provider not null,
  provider_video_id text,
  duration_sec integer check (duration_sec >= 0),
  -- [{ "title": text, "start_sec": int }, ...]
  chapters jsonb not null default '[]'::jsonb check (jsonb_typeof(chapters) = 'array'),
  captions_url text,
  transcript_md text,
  thumbnail_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  processing_status public.video_processing_status not null default 'pending',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index videos_module_idx on public.videos (module_id, sort_order);
create unique index videos_provider_video_idx
  on public.videos (provider, provider_video_id) where provider_video_id is not null;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  kind public.document_kind not null,
  title text not null,
  content_md text not null default '',
  version integer not null default 1,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One short-notes doc and one formula sheet per module; practicals may repeat.
create unique index documents_one_per_kind
  on public.documents (module_id, kind) where kind <> 'practical';

create table public.formula_cards (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  formula_latex text not null,
  -- [{ "symbol": latex text, "meaning": text }, ...]
  symbols jsonb not null default '[]'::jsonb check (jsonb_typeof(symbols) = 'array'),
  when_to_use text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index formula_cards_module_idx on public.formula_cards (module_id, sort_order);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  -- Nullable: some questions span modules.
  module_id uuid references public.modules (id) on delete set null,
  kind public.question_kind not null,
  question_md text not null,
  answer_md text not null default '',
  marks smallint check (marks > 0),
  -- Exam sessions the question appeared in, e.g. {'May 2024','Dec 2023'}.
  sessions text[] not null default '{}',
  frequency public.question_frequency,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_subject_idx on public.questions (subject_id, kind, sort_order);
create index questions_module_idx on public.questions (module_id, kind, sort_order);
create index questions_sessions_idx on public.questions using gin (sessions);

-- A question's module must belong to its subject.
create function public.questions_check_module_subject() returns trigger
language plpgsql as $$
begin
  if new.module_id is not null and not exists (
    select 1 from public.modules m where m.id = new.module_id and m.subject_id = new.subject_id
  ) then
    raise exception 'module % does not belong to subject %', new.module_id, new.subject_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Phase 2 tables (spec marks these L; schema exists now so features slot in)
-- ---------------------------------------------------------------------------
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  number smallint not null check (number > 0),
  title text not null,
  aim_md text not null default '',
  theory_md text not null default '',
  code_md text not null default '',
  output_md text not null default '',
  conclusion_md text not null default '',
  -- [{ "question": text, "answer": text }, ...]
  viva jsonb not null default '[]'::jsonb check (jsonb_typeof(viva) = 'array'),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, number)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topics_module_idx on public.topics (module_id, sort_order);

create table public.topic_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  status public.topic_status not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table public.attendance_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Optional link to a catalog subject; students can also track free-text subjects.
  subject_id uuid references public.subjects (id) on delete set null,
  label text not null,
  semester smallint not null check (semester between 1 and 8),
  academic_year text not null,
  -- Running totals entered up front (e.g. when starting mid-semester); entries add to these.
  baseline_attended integer not null default 0 check (baseline_attended >= 0),
  baseline_total integer not null default 0 check (baseline_total >= baseline_attended),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index attendance_subjects_user_idx on public.attendance_subjects (user_id, academic_year, semester);

create table public.attendance_entries (
  id uuid primary key default gen_random_uuid(),
  attendance_subject_id uuid not null references public.attendance_subjects (id) on delete cascade,
  -- Denormalised owner for simple RLS.
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  attended boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index attendance_entries_subject_idx on public.attendance_entries (attendance_subject_id, date);

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_paise integer not null check (price_paise > 0),
  currency text not null default 'INR',
  interval public.plan_interval not null,
  scope public.plan_scope not null default 'all',
  -- Validity of one-time plans (exam packs), in days. Null for recurring plans.
  validity_days integer check (validity_days > 0),
  razorpay_plan_id text unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Subscriptions are always all-content; subject/semester scopes are one-time exam packs.
  check (interval = 'one_time' or scope = 'all'),
  check ((interval = 'one_time') = (validity_days is not null))
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  provider text not null default 'razorpay',
  provider_subscription_id text unique,
  status public.subscription_status not null default 'created',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  grace_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id, status);

-- Exam packs (one-time plans). Spec lists a single `scope_id`; a semester is not
-- its own row, so the scope is stored as explicit columns instead.
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  scope public.plan_scope not null,
  subject_id uuid references public.subjects (id) on delete restrict,
  syllabus_version_id uuid references public.syllabus_versions (id) on delete restrict,
  semester smallint check (semester between 1 and 8),
  provider_order_id text unique,
  valid_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (scope = 'all' and subject_id is null and syllabus_version_id is null and semester is null)
    or (scope = 'subject' and subject_id is not null and syllabus_version_id is null and semester is null)
    or (scope = 'semester' and subject_id is null and syllabus_version_id is not null and semester is not null)
  )
);
create index purchases_user_idx on public.purchases (user_id, valid_until);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  purchase_id uuid references public.purchases (id) on delete set null,
  provider text not null default 'razorpay',
  provider_payment_id text not null unique,
  amount_paise integer not null check (amount_paise >= 0),
  currency text not null default 'INR',
  status public.payment_status not null,
  method text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_idx on public.payments (user_id, created_at desc);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Dedupe key for idempotent processing.
  unique (provider, event_id)
);

-- ---------------------------------------------------------------------------
-- Devices, progress, bookmarks, reports
-- ---------------------------------------------------------------------------
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  platform public.device_platform not null,
  label text,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);
create index devices_active_idx on public.devices (user_id) where revoked_at is null;

create table public.watch_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  position_sec integer not null default 0 check (position_sec >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);
create index watch_progress_recent_idx on public.watch_progress (user_id, updated_at desc);

create table public.module_completion (
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type public.content_item_type not null,
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  item_type public.content_item_type not null,
  item_id uuid not null,
  reason public.report_reason not null,
  message text check (char_length(message) <= 2000),
  status public.report_status not null default 'open',
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_reports_status_idx on public.content_reports (status, created_at desc);
create index content_reports_item_idx on public.content_reports (item_type, item_id);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_entity_idx on public.admin_audit_log (entity, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'app_settings', 'colleges', 'branches', 'syllabus_versions', 'subjects', 'modules',
    'profiles', 'videos', 'documents', 'formula_cards', 'questions', 'experiments', 'topics',
    'topic_progress', 'attendance_subjects', 'attendance_entries', 'plans', 'subscriptions',
    'purchases', 'payments', 'webhook_events', 'devices', 'watch_progress', 'content_reports'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;

  foreach t in array array['videos', 'documents', 'formula_cards', 'questions', 'experiments'] loop
    execute format(
      'create trigger bump_version before update on public.%I
         for each row execute function public.bump_version()', t);
  end loop;
end;
$$;

create trigger questions_check_module_subject
  before insert or update of module_id, subject_id on public.questions
  for each row execute function public.questions_check_module_subject();

-- Attendance entries must belong to the same user as their subject.
create function public.attendance_entries_check_owner() returns trigger
language plpgsql as $$
begin
  if not exists (
    select 1 from public.attendance_subjects s
    where s.id = new.attendance_subject_id and s.user_id = new.user_id
  ) then
    raise exception 'attendance subject does not belong to user' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger attendance_entries_check_owner
  before insert or update on public.attendance_entries
  for each row execute function public.attendance_entries_check_owner();

-- Free preview default (spec §16 Q4): modules created without an explicit
-- is_free_preview get it from app_settings 'free_preview.default_module_numbers'.
create function public.modules_default_free_preview() returns trigger
language plpgsql as $$
declare
  numbers jsonb;
begin
  if new.is_free_preview is null then
    select value into numbers from public.app_settings
      where key = 'free_preview.default_module_numbers';
    new.is_free_preview := coalesce(numbers, '[1]'::jsonb) @> to_jsonb(new.number);
  end if;
  return new;
end;
$$;
create trigger modules_default_free_preview
  before insert on public.modules
  for each row execute function public.modules_default_free_preview();

-- Create a profile for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
