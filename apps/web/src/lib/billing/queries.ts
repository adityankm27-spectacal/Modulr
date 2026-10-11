import "server-only";
import { subscriptionGrantsAccess } from "@modulr/shared";
import { cache } from "react";
import { getSettings } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export interface SubscriptionLike {
  status: Parameters<typeof subscriptionGrantsAccess>[0]["status"];
  current_period_end: string | null;
  grace_until: string | null;
}

export function grantsAccess(sub: SubscriptionLike, graceDays: number, now = new Date()) {
  return subscriptionGrantsAccess(
    {
      status: sub.status,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end) : null,
      graceUntil: sub.grace_until ? new Date(sub.grace_until) : null,
    },
    { now, graceDays },
  );
}

/**
 * The viewer's billing picture: the subscription to show (one that currently
 * grants access, else the most recent one that got past checkout) and recent
 * payments. Abandoned checkouts (`created`) are left out.
 */
export const getBilling = cache(async (userId: string) => {
  const supabase = await createClient();
  const [subs, payments, settings] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id, status, current_period_start, current_period_end, cancel_at_period_end, grace_until, created_at, plans(name, price_paise)",
      )
      .eq("user_id", userId)
      .neq("status", "created")
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, provider_payment_id, amount_paise, status, method, paid_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(24),
    getSettings(),
  ]);
  if (subs.error) throw new Error(`Couldn't load subscriptions: ${subs.error.message}`);
  if (payments.error) throw new Error(`Couldn't load payments: ${payments.error.message}`);

  const graceDays = settings["billing.grace_days"];
  const active = subs.data.find((s) => grantsAccess(s, graceDays)) ?? null;
  return {
    subscription: active ?? subs.data[0] ?? null,
    hasSubscriptionAccess: active !== null,
    payments: payments.data,
  };
});
