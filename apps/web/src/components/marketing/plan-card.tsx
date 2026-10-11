import { Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatInterval, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PlanCardPlan {
  id: string;
  name: string;
  description: string | null;
  price_paise: number;
  interval: "month" | "one_time";
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

export function PlanCard({
  plan,
  featured = false,
  cta,
}: {
  plan: PlanCardPlan;
  featured?: boolean;
  cta: { href: string; label: string } | { disabledLabel: string } | { node: ReactNode };
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-3xl border-2 p-6 sm:p-8",
        featured ? "border-primary bg-card shadow-[0_8px_0_0_var(--color-primary)]" : "bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-sans text-lg font-extrabold tracking-normal">{plan.name}</h3>
        {featured ? <Badge variant="highlight">Most popular</Badge> : null}
      </div>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-5xl font-black">{formatPrice(plan.price_paise)}</span>
        <span className="text-muted-foreground">
          {formatInterval(plan.interval, plan.validity_days)}
        </span>
      </p>
      <p className="mt-2 font-bold">{SCOPE_LABEL[plan.scope]}</p>
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
          <Link href={cta.href} className={buttonVariants({ size: "lg", block: true })}>
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
