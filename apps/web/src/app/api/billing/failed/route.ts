import { z } from "zod";
import { apiError, json, readJson } from "@/lib/api";
import { getViewer } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/billing";
import { recordPayment } from "@/lib/billing/sync";
import { createServiceClient } from "@/lib/supabase/service";

const body = z.object({
  paymentId: z.string().min(1).max(100),
  subscriptionId: z.string().min(1).max(100),
});

/**
 * POST /api/billing/failed: called by the browser when checkout reports a failed
 * payment, so the attempt and Razorpay's reason are kept on our side. Nothing from
 * the browser is trusted beyond the ids: the payment is re-fetched from Razorpay and
 * only stored when Razorpay itself says it failed, against a subscription the viewer
 * owns. It never grants access.
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return apiError(401, "Sign in again.");

  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "Invalid request.");

  let provider;
  try {
    provider = getPaymentProvider();
  } catch {
    return apiError(503, "Payments aren't available right now.");
  }

  const service = createServiceClient();
  const { data: row } = await service
    .from("subscriptions")
    .select("id, user_id")
    .eq("provider_subscription_id", parsed.data.subscriptionId)
    .eq("user_id", viewer.userId)
    .maybeSingle();
  if (!row) return apiError(404, "Subscription not found.");

  try {
    const payment = await provider.getPayment(parsed.data.paymentId);
    if (payment.status !== "failed") return json({ recorded: false });
    // A retry that later succeeds on the same payment id is overwritten by verify/webhooks.
    const { data: existing } = await service
      .from("payments")
      .select("status")
      .eq("provider_payment_id", payment.id)
      .maybeSingle();
    if (existing && existing.status !== "failed") return json({ recorded: false });
    await recordPayment(service, row, payment);
    return json({ recorded: true });
  } catch (err) {
    console.error(err);
    return apiError(502, "Couldn't record the failed payment.");
  }
}
