"use server";

import { getPaymentProvider, paymentsConfigured } from "@/lib/billing";
import { PaymentProviderError } from "@/lib/billing/types";
import { AdminError, check, runAdminAction } from "./action";
import type { ActionState } from "./state";
import { planSchema } from "./schemas";

/**
 * Creates or edits a monthly plan. Razorpay plans can't be changed, so a new
 * Razorpay plan is created when the plan has none yet, when its price changes,
 * or on request (e.g. after switching from test to live keys). Existing
 * subscribers stay on the Razorpay plan they signed up with.
 */
export async function savePlan(_: ActionState, form: FormData) {
  return runAdminAction(
    form,
    planSchema,
    async ({ id, price_rupees, new_provider_plan, ...values }, supabase) => {
      const price_paise = price_rupees * 100;
      let existing: { price_paise: number; razorpay_plan_id: string | null } | null = null;
      if (id) {
        const { data, error } = await supabase
          .from("plans")
          .select("price_paise, razorpay_plan_id")
          .eq("id", id)
          .maybeSingle();
        check(error);
        if (!data) throw new AdminError("That plan no longer exists. Reload the page.");
        existing = data;
      }

      const priceChanged = existing !== null && existing.price_paise !== price_paise;
      let razorpay_plan_id = priceChanged ? null : (existing?.razorpay_plan_id ?? null);
      let message = id ? "Plan saved" : "Plan created";

      if (!razorpay_plan_id || new_provider_plan) {
        if (paymentsConfigured()) {
          try {
            razorpay_plan_id = await getPaymentProvider().createPlan({
              name: values.name,
              description: values.description,
              pricePaise: price_paise,
              currency: "INR",
            });
            message += " and created in Razorpay";
          } catch (err) {
            console.error(err);
            throw new AdminError(
              err instanceof PaymentProviderError
                ? `Razorpay didn't accept the plan: ${err.message}`
                : "Couldn't reach Razorpay. Nothing was saved.",
            );
          }
        } else {
          message += ". Set the Razorpay keys and save again to open it for payments";
        }
      }

      const row = {
        ...values,
        price_paise,
        razorpay_plan_id,
        interval: "month" as const,
        scope: "all" as const,
      };
      const { error } = id
        ? await supabase.from("plans").update(row).eq("id", id)
        : await supabase.from("plans").insert(row);
      check(error);
      return `${message}.`;
    },
  );
}
