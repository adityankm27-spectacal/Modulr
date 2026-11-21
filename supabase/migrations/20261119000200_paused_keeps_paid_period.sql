-- A halted or paused subscription (Razorpay `paused` maps to `halted`, e.g. a
-- UPI AutoPay mandate paused in the customer's app) must not cut off access the
-- customer has already paid for: it now grants access until current_period_end.
-- A subscription that never took a payment has no current_period_end, so
-- `created` / `authenticated` still grant nothing.
-- TypeScript twin: packages/shared/src/entitlement.ts (subscriptionGrantsAccess).
create or replace function public.has_subject_access(p_user uuid, p_subject uuid) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_subject public.subjects;
  v_grace_days integer := coalesce((public.setting('billing.grace_days') #>> '{}')::integer, 3);
  v_trial_days integer := coalesce((public.setting('free_preview.trial_days') #>> '{}')::integer, 0);
begin
  if p_user is null or not public.can_inspect_user(p_user) then
    return false;
  end if;

  select * into v_profile from public.profiles where id = p_user;
  if not found then
    return false;
  end if;

  if v_profile.role = 'admin' then
    return true;
  end if;

  if v_profile.comp_access_until is not null and v_profile.comp_access_until > now() then
    return true;
  end if;

  if v_trial_days > 0 and now() < v_profile.created_at + make_interval(days => v_trial_days) then
    return true;
  end if;

  if exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user
      and (
        s.status = 'active'
        or (
          s.status in ('cancelled', 'pending')
          and now() < coalesce(
            s.grace_until,
            s.current_period_end + make_interval(days => v_grace_days)
          )
        )
        or (
          s.status = 'halted'
          and now() < s.current_period_end
        )
      )
  ) then
    return true;
  end if;

  select * into v_subject from public.subjects where id = p_subject;
  if not found then
    return false;
  end if;

  return exists (
    select 1 from public.purchases p
    where p.user_id = p_user
      and p.valid_until > now()
      and (
        p.scope = 'all'
        or (p.scope = 'subject' and p.subject_id = v_subject.id)
        or (
          p.scope = 'semester'
          and p.syllabus_version_id = v_subject.syllabus_version_id
          and p.semester = v_subject.semester
        )
      )
  );
end;
$$;
