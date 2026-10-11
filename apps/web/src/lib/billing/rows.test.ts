import { subscriptionGrantsAccess, type SubscriptionStatus } from "@modulr/shared";
import { describe, expect, it } from "vitest";
import { paymentRow, subscriptionPatch } from "./rows";
import type { ProviderSubscription } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const start = new Date(Date.UTC(2026, 9, 1));
const end = new Date(start.getTime() + 30 * DAY);

/** Applies a sequence of provider states to a stored row, as the webhook does. */
function replay(states: ProviderSubscription[]) {
  let row: {
    status: SubscriptionStatus;
    current_period_start: string | null;
    current_period_end: string | null;
  } = { status: "created", current_period_start: null, current_period_end: null };
  for (const state of states) row = { ...row, ...subscriptionPatch(state) } as typeof row;
  return row;
}

const remote = (
  status: SubscriptionStatus,
  periodStart: Date | null = start,
  periodEnd: Date | null = end,
): ProviderSubscription => ({
  id: "sub_1",
  status,
  currentPeriodStart: periodStart,
  currentPeriodEnd: periodEnd,
});

function access(row: ReturnType<typeof replay>, now: Date) {
  return subscriptionGrantsAccess(
    {
      status: row.status,
      currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
      graceUntil: null,
    },
    { now, graceDays: 3 },
  );
}

describe("subscription state transitions", () => {
  it("activation opens access for the paid period", () => {
    const row = replay([remote("created", null, null), remote("active")]);
    expect(row).toEqual({
      status: "active",
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
    });
    expect(access(row, new Date(start.getTime() + DAY))).toBe(true);
  });

  it("an unfinished checkout grants nothing", () => {
    expect(access(replay([remote("created", null, null)]), start)).toBe(false);
  });

  it("a failed renewal (pending) keeps access until period end plus grace", () => {
    const row = replay([remote("active"), remote("pending")]);
    expect(access(row, new Date(end.getTime() + 2 * DAY))).toBe(true);
    expect(access(row, new Date(end.getTime() + 4 * DAY))).toBe(false);
  });

  it("halted ends access immediately; a later charge restores it with the new period", () => {
    const halted = replay([remote("active"), remote("pending"), remote("halted")]);
    expect(access(halted, start)).toBe(false);
    const nextEnd = new Date(end.getTime() + 30 * DAY);
    const charged = replay([remote("active"), remote("halted"), remote("active", end, nextEnd)]);
    expect(charged.current_period_end).toBe(nextEnd.toISOString());
    expect(access(charged, new Date(end.getTime() + DAY))).toBe(true);
  });

  it("cancelling keeps the paid period even if the provider drops the dates", () => {
    const row = replay([remote("active"), remote("cancelled", null, null)]);
    expect(row.current_period_end).toBe(end.toISOString());
    expect(access(row, new Date(end.getTime() - DAY))).toBe(true);
    expect(access(row, new Date(end.getTime() + 4 * DAY))).toBe(false);
  });

  it("completed and expired subscriptions grant nothing", () => {
    expect(access(replay([remote("active"), remote("completed")]), start)).toBe(false);
    expect(access(replay([remote("active"), remote("expired")]), start)).toBe(false);
  });
});

describe("paymentRow", () => {
  it("links a payment to the subscription and its owner", () => {
    expect(
      paymentRow(
        {
          id: "pay_1",
          amountPaise: 10000,
          currency: "INR",
          status: "captured",
          method: "upi",
          paidAt: start,
        },
        { id: "s1", user_id: "u1" },
      ),
    ).toEqual({
      user_id: "u1",
      subscription_id: "s1",
      provider: "razorpay",
      provider_payment_id: "pay_1",
      amount_paise: 10000,
      currency: "INR",
      status: "captured",
      method: "upi",
      paid_at: start.toISOString(),
    });
  });
});
