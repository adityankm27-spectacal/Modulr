import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { PlanCard } from "@/components/marketing/plan-card";
import { getViewer } from "@/lib/auth";
import { getActivePlans, getSettings } from "@/lib/catalog";
import { faqItems } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Module 1 of every subject is free. Unlock every module with one simple plan.",
};

export default async function PricingPage() {
  const [viewer, plans, settings] = await Promise.all([
    getViewer(),
    getActivePlans(),
    getSettings(),
  ]);
  const monthly = plans.find((p) => p.interval === "month" && p.scope === "all") ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:py-20">
      <h1 className="text-4xl sm:text-6xl">Pricing</h1>
      <p className="mt-4 max-w-prose text-lg text-muted-foreground">
        Module 1 of every subject is free once you sign in. Upgrade to unlock every module.
      </p>

      {plans.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-muted p-6 text-muted-foreground">
          Plans will be announced soon.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              featured={plan.id === monthly?.id}
              cta={
                viewer
                  ? { disabledLabel: "Payments open soon" }
                  : { href: "/sign-in?next=%2Fpricing", label: "Start free" }
              }
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
