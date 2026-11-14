import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatInterval, formatPrice } from "@/lib/format";
import { formatPerDay, planValue } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export interface PlanCardPlan {
  id: string;
  name: string;
  description: string | null;
  price_paise: number;
  interval: "month" | "one_time";
  billing_months: number;
  scope: "all" | "subject" | "semester";
  validity_days: number | null;
}

const SCOPE_LABEL = {
  all: "Every subject, every module",
  subject: "One subject, every module",
  semester: "Every subject in one semester",
} as const;

const INCLUDED = [
  "Animated explainer videos",
  "One-page short notes with memory tricks",
  "Formula sheets with symbol meanings",
  "Solved PYQs, important questions and viva prep",
];

/** The plan with the biggest saving against paying monthly, if any plan saves at all. */
export function bestValuePlanId(plans: PlanCardPlan[], monthlyPricePaise: number | null) {
  let best: { id: string; discount: number } | null = null;
  for (const plan of plans) {
    if (plan.interval !== "month") continue;
    const { discountPercent } = planValue(plan.price_paise, plan.billing_months, monthlyPricePaise);
    if (discountPercent && (!best || discountPercent > best.discount)) {
      best = { id: plan.id, discount: discountPercent };
    }
  }
  return best?.id ?? null;
}

export function PlanCard({
  plan,
  monthlyPricePaise = null,
  featured = false,
  index = 0,
  cta,
}: {
  plan: PlanCardPlan;
  /** Price of the monthly plan, to show what a longer plan saves. */
  monthlyPricePaise?: number | null;
  featured?: boolean;
  index?: number;
  cta: { href: string; label: string } | { disabledLabel: string } | { node: ReactNode };
}) {
  const recurring = plan.interval === "month";
  const value = recurring
    ? planValue(plan.price_paise, plan.billing_months, monthlyPricePaise)
    : null;

  return (
    <article
      style={{ animationDelay: `${index * 90}ms` }}
      className={cn(
        "relative flex flex-col rounded-[1.75rem] border-[3px] border-line bg-card p-6 transition-[translate,box-shadow] duration-200 hover:-translate-y-1.5 motion-safe:animate-rise sm:p-8",
        featured
          ? "shadow-[0_10px_0_0_var(--color-cobalt)] hover:shadow-[0_16px_0_0_var(--color-cobalt)] lg:-my-4 lg:py-12"
          : "shadow-[0_6px_0_0_var(--line)] hover:shadow-[0_12px_0_0_var(--line)]",
      )}
    >
      {featured ? (
        <span className="absolute -top-5 left-1/2 inline-flex -translate-x-1/2 -rotate-2 items-center gap-1.5 rounded-full border-[3px] border-line bg-sunflower px-4 py-1.5 text-sm font-extrabold whitespace-nowrap text-ink shadow-[0_4px_0_0_var(--line)] motion-safe:animate-bob">
          <Sparkles className="size-4" aria-hidden="true" />
          Best value
        </span>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <h3 className="font-sans text-lg font-extrabold tracking-normal">{plan.name}</h3>
        {value?.discountPercent ? (
          <span className="rounded-full border-[3px] border-line bg-mint px-3 py-0.5 text-sm font-extrabold text-ink motion-safe:animate-pop">
            Save {value.discountPercent}%
          </span>
        ) : null}
      </div>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-5xl font-black">{formatPrice(plan.price_paise)}</span>
        {value?.fullPricePaise ? (
          <s className="text-lg font-bold text-muted-foreground decoration-red decoration-2">
            <span className="sr-only">instead of </span>
            {formatPrice(value.fullPricePaise)}
          </s>
        ) : null}
        <span className="w-full text-muted-foreground">
          {formatInterval(plan.interval, plan.validity_days, plan.billing_months)}
        </span>
      </p>

      {value ? (
        <p className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-2xl border-[3px] border-line px-3 py-1 font-extrabold",
              featured ? "bg-cobalt text-white" : "bg-accent text-accent-foreground",
            )}
          >
            Just {formatPerDay(value.perDayPaise)}/day
          </span>
          {plan.billing_months > 1 ? (
            <span className="text-sm font-bold text-muted-foreground">
              ≈ {formatPrice(Math.round(value.perMonthPaise / 100) * 100)}/month
            </span>
          ) : null}
        </p>
      ) : null}

      <p className="mt-5 font-bold">{SCOPE_LABEL[plan.scope]}</p>
      {plan.description ? <p className="mt-1 text-muted-foreground">{plan.description}</p> : null}
      <ul className="mt-6 flex-1 space-y-3">
        {INCLUDED.map((item) => (
          <li key={item} className="flex gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        {"node" in cta ? (
          cta.node
        ) : "href" in cta ? (
          <Link
            href={cta.href}
            className={buttonVariants({
              size: "lg",
              block: true,
              variant: featured ? "primary" : "outline",
            })}
          >
            {cta.label}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants({ size: "lg", block: true }),
              "pointer-events-none opacity-60",
            )}
          >
            {cta.disabledLabel}
          </span>
        )}
      </div>
    </article>
  );
}
