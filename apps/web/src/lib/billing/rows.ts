import type { TablesUpdate } from "@modulr/shared";
import type { ProviderPayment, ProviderSubscription } from "./types";

/**
 * How a provider subscription is written to `subscriptions`. Period dates the
 * provider leaves out (e.g. before the first charge) keep their stored values,
 * so a later state never erases the paid period that access is measured from.
 */
export function subscriptionPatch(remote: ProviderSubscription): TablesUpdate<"subscriptions"> {
  return {
    status: remote.status,
    ...(remote.currentPeriodStart
      ? { current_period_start: remote.currentPeriodStart.toISOString() }
      : {}),
    ...(remote.currentPeriodEnd
      ? { current_period_end: remote.currentPeriodEnd.toISOString() }
      : {}),
  };
}

export function paymentRow(
  payment: ProviderPayment,
  subscription: { id: string; user_id: string },
) {
  return {
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    provider: "razorpay",
    provider_payment_id: payment.id,
    amount_paise: payment.amountPaise,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    paid_at: payment.paidAt?.toISOString() ?? null,
  };
}
