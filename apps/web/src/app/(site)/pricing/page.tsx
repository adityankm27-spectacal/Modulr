import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import {
  bestValuePlanId,
  mostPopularPlanId,
  PlanCard,
  type PlanCardPlan,
} from "@/components/marketing/plan-card";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { getViewer } from "@/lib/auth";
import { paymentsConfigured } from "@/lib/billing";
import { getBilling } from "@/lib/billing/queries";
import { getActivePlans, getSettings } from "@/lib/catalog";
import { faqItems } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Every module of every subject. Pay monthly, or save with a longer plan.",
};

export default async function PricingPage() {
  const [viewer, plans, settings] = await Promise.all([
    getViewer(),
    getActivePlans(),
    getSettings(),
  ]);
  const monthly =
    plans.find((p) => p.interval === "month" && p.billing_months === 1 && p.scope === "all") ??
    null;
  const bestValue = bestValuePlanId(plans, monthly?.price_paise ?? null);
  const popular = mostPopularPlanId(plans);
  const billing = viewer ? await getBilling(viewer.userId) : null;
  const canPay = paymentsConfigured();

  function cta(plan: PlanCardPlan & { razorpay_plan_id: string | null }) {
    if (!viewer) return { href: "/sign-in?next=%2Fpricing", label: "Get started" };
    if (billing?.hasSubscriptionAccess) return { href: "/account", label: "Manage your plan" };
    if (canPay && plan.interval === "month" && plan.razorpay_plan_id) {
      return { node: <SubscribeButton planId={plan.id} /> };
    }
    return { disabledLabel: "Payments open soon" };
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:py-20">
      <h1 className="text-4xl sm:text-6xl">Pricing</h1>
      <p className="mt-4 max-w-prose text-lg text-muted-foreground">
        Every plan unlocks every module of every subject. Pay monthly, or pay for a few months at
        once and save. Cancel any time.
      </p>

      {plans.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-muted p-6 text-muted-foreground">
          Plans will be announced soon.
        </p>
      ) : (
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-6">
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              monthlyPricePaise={monthly?.price_paise ?? null}
              featured={plan.id === (bestValue ?? monthly?.id)}
              popular={plan.id === popular}
              cta={cta(plan)}
            />
          ))}
        </div>
      )}

      <section className="mt-16 max-w-3xl" aria-labelledby="pricing-faq">
        <h2 id="pricing-faq" className="text-2xl sm:text-3xl">
          Questions
        </h2>
        <div className="mt-6">
          <Faq items={faqItems(settings, monthly?.price_paise ?? null)} />
        </div>
      </section>
    </main>
  );
}
