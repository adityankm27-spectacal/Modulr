-- RLS + entitlement tests. Runs against seed data; everything is rolled back.
-- Each block impersonates a role the way PostgREST does: JWT claims in
-- request.jwt.claims + SET ROLE anon/authenticated.
\set QUIET on
\set VERBOSITY terse
\o /dev/null
begin;

create schema tests;

create function tests.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then
    raise exception 'FAIL: %', label;
  end if;
  raise notice 'ok   %', label;
end;
$$;

-- Expects `stmt` to fail with SQLSTATE `state`.
create function tests.expect_error(stmt text, state text, label text) returns void
language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAIL: % (no error raised)', label;
exception
  when others then
    if sqlerrm like 'FAIL:%' then
      raise;
    end if;
    if sqlstate <> state then
      raise exception 'FAIL: % (expected %, got %: %)', label, state, sqlstate, sqlerrm;
    end if;
    raise notice 'ok   %', label;
end;
$$;

grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

\set free    '''a0000000-0000-4000-8000-000000000001'''
\set sub     '''a0000000-0000-4000-8000-000000000002'''
\set grace   '''a0000000-0000-4000-8000-000000000003'''
\set expired '''a0000000-0000-4000-8000-000000000004'''
\set comp    '''a0000000-0000-4000-8000-000000000005'''
\set buyer   '''a0000000-0000-4000-8000-000000000006'''
\set admin   '''a0000000-0000-4000-8000-000000000007'''
\set subjA   '''40000000-0000-4000-8000-000000000001'''
\set mod11   '''50000000-0000-4000-8000-000000000011'''
\set mod12   '''50000000-0000-4000-8000-000000000012'''
\set mod21   '''50000000-0000-4000-8000-000000000021'''
\set plan    '''60000000-0000-4000-8000-000000000001'''

-- Baselines, so the suite also passes on a database that already has real users.
select count(*) as reports_before from public.content_reports \gset
select count(*) as webhooks_before from public.webhook_events \gset

-- ---------------------------------------------------------------------------
-- Fixtures (as the database owner)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  (:free,    'free@test.local',    '{"full_name": "Free Student"}'),
  (:sub,     'sub@test.local',     '{"name": "Subscriber"}'),
  (:grace,   'grace@test.local',   '{}'),
  (:expired, 'expired@test.local', '{}'),
  (:comp,    'comp@test.local',    '{}'),
  (:buyer,   'buyer@test.local',   '{}'),
  (:admin,   'admin@test.local',   '{}');

-- Created a month ago, so the trial test below can target only the free user.
update public.profiles set created_at = now() - interval '30 days'
  where id in (:sub, :grace, :expired, :comp, :buyer, :admin);
update public.profiles set role = 'admin' where id = :admin;
update public.profiles set comp_access_until = now() + interval '30 days' where id = :comp;

insert into public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
values
  (:sub,     :plan, 'active',    now() - interval '10 days', now() + interval '20 days'),
  (:grace,   :plan, 'cancelled', now() - interval '31 days', now() - interval '1 day'),
  (:expired, :plan, 'cancelled', now() - interval '35 days', now() - interval '5 days');

insert into public.plans (id, name, price_paise, interval, scope, validity_days)
values ('60000000-0000-4000-8000-000000000002', 'TEST exam pack', 9900, 'one_time', 'subject', 60);
insert into public.plans (name, price_paise, interval, scope, is_active)
values ('TEST retired plan', 9900, 'month', 'all', false);
insert into public.purchases (user_id, plan_id, scope, subject_id, valid_until)
values (:buyer, '60000000-0000-4000-8000-000000000002', 'subject', :subjA, now() + interval '60 days');

select count(*) as profiles_total from public.profiles \gset
select count(*) as active_plans from public.plans where is_active \gset

-- ---------------------------------------------------------------------------
-- Schema behaviour (as owner)
-- ---------------------------------------------------------------------------
select tests.check(
  (select count(*) from public.profiles where id in (:free, :sub, :grace, :expired, :comp, :buyer, :admin)) = 7,
  'profile auto-created for each auth user');
select tests.check(
  (select full_name from public.profiles where id = :free) = 'Free Student'
  and (select full_name from public.profiles where id = :sub) = 'Subscriber',
  'profile full_name taken from user metadata');
select tests.check(
  (select array_agg(number order by number) from public.modules where is_free_preview)
    = array[1, 1]::smallint[],
  'free preview defaults to module 1 via app_settings');
select tests.check(
  (select count(*) from public.questions) = 60
  and (select count(*) from public.questions where module_id is null) = 6,
  'seed: 10 questions of each kind per subject, some spanning modules');
select tests.check(
  not exists (select 1 from public.documents where content_md not like '%DUMMY%')
  and not exists (select 1 from public.questions where question_md not like 'DUMMY%')
  and not exists (select 1 from public.videos where title not like 'DUMMY%'),
  'all seed content is marked DUMMY');
select tests.check(
  (select count(*) from public.documents d where d.kind = 'short_notes'
     and d.content_md like '%:::trick%' and d.content_md like '%:::tip%'
     and d.content_md like '%:::mistake%' and d.content_md like '%:::definition%'
     and d.content_md like '%$$%') = 6,
  'every short-notes doc has LaTeX and all four callout types');
select tests.check(
  (select price_paise from public.plans where id = :plan) = 4900, 'launch plan is ₹49');

update public.documents set content_md = content_md || ' edit' where module_id = :mod11 and kind = 'short_notes';
select tests.check(
  (select version from public.documents where module_id = :mod11 and kind = 'short_notes') = 2,
  'content version bumps on update');

select tests.expect_error(
  format('insert into public.questions (subject_id, module_id, kind, question_md) values (%L, %L, %L, %L)',
         '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000021', 'viva', 'x'),
  '23514', 'question module must belong to its subject');
select tests.expect_error(
  $$insert into public.documents (module_id, kind, title) values
    ('50000000-0000-4000-8000-000000000011', 'short_notes', 'dup')$$,
  '23505', 'only one short-notes doc per module');

insert into public.webhook_events (provider, event_id, type, payload) values ('razorpay', 'evt_1', 't', '{}');
select tests.expect_error(
  $$insert into public.webhook_events (provider, event_id, type, payload) values ('razorpay', 'evt_1', 't', '{}')$$,
  '23505', 'webhook events are deduplicated by (provider, event_id)');

select tests.expect_error(
  format('update public.profiles set college_id = null, branch_id = %L where id = %L',
         '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
  '23514', 'profile branch must belong to its college');
update public.profiles
  set college_id = '10000000-0000-4000-8000-000000000001',
      branch_id = '20000000-0000-4000-8000-000000000001'
  where id = :free;
select tests.check(
  (select branch_id is not null from public.profiles where id = :free),
  'profile accepts a branch of its college');

-- has_access from the server side (no JWT) for each user type.
select tests.check(not public.has_access(:free, :mod12), 'server: free user locked out of module 2');
select tests.check(public.has_access(:free, :mod11), 'server: free user gets module 1 preview');
select tests.check(public.has_access(:sub, :mod12), 'server: active subscriber has access');
select tests.check(public.has_access(:grace, :mod12), 'server: cancelled within grace has access');
select tests.check(not public.has_access(:expired, :mod12), 'server: cancelled past grace has no access');
select tests.check(public.has_access(:comp, :mod12), 'server: comp access works');
select tests.check(public.has_access(:buyer, :mod12), 'server: subject purchase covers its modules');
select tests.check(not public.has_access(:buyer, '50000000-0000-4000-8000-000000000022'),
  'server: subject purchase does not cover other subjects');
select tests.check(public.has_access(:admin, :mod12), 'server: admin has access');
select tests.check(not public.has_access(null, :mod11), 'server: visitors never get content');

-- ---------------------------------------------------------------------------
-- Visitor (anon)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;

select tests.check((select count(*) from public.subjects) = 2, 'anon sees published subject titles');
select tests.check((select count(*) from public.modules) = 6, 'anon sees published module titles');
select tests.check((select count(*) from public.plans) = :active_plans, 'anon sees active plans only');
select tests.check((select count(*) from public.videos) = 0, 'anon sees no videos');
select tests.check((select count(*) from public.documents) = 0, 'anon sees no notes');
select tests.check((select count(*) from public.questions) = 0, 'anon sees no questions');
select tests.check((select count(*) from public.formula_cards) = 0, 'anon sees no formula cards');
select tests.check(
  (select count(*) from public.module_content_counts(:subjA) where videos = 2 and pyqs = 3 and has_short_notes) = 3,
  'anon gets per-module content counts (draft video excluded)');
select tests.expect_error('select * from public.profiles', '42501', 'anon cannot read profiles');
select tests.expect_error('select * from public.subscriptions', '42501', 'anon cannot read subscriptions');

reset role;

-- ---------------------------------------------------------------------------
-- Free student
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('sub', :free, 'role', 'authenticated')::text, true);
set local role authenticated;

select tests.check((select count(*) from public.videos) = 4, 'free: only free-preview videos (2 modules × 2)');
select tests.check((select count(*) from public.documents) = 4, 'free: only free-preview notes + formula sheets');
select tests.check((select count(*) from public.formula_cards) = 4, 'free: only free-preview formula cards');
select tests.check((select count(*) from public.questions) = 18, 'free: only module-1 questions (3 per kind per subject)');
select tests.check((select count(*) from public.profiles) = 1, 'free: sees only own profile');
select tests.check(not public.has_access(:sub, :mod11), 'free: cannot probe another user''s access');
select tests.check(not public.is_admin(), 'free: not admin');

update public.profiles set full_name = 'Renamed', semester = 3 where id = :free;
select tests.check((select full_name from public.profiles) = 'Renamed', 'free: can edit own onboarding fields');
update public.profiles set full_name = 'Hacked' where id = :sub;
reset role;
select tests.check((select full_name from public.profiles where id = :sub) = 'Subscriber',
  'free: cannot edit someone else''s profile');
select set_config('request.jwt.claims', json_build_object('sub', :free, 'role', 'authenticated')::text, true);
set local role authenticated;

select tests.expect_error(
  format('update public.profiles set role = %L where id = %L', 'admin', 'a0000000-0000-4000-8000-000000000001'),
  '42501', 'free: cannot make self admin');
select tests.expect_error(
  format('update public.profiles set comp_access_until = now() + interval ''1 year'' where id = %L',
         'a0000000-0000-4000-8000-000000000001'),
  '42501', 'free: cannot grant self comp access');
select tests.expect_error(
  format('insert into public.subscriptions (user_id, plan_id, status) values (%L, %L, %L)',
         'a0000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'active'),
  '42501', 'free: cannot create own subscription');
-- Catalog write grants exist for admins, so non-admin writes are filtered by RLS, not rejected.
update public.modules set is_free_preview = true;
reset role;
select tests.check((select count(*) from public.modules where is_free_preview) = 2,
  'free: catalog updates are silently filtered by RLS');
select set_config('request.jwt.claims', json_build_object('sub', :free, 'role', 'authenticated')::text, true);
set local role authenticated;

-- Content writes are admin-only.
select tests.expect_error(
  format('select public.reorder_items(%L, array[%L]::uuid[])', 'modules', '50000000-0000-4000-8000-000000000011'),
  '42501', 'free: cannot reorder content');
select tests.expect_error(
  format('insert into public.questions (subject_id, kind, question_md) values (%L, %L, %L)',
         '40000000-0000-4000-8000-000000000001', 'viva', 'x'),
  '42501', 'free: cannot create questions');

-- Watch progress only for visible videos.
insert into public.watch_progress (user_id, video_id, position_sec)
  select :free, id, 30 from public.videos where module_id = :mod11 limit 1;
select tests.check((select count(*) from public.watch_progress) = 1, 'free: can save progress on free video');
reset role;
create temp table locked_video as select id from public.videos where module_id = :mod12 limit 1;
grant select on locked_video to authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :free, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.expect_error(
  format('insert into public.watch_progress (user_id, video_id) values (%L, %L)',
         'a0000000-0000-4000-8000-000000000001', (select id from locked_video)),
  '42501', 'free: cannot save progress on locked video');

-- Reports.
insert into public.content_reports (user_id, item_type, item_id, reason, message)
  values (:free, 'module', :mod11, 'typo', 'DUMMY report');
select tests.check((select count(*) from public.content_reports) = 1, 'free: can file and read own report');
select tests.expect_error(
  format('insert into public.content_reports (user_id, item_type, item_id, reason, status) values (%L, %L, %L, %L, %L)',
         'a0000000-0000-4000-8000-000000000001', 'module', '50000000-0000-4000-8000-000000000011', 'typo', 'resolved'),
  '42501', 'free: cannot set report status');
select tests.expect_error(
  format('insert into public.content_reports (user_id, item_type, item_id, reason) values (%L, %L, %L, %L)',
         'a0000000-0000-4000-8000-000000000002', 'module', '50000000-0000-4000-8000-000000000011', 'typo'),
  '42501', 'free: cannot file a report as someone else');

-- Personal data.
insert into public.bookmarks (user_id, item_type, item_id) values (:free, 'module', :mod11);
insert into public.attendance_subjects (user_id, label, semester, academic_year)
  values (:free, 'DUMMY subject', 3, '2026-27');
select tests.check((select count(*) from public.bookmarks) = 1 and (select count(*) from public.attendance_subjects) = 1,
  'free: can manage own bookmarks and attendance');

reset role;

-- ---------------------------------------------------------------------------
-- Paid users
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('sub', :sub, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.check((select count(*) from public.videos) = 12, 'subscriber: all published videos, no drafts');
select tests.check((select count(*) from public.documents) = 12, 'subscriber: all notes + formula sheets');
select tests.check((select count(*) from public.questions) = 60, 'subscriber: all questions incl. cross-module');
select tests.check((select count(*) from public.subscriptions) = 1, 'subscriber: sees own subscription only');
select tests.check((select count(*) from public.bookmarks) = 0, 'subscriber: cannot see others'' bookmarks');
select tests.check((select count(*) from public.content_reports) = 0, 'subscriber: cannot see others'' reports');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', :grace, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.check((select count(*) from public.questions) = 60, 'cancelled within grace: full access');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', :expired, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.check((select count(*) from public.questions) = 18, 'cancelled past grace: free preview only');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', :comp, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.check((select count(*) from public.questions) = 60, 'comp access: full access');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', :buyer, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.check((select count(*) from public.questions) = 39, 'subject pack: all of subject A + free preview of B');
select tests.check((select count(*) from public.videos) = 8, 'subject pack: 6 videos of A + 2 free of B');
reset role;

-- ---------------------------------------------------------------------------
-- Settings-driven trial (spec §16 Q4)
-- ---------------------------------------------------------------------------
update public.app_settings set value = '7' where key = 'free_preview.trial_days';
select set_config('request.jwt.claims', json_build_object('sub', :free, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.check((select count(*) from public.questions) = 60, 'trial: new account gets full access during trial');
reset role;
select set_config('request.jwt.claims', json_build_object('sub', :expired, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.check((select count(*) from public.questions) = 18, 'trial: older account outside trial window is not affected');
reset role;
update public.app_settings set value = '0' where key = 'free_preview.trial_days';

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('sub', :admin, 'role', 'authenticated')::text, true);
set local role authenticated;
select tests.check((select count(*) from public.videos) = 14, 'admin: sees drafts too');
select tests.check((select count(*) from public.profiles) = :profiles_total, 'admin: sees all profiles');
select tests.check((select count(*) from public.content_reports) = :reports_before + 1, 'admin: sees report inbox');
select tests.check((select count(*) from public.webhook_events) = :webhooks_before + 1, 'admin: can read webhook events');
select public.reorder_items('modules', array[
  '50000000-0000-4000-8000-000000000013', '50000000-0000-4000-8000-000000000011',
  '50000000-0000-4000-8000-000000000012']::uuid[]);
select tests.check(
  (select array_agg(number order by sort_order) from public.modules where subject_id = :subjA)
    = array[3, 1, 2]::smallint[],
  'admin: reorder_items sets sort_order from the id list');
select tests.expect_error(
  $$select public.reorder_items('profiles', array[]::uuid[])$$, '22023',
  'admin: reorder_items only accepts allow-listed tables');
insert into public.questions (subject_id, module_id, kind, question_md, answer_md)
  values (:subjA, :mod11, 'viva', 'TEST admin question', 'TEST answer');
select tests.check(
  (select count(*) from public.questions where question_md = 'TEST admin question') = 1,
  'admin: can create questions');
update public.subjects set is_published = false where id = :subjA;
update public.profiles set comp_access_until = now() + interval '7 days' where id = :free;
update public.content_reports set status = 'resolved', resolved_by = :admin, resolved_at = now()
  where user_id = :free;
select tests.check((select count(*) from public.content_reports where user_id = :free and status = 'resolved') = 1,
  'admin: can resolve reports');
reset role;
select tests.check((select comp_access_until is not null from public.profiles where id = :free),
  'admin: can grant comp access');

select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;
select tests.check((select count(*) from public.modules) = 3, 'unpublishing a subject hides its modules');
reset role;

rollback;
\o
\echo 'All database tests passed.'
