-- Practicals are free: any signed-in student can watch practical videos without a
-- subscription. Signed-out visitors still need to sign in, like a free-preview module.
create or replace function public.has_practical_access(p_user uuid, p_practical uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_user is not null
  from public.practicals p
  where p.id = p_practical
$$;
