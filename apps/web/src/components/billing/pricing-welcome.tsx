import { cookies } from "next/headers";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { bestValuePlanId, mostPopularPlanId, PlanCard } from "@/components/marketing/plan-card";
import { paymentsConfigured } from "@/lib/billing";
import { getActivePlans, getFreeModules } from "@/lib/catalog";
import { firstFreeHref, freeShort } from "@/lib/free-modules";
import { PricingPopup } from "./pricing-popup";
import { PRICING_SEEN_COOKIE } from "./pricing-seen";

/**
 * The plans in a big window, shown once on a student's first visit to the home
 * page. Render it only for students who don't already have access.
 */
export async function PricingWelcome({ userId }: { userId: string }) {
  const cookieStore = await cookies();
  if (cookieStore.get(PRICING_SEEN_COOKIE)?.value === userId) return null;

  const [plans, freeModules] = await Promise.all([getActivePlans(), getFreeModules()]);
  const freeHref = firstFreeHref(freeModules);
  if (plans.length === 0) return null;

  const monthly = plans.find((p) => p.interval === "month" && p.billing_months === 1) ?? null;
  const monthlyPaise = monthly?.price_paise ?? null;
  const bestValue = bestValuePlanId(plans, monthlyPaise);
  const popular = mostPopularPlanId(plans);
  const canPay = paymentsConfigured();

  return (
    <PricingPopup
      userId={userId}
      freeLink={
        freeHref ? { href: freeHref, label: `${freeShort(freeModules)}, no payment` } : null
      }
    >
      {plans.map((plan, i) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          index={i}
          monthlyPricePaise={monthlyPaise}
          featured={plan.id === (bestValue ?? monthly?.id)}
          popular={plan.id === popular}
          compact
          cta={
            canPay && plan.interval === "month" && plan.razorpay_plan_id
              ? { node: <SubscribeButton planId={plan.id} /> }
              : { href: "/pricing", label: "See plan details" }
          }
        />
      ))}
    </PricingPopup>
  );
}
