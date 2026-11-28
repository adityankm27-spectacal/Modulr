-- Code tab: worked programs for a module (e.g. "Stack using array" in Java), each with
-- its source code and its own explanation video(s). Shown only in subjects that turn the
-- tab on (Data Structures). Access matches every other paid module item: free-preview
-- modules for any signed-in student, otherwise paid subject access.

alter table public.subjects add column has_code_tab boolean not null default false;

-- Data Structures: DS (Computer Engineering) and DSA (Information Technology).
update public.subjects set has_code_tab = true
where id in ('e465012a-0a92-4887-a24e-7114fe1872d3', 'ce29b345-80a5-4152-bbbb-3bbcf2a3eb87');

create table public.code_programs (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  language text not null default 'java' check (language in ('java')),
  code text not null default '' check (char_length(code) <= 200000),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index code_programs_module_idx on public.code_programs (module_id, sort_order);

create trigger set_updated_at before update on public.code_programs
  for each row execute function public.set_updated_at();

-- Whether this user may read this program (and its videos): published, in a visible
-- module, and the same access rule as the module's other content.
create function public.code_program_access(p_user uuid, p_program uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select p.is_published
      and public.module_visible(p.module_id)
      and public.has_access(p_user, p.module_id)
    from public.code_programs p
    where p.id = p_program
  ), false)
$$;
revoke execute on function public.code_program_access(uuid, uuid) from public;
grant execute on function public.code_program_access(uuid, uuid)
  to anon, authenticated, service_role;

revoke all on public.code_programs from anon, authenticated;
grant all on public.code_programs to service_role;
grant select on public.code_programs to anon, authenticated;
grant insert, update, delete on public.code_programs to authenticated;
alter table public.code_programs enable row level security;

create policy entitled_read on public.code_programs for select to anon, authenticated
  using (public.code_program_access((select auth.uid()), id));
create policy admin_all on public.code_programs for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- A video belongs to exactly one of: a module, a practical, or a code program.
alter table public.videos
  add column code_program_id uuid references public.code_programs (id) on delete cascade;
alter table public.videos drop constraint videos_one_parent;
alter table public.videos
  add constraint videos_one_parent
  check (num_nonnulls(module_id, practical_id, code_program_id) = 1);
create index videos_code_program_idx on public.videos (code_program_id, sort_order)
  where code_program_id is not null;

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
      or (code_program_id is not null
        and public.code_program_access((select auth.uid()), code_program_id))
    )
  );

-- Programs can be drag-reordered in the admin.
create or replace function public.reorder_items(p_table text, p_ids uuid[]) returns void
language plpgsql set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid())
     and coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role' then
    raise exception 'only admins can reorder content' using errcode = '42501';
  end if;

  if p_table not in ('subjects', 'modules', 'practicals', 'videos', 'formula_cards', 'questions',
                     'topics', 'code_programs') then
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

-- Tab counts gain the number of published programs. The return type changes, so the
-- function is recreated.
drop function public.module_content_counts(uuid);

create function public.module_content_counts(p_subject uuid)
returns table (
  module_id uuid,
  videos bigint,
  has_short_notes boolean,
  has_formula_sheet boolean,
  formula_cards bigint,
  pyqs bigint,
  important_questions bigint,
  viva_questions bigint,
  has_pyq_sheet boolean,
  has_important_sheet boolean,
  has_viva_sheet boolean,
  slides bigint,
  code_programs bigint
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
     where q.module_id = m.id and q.kind = 'viva' and q.is_published),
    exists (select 1 from public.documents d where d.module_id = m.id
            and d.kind = 'pyq_sheet' and d.pdf_path is not null and d.is_published),
    exists (select 1 from public.documents d where d.module_id = m.id
            and d.kind = 'important_sheet' and d.pdf_path is not null and d.is_published),
    exists (select 1 from public.documents d where d.module_id = m.id
            and d.kind = 'viva_sheet' and d.pdf_path is not null and d.is_published),
    (select count(*) from public.documents d
     where d.module_id = m.id and d.kind = 'slides' and d.is_published),
    (select count(*) from public.code_programs c
     where c.module_id = m.id and c.is_published)
  from public.modules m
  join public.subjects s on s.id = m.subject_id
  where m.subject_id = p_subject
    and ((m.is_published and s.is_published) or public.is_admin(auth.uid()))
  order by m.sort_order, m.number
$$;

revoke execute on function public.module_content_counts(uuid) from public;
grant execute on function public.module_content_counts(uuid) to anon, authenticated, service_role;
