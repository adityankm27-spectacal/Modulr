import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getBilling } from "@/lib/billing/queries";
import { formatDate, formatPrice } from "@/lib/format";
import { CancelSubscriptionButton } from "./cancel-button";

type Billing = Awaited<ReturnType<typeof getBilling>>;
type Subscription = NonNullable<Billing["subscription"]>;

const PAYMENT_LABEL = {
  created: "Started",
  authorized: "Processing",
  captured: "Paid",
  failed: "Failed",
  refunded: "Refunded",
} as const;

function describe(sub: Subscription, hasAccess: boolean): { badge: string; line: string | null } {
  const end = sub.current_period_end ? formatDate(sub.current_period_end) : null;
  switch (sub.status) {
    case "active":
      return { badge: "Active", line: end ? `Renews on ${end}.` : null };
    case "pending":
      return {
        badge: "Payment due",
        line: "Your last renewal didn't go through. Razorpay will retry automatically; check your UPI app or card.",
      };
    case "halted":
      return {
        badge: "Paused",
        line: "Renewals failed several times, so the plan is paused. Subscribe again to unlock every module.",
      };
    case "cancelled":
      return hasAccess
        ? { badge: "Cancelled", line: end ? `You keep access until ${end}.` : null }
        : { badge: "Ended", line: end ? `Ended on ${end}.` : null };
    default:
      return { badge: "Ended", line: end ? `Ended on ${end}.` : null };
  }
}

export async function BillingSection({
  userId,
  compAccessUntil,
  justSubscribed,
}: {
  userId: string;
  compAccessUntil: string | null;
  justSubscribed: boolean;
}) {
  const { subscription, hasSubscriptionAccess, payments } = await getBilling(userId);
  const comp = compAccessUntil && new Date(compAccessUntil) > new Date() ? compAccessUntil : null;
  const status = subscription ? describe(subscription, hasSubscriptionAccess) : null;
  const canCancel =
    subscription &&
    !subscription.cancel_at_period_end &&
    ["active", "pending", "halted"].includes(subscription.status);

  return (
    <section aria-labelledby="billing-heading" className="space-y-5 border-t pt-8">
      <h2 id="billing-heading" className="text-xl">
        Plan and billing
      </h2>

      {justSubscribed && hasSubscriptionAccess ? (
        <p className="flex items-start gap-2 rounded-2xl bg-mint/20 p-4 font-semibold">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          You&apos;re subscribed. Every module of every subject is unlocked.
        </p>
      ) : null}

      {comp ? (
        <p className="rounded-2xl bg-muted p-4">
          You have free access until <strong>{formatDate(comp)}</strong>.
        </p>
      ) : null}

      {subscription && status ? (
        <div className="space-y-3 rounded-2xl border-2 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">
              {subscription.plans?.name ?? "Plan"}
              {subscription.plans ? (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {formatPrice(subscription.plans.price_paise)}/month
                </span>
              ) : null}
            </p>
            <Badge variant={hasSubscriptionAccess ? "free" : "neutral"}>{status.badge}</Badge>
          </div>
          {status.line ? <p className="text-muted-foreground">{status.line}</p> : null}
          {canCancel ? (
            <CancelSubscriptionButton
              accessUntil={
                subscription.current_period_end ? formatDate(subscription.current_period_end) : null
              }
            />
          ) : null}
          {!hasSubscriptionAccess ? (
            <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
              See plans
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl bg-muted p-5">
          <p>
            You&apos;re on the free plan: Module 1 of every subject is open. Subscribe to unlock
            every module.
          </p>
          <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
            See plans
          </Link>
        </div>
      )}

      {payments.length > 0 ? (
        <div className="space-y-2">
          <h3 className="font-sans text-base font-extrabold tracking-normal">Payment history</h3>
          <ul className="divide-y rounded-2xl border-2">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="block font-bold">{formatDate(p.paid_at ?? p.created_at)}</span>
                  <span className="text-muted-foreground">
                    {p.method ? `${p.method.toUpperCase()} · ` : ""}
                    {p.provider_payment_id}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-bold">{formatPrice(p.amount_paise)}</span>
                  <span className="text-muted-foreground">{PAYMENT_LABEL[p.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
