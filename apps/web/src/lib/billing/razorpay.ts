import "server-only";
import {
  parseWebhookBody,
  toProviderPayment,
  toProviderSubscription,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "./razorpay-map";
import { PaymentProviderError, type PaymentProvider } from "./types";

/**
 * Razorpay Subscriptions adapter (https://razorpay.com/docs/api/payments/subscriptions/).
 * Calls the REST API directly with HTTP Basic auth; the key secret never
 * leaves the server. Checkout runs in the browser with checkout.js.
 */

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string | null;
}

const API = "https://api.razorpay.com/v1";

/** Billing cycles per subscription. Razorpay needs a limit; 120 months is effectively open-ended. */
const TOTAL_COUNT = 120;

export class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay" as const;

  constructor(private readonly config: RazorpayConfig) {}

  get publicKey() {
    return this.config.keyId;
  }

  private async request(method: "GET" | "POST", path: string, body?: unknown) {
    const auth = Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64");
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        authorization: `Basic ${auth}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok || !data) {
      const error = data?.error as { description?: string } | undefined;
      throw new PaymentProviderError(
        `Razorpay ${method} ${path} failed (${response.status}): ${error?.description ?? "no details"}`,
      );
    }
    return data;
  }

  async createPlan(plan: {
    name: string;
    description: string | null;
    pricePaise: number;
    currency: string;
  }) {
    const data = await this.request("POST", "/plans", {
      period: "monthly",
      interval: 1,
      item: {
        name: plan.name,
        amount: plan.pricePaise,
        currency: plan.currency,
        ...(plan.description ? { description: plan.description } : {}),
      },
    });
    if (typeof data.id !== "string")
      throw new PaymentProviderError("Razorpay returned no plan id.");
    return data.id;
  }

  async createSubscription(input: { providerPlanId: string; notes: Record<string, string> }) {
    return toProviderSubscription(
      await this.request("POST", "/subscriptions", {
        plan_id: input.providerPlanId,
        total_count: TOTAL_COUNT,
        quantity: 1,
        customer_notify: 1,
        notes: input.notes,
      }),
    );
  }

  async getSubscription(id: string) {
    return toProviderSubscription(
      await this.request("GET", `/subscriptions/${encodeURIComponent(id)}`),
    );
  }

  async cancelSubscription(id: string) {
    return toProviderSubscription(
      await this.request("POST", `/subscriptions/${encodeURIComponent(id)}/cancel`, {
        cancel_at_cycle_end: 0,
      }),
    );
  }

  async getPayment(id: string) {
    return toProviderPayment(await this.request("GET", `/payments/${encodeURIComponent(id)}`));
  }

  verifyCheckout(input: { paymentId: string; subscriptionId: string; signature: string }) {
    return verifyCheckoutSignature(this.config.keySecret, input);
  }

  parseWebhook(rawBody: string, headers: Headers) {
    const secret = this.config.webhookSecret;
    const signature = headers.get("x-razorpay-signature");
    if (!secret || !signature || !verifyWebhookSignature(secret, rawBody, signature)) return null;
    return parseWebhookBody(rawBody, headers.get("x-razorpay-event-id"));
  }
}
