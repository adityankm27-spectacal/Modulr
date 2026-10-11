import { z } from "zod";
import { apiError, json, readJson } from "@/lib/api";
import { getViewer } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/billing";
import { recordPayment, syncSubscription } from "@/lib/billing/sync";
import { createServiceClient } from "@/lib/supabase/service";

const body = z.object({
  paymentId: z.string().min(1).max(100),
  subscriptionId: z.string().min(1).max(100),
  signature: z.string().min(1).max(200),
});

/**
 * POST /api/billing/verify: called by the browser after checkout succeeds.
 * Checks Razorpay's signature, then pulls the subscription and payment from
 * Razorpay so access opens without waiting for the webhook. Idempotent; the
 * browser repeats it while the subscription is still being activated.
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return apiError(401, "Sign in again to finish.");

  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "Invalid request.");

  let provider;
  try {
    provider = getPaymentProvider();
  } catch {
    return apiError(503, "Payments aren't available right now.");
  }
  if (!provider.verifyCheckout(parsed.data)) return apiError(400, "Payment couldn't be verified.");

  const service = createServiceClient();
  const { data: row } = await service
    .from("subscriptions")
    .select("id, user_id")
    .eq("provider_subscription_id", parsed.data.subscriptionId)
    .eq("user_id", viewer.userId)
    .maybeSingle();
  if (!row) return apiError(404, "Subscription not found.");

  try {
    const [remote, payment] = await Promise.all([
      provider.getSubscription(parsed.data.subscriptionId),
      provider.getPayment(parsed.data.paymentId),
    ]);
    await syncSubscription(service, remote);
    await recordPayment(service, row, payment);
    return json({ status: remote.status, active: remote.status === "active" });
  } catch (err) {
    console.error(err);
    return apiError(502, "Payment received, but we couldn't confirm it yet. Refresh in a minute.");
  }
}
