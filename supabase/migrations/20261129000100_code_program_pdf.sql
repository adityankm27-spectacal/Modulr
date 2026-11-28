-- Each code program can have its own PDF of the code, so programs in the same module
-- no longer share (and overwrite) one module-wide Code PDF. The file lives in the
-- private `notes` bucket like the other PDFs.
alter table public.code_programs add column if not exists pdf_path text;

-- Students who can open the program can read its PDF (same rule as documents' PDFs).
create policy notes_program_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'notes'
    and exists (
      select 1 from public.code_programs c
      where c.pdf_path = objects.name
        and c.is_published
        and public.module_visible(c.module_id)
        and public.has_access((select auth.uid()), c.module_id)
    )
  );
