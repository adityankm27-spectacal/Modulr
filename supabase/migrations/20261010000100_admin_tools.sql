-- M2: admin content tools.

-- Reorders rows in one call: sort_order becomes each id's 1-based position in p_ids.
-- SECURITY INVOKER, so RLS still decides what the caller may update; the explicit
-- admin check and table allow-list are defence in depth for the dynamic SQL.
create function public.reorder_items(p_table text, p_ids uuid[]) returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid())
     and coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role' then
    raise exception 'only admins can reorder content' using errcode = '42501';
  end if;

  if p_table not in ('subjects', 'modules', 'videos', 'formula_cards', 'questions', 'topics') then
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

revoke execute on function public.reorder_items(text, uuid[]) from public, anon;
grant execute on function public.reorder_items(text, uuid[]) to authenticated, service_role;
