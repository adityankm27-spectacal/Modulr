import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";
import { paymentRow, subscriptionPatch } from "./rows";
import type { ProviderPayment, ProviderSubscription } from "./types";

type Service = ReturnType<typeof createServiceClient>;

/**
 * Writes the provider's current view of a subscription to its row. Callers pass
 * state fetched from the provider (not a webhook payload), so deliveries that
 * arrive late or out of order can't move a subscription back to an old state.
 * Returns null for subscriptions Modulr didn't create.
 */
export async function syncSubscription(service: Service, remote: ProviderSubscription) {
  const { data, error } = await service
    .from("subscriptions")
    .update(subscriptionPatch(remote))
    .eq("provider", "razorpay")
    .eq("provider_subscription_id", remote.id)
    .select("id, user_id, status")
    .maybeSingle();
  if (error) throw new Error(`Couldn't update subscription ${remote.id}: ${error.message}`);
  return data;
}

export async function recordPayment(
  service: Service,
  subscription: { id: string; user_id: string },
  payment: ProviderPayment,
) {
  const { error } = await service
    .from("payments")
    .upsert(paymentRow(payment, subscription), { onConflict: "provider_payment_id" });
  if (error) throw new Error(`Couldn't record payment ${payment.id}: ${error.message}`);
}
