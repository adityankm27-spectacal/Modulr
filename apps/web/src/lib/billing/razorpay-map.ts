import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentStatus,
  ProviderPayment,
  ProviderSubscription,
  SubscriptionStatus,
  WebhookEvent,
} from "./types";

/**
 * Pure Razorpay helpers (signatures and entity mapping), kept apart from the
 * HTTP adapter so they can be unit-tested.
 */

const hmacHex = (secret: string, input: string) =>
  createHmac("sha256", secret).update(input).digest("hex");

function safeEqualHex(expected: string, given: string): boolean {
  const x = Buffer.from(expected);
  const y = Buffer.from(given);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout success: hmac_sha256(payment_id + "|" + subscription_id, key_secret). */
export function checkoutSignature(keySecret: string, paymentId: string, subscriptionId: string) {
  return hmacHex(keySecret, `${paymentId}|${subscriptionId}`);
}

export function verifyCheckoutSignature(
  keySecret: string,
  input: { paymentId: string; subscriptionId: string; signature: string },
): boolean {
  return safeEqualHex(
    checkoutSignature(keySecret, input.paymentId, input.subscriptionId),
    input.signature,
  );
}

/** Webhooks: X-Razorpay-Signature = hmac_sha256(raw body, webhook_secret). */
export function verifyWebhookSignature(secret: string, rawBody: string, signature: string) {
  return safeEqualHex(hmacHex(secret, rawBody), signature);
}

/**
 * Razorpay subscription states → Modulr's. `authenticated` (mandate set up,
 * first charge not yet confirmed) grants nothing yet; `paused` is treated like
 * `halted` (no access).
 */
export function mapSubscriptionStatus(status: string): SubscriptionStatus | null {
  switch (status) {
    case "created":
    case "authenticated":
      return "created";
    case "active":
    case "pending":
    case "halted":
    case "cancelled":
    case "completed":
    case "expired":
      return status;
    case "paused":
      return "halted";
    default:
      return null;
  }
}

export function mapPaymentStatus(status: string): PaymentStatus | null {
  switch (status) {
    case "created":
    case "authorized":
    case "captured":
    case "failed":
    case "refunded":
      return status;
    default:
      return null;
  }
}

const fromUnix = (value: unknown) =>
  typeof value === "number" && value > 0 ? new Date(value * 1000) : null;

type Entity = Record<string, unknown>;

export function toProviderSubscription(entity: Entity): ProviderSubscription {
  const status = mapSubscriptionStatus(String(entity.status));
  if (typeof entity.id !== "string" || !status) {
    throw new Error(
      `Unexpected Razorpay subscription: ${String(entity.id)} ${String(entity.status)}`,
    );
  }
  return {
    id: entity.id,
    status,
    currentPeriodStart: fromUnix(entity.current_start),
    currentPeriodEnd: fromUnix(entity.current_end),
  };
}

export function toProviderPayment(entity: Entity): ProviderPayment {
  const status = mapPaymentStatus(String(entity.status));
  if (typeof entity.id !== "string" || typeof entity.amount !== "number" || !status) {
    throw new Error(`Unexpected Razorpay payment: ${String(entity.id)} ${String(entity.status)}`);
  }
  return {
    id: entity.id,
    amountPaise: entity.amount,
    currency: typeof entity.currency === "string" ? entity.currency : "INR",
    status,
    method: typeof entity.method === "string" ? entity.method : null,
    paidAt: status === "captured" || status === "refunded" ? fromUnix(entity.created_at) : null,
  };
}

/**
 * Parses a webhook body whose signature was already verified. The event id
 * comes from the X-Razorpay-Event-Id header; a hash of the body stands in if
 * it is ever missing, so redeliveries still dedupe.
 */
export function parseWebhookBody(rawBody: string, eventIdHeader: string | null): WebhookEvent {
  const body = JSON.parse(rawBody) as {
    event?: unknown;
    payload?: {
      subscription?: { entity?: Entity };
      payment?: { entity?: Entity };
    };
  };
  const subscription = body.payload?.subscription?.entity;
  const payment = body.payload?.payment?.entity;
  return {
    id: eventIdHeader || createHash("sha256").update(rawBody).digest("hex"),
    type: typeof body.event === "string" ? body.event : "unknown",
    subscriptionId: typeof subscription?.id === "string" ? subscription.id : null,
    payment: payment ? tryPayment(payment) : null,
  };
}

/** A payment in a state Modulr doesn't track is skipped rather than failing the whole event. */
function tryPayment(entity: Entity): ProviderPayment | null {
  try {
    return toProviderPayment(entity);
  } catch {
    return null;
  }
}
