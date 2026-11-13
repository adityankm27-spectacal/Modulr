import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getBilling } from "@/lib/billing/queries";
import { formatDate, formatPrice } from "@/lib/format";
import { CancelSubscriptionButton } from "./cancel-button";

type Billing = Awaited<ReturnType<typeof getBilling>>;
type Subscription = NonNullable<Billing["subscription"]>;

const card =
  "space-y-4 rounded-3xl border-[3px] border-line bg-card p-5 shadow-[0_5px_0_0_var(--line)] sm:p-6";

function describe(sub: Subscription, hasAccess: boolean): { badge: string; line: string | null } {
  const end = sub.current_period_end ? formatDate(sub.current_period_end) : null;
  switch (sub.status) {
    case "active":
      return { badge: "Active", line: "Every module of every subject is unlocked." };
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
      // Cancelling stops future charges but keeps the period already paid for.
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
  const { subscription, hasSubscriptionAccess } = await getBilling(userId);
  const comp = compAccessUntil && new Date(compAccessUntil) > new Date() ? compAccessUntil : null;
  const status = subscription ? describe(subscription, hasSubscriptionAccess) : null;
  const canCancel =
    subscription &&
    !subscription.cancel_at_period_end &&
    ["active", "pending", "halted"].includes(subscription.status);

  return (
    <section aria-labelledby="billing-heading" className="space-y-5">
      <h2 id="billing-heading" className="text-2xl">
        Plan and billing
      </h2>

      {justSubscribed && hasSubscriptionAccess ? (
        <p className="flex items-start gap-2 rounded-2xl border-[3px] border-line bg-mint p-4 font-bold text-ink">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          You&apos;re subscribed. Every module of every subject is unlocked.
        </p>
      ) : null}

      {comp ? (
        <p className="rounded-2xl bg-muted p-4">
          You have free access until <strong>{formatDate(comp)}</strong>.
        </p>
      ) : null}

      {subscription && status ? (
        <div className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {subscription.plans ? (
                <p className="font-display text-3xl font-black">
                  {formatPrice(subscription.plans.price_paise)}
                  <span className="font-sans text-sm font-bold text-muted-foreground">
                    {" "}
                    / month
                  </span>
                </p>
              ) : null}
              <p className="mt-1 text-muted-foreground">
                {subscription.plans?.name ?? "Your"} plan
              </p>
            </div>
            <Badge variant={hasSubscriptionAccess ? "free" : "neutral"}>{status.badge}</Badge>
          </div>
          {status.line ? <p>{status.line}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            {canCancel ? (
              <CancelSubscriptionButton
                accessUntil={
                  subscription.current_period_end
                    ? formatDate(subscription.current_period_end)
                    : null
                }
              />
            ) : null}
            {!hasSubscriptionAccess ? (
              <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
                See plans
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={card}>
          <p className="font-display text-2xl font-black">No plan yet</p>
          <p className="text-muted-foreground">
            Subscribe to unlock every module of every subject.
          </p>
          <Link href="/pricing" className={buttonVariants({ variant: "sunflower" })}>
            See plans
          </Link>
        </div>
      )}
    </section>
  );
}
