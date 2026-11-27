-- Why a payment failed, as Razorpay reported it (e.g. the student cancelled the UPI
-- AutoPay request, or the UPI app didn't answer in time). Only set on failed payments,
-- so support can see the reason without opening the Razorpay dashboard.
alter table public.payments
  add column failure_code text,
  add column failure_reason text;
