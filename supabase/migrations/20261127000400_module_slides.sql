-- Slides tab: a module can have any number of uploaded files (.pptx, .ppt, .pdf, .docx,
-- .doc), stored as documents of kind 'slides'. They live in their own private `slides`
-- bucket so the `notes` bucket stays PDF-only. Access is the same as every other paid
-- module item: admins write, students read a published file only with has_access.

alter table public.documents
  add column file_path text,
  add column file_name text,
  add column file_size bigint,
  -- A slides row is nothing without its file; other kinds never use these columns.
  add constraint documents_slides_file check (
    (kind = 'slides') = (file_path is not null)
    and (file_path is null) = (file_name is null)
  );

-- Several slide files per module, like practicals.
drop index public.documents_one_per_kind;
create unique index documents_one_per_kind
  on public.documents (module_id, kind) where kind not in ('practical', 'slides');

-- A mirror shares its source's file, so uniqueness applies to originals only.
create unique index documents_file_path_idx on public.documents (file_path)
  where file_path is not null and mirror_of is null;

create index documents_module_slides_idx on public.documents (module_id, created_at)
  where kind = 'slides';

-- Private bucket: files are only reachable through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'slides', 'slides', false, 50 * 1024 * 1024,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy slides_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'slides' and (select public.is_admin()))
  with check (bucket_id = 'slides' and (select public.is_admin()));

-- Students may read (and so sign a URL for) a file exactly when they may read its row.
create policy slides_entitled_read on storage.objects for select to authenticated
  using (
    bucket_id = 'slides'
    and exists (
      select 1 from public.documents d
      where d.file_path = storage.objects.name
        and d.kind = 'slides'
        and d.is_published
        and public.module_visible(d.module_id)
        and public.has_access((select auth.uid()), d.module_id)
    )
  );

-- Mirrored subjects copy the file columns too (the mirror points at the same file).
create or replace function public.mirror_document() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_module uuid;
begin
  if new.mirror_of is not null then return new; end if;
  v_module := public.mirror_target_module(new.module_id);
  if v_module is null then return new; end if;
  begin
    if tg_op = 'UPDATE' then
      update public.documents set
        title = new.title, content_md = new.content_md, is_published = new.is_published,
        pdf_path = new.pdf_path, file_path = new.file_path, file_name = new.file_name,
        file_size = new.file_size
      where mirror_of = new.id;
      if found then return new; end if;
    end if;
    -- New document (or one that predates the mirror): at most one per kind per module,
    -- except practicals and slides.
    insert into public.documents (module_id, kind, title, content_md, is_published, pdf_path,
      file_path, file_name, file_size, mirror_of)
    values (v_module, new.kind, new.title, new.content_md, new.is_published, new.pdf_path,
      new.file_path, new.file_name, new.file_size, new.id);
  exception when others then
    raise warning 'mirror_document failed: %', sqlerrm;
  end;
  return new;
end;
$$;
revoke execute on function public.mirror_document() from public, anon, authenticated;

-- Tab counts gain the number of published slide files. The return type changes, so the
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
  slides bigint
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
     where d.module_id = m.id and d.kind = 'slides' and d.is_published)
  from public.modules m
  join public.subjects s on s.id = m.subject_id
  where m.subject_id = p_subject
    and ((m.is_published and s.is_published) or public.is_admin(auth.uid()))
  order by m.sort_order, m.number
$$;

revoke execute on function public.module_content_counts(uuid) from public;
grant execute on function public.module_content_counts(uuid) to anon, authenticated, service_role;
