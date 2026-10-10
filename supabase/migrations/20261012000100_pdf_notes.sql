-- PDF short notes: a module's notes can be an uploaded PDF instead of Markdown.
-- When pdf_path is set, students see the PDF and content_md is kept but not shown.

alter table public.documents add column pdf_path text;
create unique index documents_pdf_path_idx on public.documents (pdf_path) where pdf_path is not null;

-- Private bucket: files are only reachable through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notes', 'notes', false, 20 * 1024 * 1024, array['application/pdf'])
on conflict (id) do nothing;

-- Admins manage every file in the bucket.
create policy notes_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'notes' and (select public.is_admin()))
  with check (bucket_id = 'notes' and (select public.is_admin()));

-- Students may read (and so sign a URL for) a PDF exactly when they may read its
-- notes: the documents row is itself filtered by its entitled_read policy.
create policy notes_entitled_read on storage.objects for select to authenticated
  using (
    bucket_id = 'notes'
    and exists (
      select 1 from public.documents d
      where d.pdf_path = storage.objects.name
        and d.is_published
        and public.module_visible(d.module_id)
        and public.has_access((select auth.uid()), d.module_id)
    )
  );
