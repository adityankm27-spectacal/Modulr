import type { Enums } from "@modulr/shared";

export type SubscriptionStatus = Enums<"subscription_status">;
export type PaymentStatus = Enums<"payment_status">;

/** A provider subscription, already mapped to Modulr's states. */
export interface ProviderSubscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

export interface ProviderPayment {
  id: string;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  paidAt: Date | null;
}

/** A verified webhook delivery, reduced to what Modulr acts on. */
export interface WebhookEvent {
  id: string;
  type: string;
  subscriptionId: string | null;
  payment: ProviderPayment | null;
}

/**
 * Everything Modulr needs from a payment provider (spec §7: Razorpay
 * Subscriptions behind one interface, so the vendor can be swapped).
 */
export interface PaymentProvider {
  readonly name: "razorpay";
  /** Public key the browser checkout needs. */
  readonly publicKey: string;
  /** Creates a recurring monthly plan and returns its provider id. Provider plans are immutable. */
  createPlan(plan: {
    name: string;
    description: string | null;
    pricePaise: number;
    currency: string;
  }): Promise<string>;
  createSubscription(input: {
    providerPlanId: string;
    notes: Record<string, string>;
  }): Promise<ProviderSubscription>;
  getSubscription(id: string): Promise<ProviderSubscription>;
  /** Cancels right away so nothing more is charged; access runs to the paid period end. */
  cancelSubscription(id: string): Promise<ProviderSubscription>;
  getPayment(id: string): Promise<ProviderPayment>;
  /** Checks the signature the browser checkout returns after a successful payment. */
  verifyCheckout(input: { paymentId: string; subscriptionId: string; signature: string }): boolean;
  /** Verifies and parses a webhook delivery; null when the signature is wrong. */
  parseWebhook(rawBody: string, headers: Headers): WebhookEvent | null;
}

export class PaymentProviderError extends Error {}
