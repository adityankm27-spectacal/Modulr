-- M1: onboarding integrity. A profile's branch must belong to its college.
create function public.profiles_check_branch_college() returns trigger
language plpgsql as $$
begin
  if new.branch_id is not null and not exists (
    select 1 from public.branches b
    where b.id = new.branch_id and b.college_id is not distinct from new.college_id
  ) then
    raise exception 'branch % does not belong to college %', new.branch_id, new.college_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_check_branch_college
  before insert or update of college_id, branch_id on public.profiles
  for each row execute function public.profiles_check_branch_college();
