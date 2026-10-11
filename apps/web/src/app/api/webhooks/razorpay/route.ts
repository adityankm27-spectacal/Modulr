import { apiError, json } from "@/lib/api";
import { getPaymentProvider } from "@/lib/billing";
import { recordPayment, syncSubscription } from "@/lib/billing/sync";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Razorpay webhook (spec §9). In the Razorpay dashboard, point a webhook at
 * https://<domain>/api/webhooks/razorpay with RAZORPAY_WEBHOOK_SECRET and the
 * subscription.* events. Each delivery is verified, stored in webhook_events
 * (dedupe on the event id) and processed at most once successfully. The
 * subscription's state is re-fetched from Razorpay rather than read from the
 * payload, so out-of-order deliveries can't roll it back.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) return apiError(413, "Too large");

  let provider;
  try {
    provider = getPaymentProvider();
  } catch {
    return apiError(503, "Payments not configured");
  }

  let event;
  try {
    event = provider.parseWebhook(rawBody, request.headers);
  } catch {
    return apiError(400, "Invalid payload");
  }
  if (!event) return apiError(401, "Invalid signature");

  const service = createServiceClient();
  const { data: stored, error: storeError } = await service
    .from("webhook_events")
    .upsert(
      {
        provider: "razorpay",
        event_id: event.id,
        type: event.type,
        payload: JSON.parse(rawBody),
      },
      { onConflict: "provider,event_id", ignoreDuplicates: false },
    )
    .select("id, processed_at")
    .single();
  if (storeError) return apiError(500, "Couldn't store event");
  if (stored.processed_at) return json({ ok: true, duplicate: true });

  try {
    if (event.subscriptionId) {
      const remote = await provider.getSubscription(event.subscriptionId);
      const row = await syncSubscription(service, remote);
      if (row && event.payment) await recordPayment(service, row, event.payment);
    }
    await service
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString(), error: null })
      .eq("id", stored.id);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    await service
      .from("webhook_events")
      .update({ error: err instanceof Error ? err.message : String(err) })
      .eq("id", stored.id);
    // A non-2xx response makes Razorpay retry later.
    return apiError(500, "Processing failed");
  }
}
