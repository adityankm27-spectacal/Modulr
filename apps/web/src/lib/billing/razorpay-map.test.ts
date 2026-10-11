import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  checkoutSignature,
  mapSubscriptionStatus,
  parseWebhookBody,
  toProviderPayment,
  toProviderSubscription,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "./razorpay-map";

const hmac = (secret: string, s: string) => createHmac("sha256", secret).update(s).digest("hex");

describe("Razorpay signatures", () => {
  it("signs checkout as payment_id|subscription_id with the key secret", () => {
    expect(checkoutSignature("sec", "pay_1", "sub_1")).toBe(hmac("sec", "pay_1|sub_1"));
  });

  it("verifies checkout only for the same ids and secret", () => {
    const signature = hmac("sec", "pay_1|sub_1");
    const ok = { paymentId: "pay_1", subscriptionId: "sub_1", signature };
    expect(verifyCheckoutSignature("sec", ok)).toBe(true);
    expect(verifyCheckoutSignature("other", ok)).toBe(false);
    expect(verifyCheckoutSignature("sec", { ...ok, subscriptionId: "sub_2" })).toBe(false);
    expect(verifyCheckoutSignature("sec", { ...ok, signature: "nope" })).toBe(false);
  });

  it("verifies webhooks against the exact raw body", () => {
    const body = '{"event":"subscription.charged"}';
    expect(verifyWebhookSignature("wh", body, hmac("wh", body))).toBe(true);
    expect(verifyWebhookSignature("wh", `${body} `, hmac("wh", body))).toBe(false);
    expect(verifyWebhookSignature("wh", body, "")).toBe(false);
  });
});

describe("Razorpay mapping", () => {
  it("maps subscription states onto Modulr's", () => {
    expect(mapSubscriptionStatus("created")).toBe("created");
    expect(mapSubscriptionStatus("authenticated")).toBe("created");
    expect(mapSubscriptionStatus("active")).toBe("active");
    expect(mapSubscriptionStatus("pending")).toBe("pending");
    expect(mapSubscriptionStatus("halted")).toBe("halted");
    expect(mapSubscriptionStatus("paused")).toBe("halted");
    expect(mapSubscriptionStatus("cancelled")).toBe("cancelled");
    expect(mapSubscriptionStatus("completed")).toBe("completed");
    expect(mapSubscriptionStatus("expired")).toBe("expired");
    expect(mapSubscriptionStatus("weird")).toBeNull();
  });

  it("reads subscription periods from unix seconds", () => {
    const sub = toProviderSubscription({
      id: "sub_1",
      status: "active",
      current_start: 1_790_000_000,
      current_end: 1_792_592_000,
    });
    expect(sub.currentPeriodStart?.toISOString()).toBe(new Date(1_790_000_000_000).toISOString());
    expect(sub.currentPeriodEnd?.getTime()).toBe(1_792_592_000_000);
    expect(toProviderSubscription({ id: "sub_2", status: "created", current_end: null })).toEqual({
      id: "sub_2",
      status: "created",
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
    expect(() => toProviderSubscription({ id: "sub_3", status: "weird" })).toThrow();
  });

  it("reads payments, with a paid date only once captured", () => {
    const captured = toProviderPayment({
      id: "pay_1",
      amount: 10000,
      currency: "INR",
      status: "captured",
      method: "upi",
      created_at: 1_790_000_000,
    });
    expect(captured).toMatchObject({ amountPaise: 10000, status: "captured", method: "upi" });
    expect(captured.paidAt?.getTime()).toBe(1_790_000_000_000);
    expect(
      toProviderPayment({ id: "pay_2", amount: 10000, status: "failed", created_at: 1 }).paidAt,
    ).toBeNull();
  });

  it("parses webhook bodies, falling back to a body hash for the event id", () => {
    const raw = JSON.stringify({
      event: "subscription.charged",
      payload: {
        subscription: { entity: { id: "sub_1", status: "active" } },
        payment: { entity: { id: "pay_1", amount: 10000, status: "captured", created_at: 5 } },
      },
    });
    const event = parseWebhookBody(raw, "evt_1");
    expect(event).toMatchObject({
      id: "evt_1",
      type: "subscription.charged",
      subscriptionId: "sub_1",
    });
    expect(event.payment?.id).toBe("pay_1");
    expect(parseWebhookBody(raw, null).id).toBe(parseWebhookBody(raw, null).id);
    expect(parseWebhookBody(raw, null).id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("skips payments in unknown states instead of failing the event", () => {
    const raw = JSON.stringify({
      event: "subscription.charged",
      payload: {
        subscription: { entity: { id: "sub_1" } },
        payment: { entity: { id: "pay_1", amount: 1, status: "mystery" } },
      },
    });
    expect(parseWebhookBody(raw, "evt").payment).toBeNull();
  });
});
