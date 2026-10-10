-- Tab counts also report published PDF question sheets, so a tab whose only content is
-- a PDF isn't shown as empty. The return type changes, so the function is recreated.
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
  has_viva_sheet boolean
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
            and d.kind = 'viva_sheet' and d.pdf_path is not null and d.is_published)
  from public.modules m
  join public.subjects s on s.id = m.subject_id
  where m.subject_id = p_subject
    and ((m.is_published and s.is_published) or public.is_admin(auth.uid()))
  order by m.sort_order, m.number
$$;

revoke execute on function public.module_content_counts(uuid) from public;
grant execute on function public.module_content_counts(uuid) to anon, authenticated, service_role;
