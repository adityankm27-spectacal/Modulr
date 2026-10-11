import { z } from "zod";
import { apiError, json, readJson } from "@/lib/api";
import { getViewer } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/billing";
import { grantsAccess } from "@/lib/billing/queries";
import { PaymentProviderError } from "@/lib/billing/types";
import { getSettings } from "@/lib/catalog";
import { createServiceClient } from "@/lib/supabase/service";

const body = z.object({ planId: z.uuid() });

/** A checkout the student opened but didn't finish is reused for this long. */
const REUSE_CHECKOUT_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/billing/subscribe (spec §9): creates a Razorpay subscription for
 * the viewer and returns what checkout.js needs. Subscription rows are written
 * with the service client; students can only read their own (RLS).
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return apiError(401, "Sign in to subscribe.");

  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "Invalid request.");

  let provider;
  try {
    provider = getPaymentProvider();
  } catch {
    return apiError(503, "Payments aren't available yet. Please try again later.");
  }

  const service = createServiceClient();
  const [{ data: plan, error: planError }, { data: subs, error: subsError }, settings] =
    await Promise.all([
      service
        .from("plans")
        .select("id, name, interval, razorpay_plan_id, is_active")
        .eq("id", parsed.data.planId)
        .maybeSingle(),
      service
        .from("subscriptions")
        .select(
          "id, plan_id, status, provider_subscription_id, current_period_end, grace_until, created_at",
        )
        .eq("user_id", viewer.userId)
        .order("created_at", { ascending: false }),
      getSettings(),
    ]);
  if (planError || subsError) return apiError(500, "Couldn't start checkout.");
  if (!plan || !plan.is_active || plan.interval !== "month") {
    return apiError(404, "That plan isn't available.");
  }
  if (!plan.razorpay_plan_id) return apiError(503, "This plan isn't open for payments yet.");

  const current = subs.find((s) => grantsAccess(s, settings["billing.grace_days"]));
  if (current) {
    return apiError(
      409,
      current.status === "active"
        ? "You already have an active plan."
        : "Your current plan is still running. You can subscribe again once it ends.",
    );
  }

  const checkout = (subscriptionId: string) =>
    json({
      keyId: provider.publicKey,
      subscriptionId,
      planName: plan.name,
      prefill: { email: viewer.email ?? undefined, name: viewer.profile?.full_name ?? undefined },
    });

  // Reopening checkout reuses the last unfinished one, so two tabs can't create two mandates.
  const pending = subs.find(
    (s) =>
      s.status === "created" &&
      s.plan_id === plan.id &&
      s.provider_subscription_id &&
      Date.now() - new Date(s.created_at).getTime() < REUSE_CHECKOUT_MS,
  );
  if (pending?.provider_subscription_id) return checkout(pending.provider_subscription_id);

  try {
    const remote = await provider.createSubscription({
      providerPlanId: plan.razorpay_plan_id,
      notes: { user_id: viewer.userId, plan_id: plan.id },
    });
    const { error } = await service.from("subscriptions").insert({
      user_id: viewer.userId,
      plan_id: plan.id,
      provider: "razorpay",
      provider_subscription_id: remote.id,
      status: remote.status,
    });
    if (error) throw new Error(`Couldn't save subscription ${remote.id}: ${error.message}`);
    return checkout(remote.id);
  } catch (err) {
    console.error(err);
    return apiError(
      err instanceof PaymentProviderError ? 502 : 500,
      "Couldn't start checkout. Please try again.",
    );
  }
}
