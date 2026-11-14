-- Recurring plans can bill every few months (e.g. ₹249 every 3 months), not only monthly.
alter table public.plans
  add column billing_months smallint not null default 1 check (billing_months between 1 and 12);
