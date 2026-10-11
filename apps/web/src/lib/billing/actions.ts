"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import type { ActionState } from "@/lib/admin/state";
import { getPaymentProvider } from "@/lib/billing";
import { syncSubscription } from "@/lib/billing/sync";
import { createServiceClient } from "@/lib/supabase/service";

const fail = (message: string): ActionState => ({ status: "error", message, at: Date.now() });

/**
 * Cancels the viewer's running subscription. Razorpay cancels at once so
 * nothing more is charged; access continues until the paid period ends
 * (has_subject_access counts cancelled subscriptions until then).
 */
export async function cancelSubscription(): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) return fail("Sign in again to manage your plan.");

  const service = createServiceClient();
  const { data: sub, error } = await service
    .from("subscriptions")
    .select("id, provider_subscription_id")
    .eq("user_id", viewer.userId)
    .in("status", ["active", "pending", "halted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return fail("Couldn't load your plan. Please try again.");
  if (!sub?.provider_subscription_id) return fail("You don't have a plan to cancel.");

  try {
    const remote = await getPaymentProvider().cancelSubscription(sub.provider_subscription_id);
    await syncSubscription(service, remote);
    await service.from("subscriptions").update({ cancel_at_period_end: true }).eq("id", sub.id);
  } catch (err) {
    console.error(err);
    return fail("Couldn't cancel right now. Please try again, or contact support.");
  }

  revalidatePath("/account");
  return {
    status: "ok",
    message: "Your plan is cancelled. You won't be charged again.",
    at: Date.now(),
  };
}
