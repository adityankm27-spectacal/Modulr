-- Practicals: explanation videos for a subject's lab experiments. They belong to the
-- subject, not to a module, and follow the subject's paid access (subscribers only).

create table public.practicals (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  number smallint not null check (number between 1 and 99),
  title text not null check (char_length(title) between 1 and 200),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, number)
);
create index practicals_subject_idx on public.practicals (subject_id, sort_order);

create trigger set_updated_at before update on public.practicals
  for each row execute function public.set_updated_at();

-- A video belongs to either a module or a practical, never both.
alter table public.videos alter column module_id drop not null;
alter table public.videos
  add column practical_id uuid references public.practicals (id) on delete cascade;
alter table public.videos
  add constraint videos_one_parent check ((module_id is null) <> (practical_id is null));
create index videos_practical_idx on public.videos (practical_id, sort_order);

-- Visible once published, inside a published subject.
create function public.practical_visible(p_practical uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.practicals p
    join public.subjects s on s.id = p.subject_id
    where p.id = p_practical and p.is_published and s.is_published
  )
$$;

-- Practical videos need the same paid access as the subject's modules.
create function public.has_practical_access(p_user uuid, p_practical uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_subject_access(p_user, p.subject_id)
  from public.practicals p
  where p.id = p_practical
$$;

revoke execute on function public.practical_visible(uuid), public.has_practical_access(uuid, uuid)
  from public;
grant execute on function public.practical_visible(uuid), public.has_practical_access(uuid, uuid)
  to anon, authenticated, service_role;

-- Grants and RLS, matching the other catalog tables.
revoke all on public.practicals from anon, authenticated;
grant all on public.practicals to service_role;
grant select on public.practicals to anon, authenticated;
grant insert, update, delete on public.practicals to authenticated;
alter table public.practicals enable row level security;

create policy public_read on public.practicals for select to anon, authenticated
  using (public.practical_visible(id));
create policy admin_all on public.practicals for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Videos: module videos as before, plus practical videos for subscribers.
drop policy entitled_read on public.videos;
create policy entitled_read on public.videos for select to anon, authenticated
  using (
    is_published and (
      (module_id is not null
        and public.module_visible(module_id)
        and public.has_access((select auth.uid()), module_id))
      or (practical_id is not null
        and public.practical_visible(practical_id)
        and public.has_practical_access((select auth.uid()), practical_id))
    )
  );

-- Practicals can be drag-reordered in the admin like modules.
create or replace function public.reorder_items(p_table text, p_ids uuid[]) returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid())
     and coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role' then
    raise exception 'only admins can reorder content' using errcode = '42501';
  end if;

  if p_table not in ('subjects', 'modules', 'practicals', 'videos', 'formula_cards', 'questions', 'topics') then
    raise exception 'cannot reorder %', p_table using errcode = '22023';
  end if;

  execute format(
    'update public.%I as t set sort_order = o.position
       from unnest($1) with ordinality as o(id, position)
      where t.id = o.id',
    p_table
  ) using p_ids;
end;
$$;
