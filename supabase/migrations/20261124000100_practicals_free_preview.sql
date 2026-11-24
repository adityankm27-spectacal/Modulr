-- A practical can be a free preview, like a module: any signed-in student can watch its
-- videos without a subscription. Everything else about practicals is unchanged.
alter table public.practicals add column is_free_preview boolean not null default false;

create or replace function public.has_practical_access(p_user uuid, p_practical uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (p.is_free_preview and p_user is not null)
         or public.has_subject_access(p_user, p.subject_id)
  from public.practicals p
  where p.id = p_practical
$$;
