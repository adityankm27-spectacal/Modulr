"use client";

import { colors } from "@modulr/shared";
import { Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface CheckoutResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(
    event: "payment.failed",
    handler: (response: { error?: { description?: string } }) => void,
  ): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Razorpay. Check your connection."));
    document.body.appendChild(script);
  });
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Starts a Razorpay subscription checkout (UPI Autopay or card) for a plan,
 * then confirms it with the server before sending the student on.
 */
export function SubscribeButton({
  planId,
  label = "Subscribe",
  successHref = "/account?subscribed=1",
}: {
  planId: string;
  label?: string;
  successHref?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "starting" | "confirming">("idle");
  const [error, setError] = useState<string | null>(null);

  async function confirm(response: CheckoutResponse) {
    setState("confirming");
    const body = {
      paymentId: response.razorpay_payment_id,
      subscriptionId: response.razorpay_subscription_id,
      signature: response.razorpay_signature,
    };
    try {
      // Razorpay activates the subscription a moment after the first charge.
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await post<{ active: boolean }>("/api/billing/verify", body);
        if (result.active) break;
        await wait(2000);
      }
      router.push(successHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't confirm the payment.");
      setState("idle");
    }
  }

  async function start() {
    setError(null);
    setState("starting");
    try {
      const [session] = await Promise.all([
        post<{
          keyId: string;
          subscriptionId: string;
          planName: string;
          prefill: { email?: string; name?: string };
        }>("/api/billing/subscribe", { planId }),
        loadCheckout(),
      ]);
      if (!window.Razorpay) throw new Error("Couldn't load Razorpay. Check your connection.");
      const checkout = new window.Razorpay({
        key: session.keyId,
        subscription_id: session.subscriptionId,
        name: "Modulr",
        description: session.planName,
        prefill: session.prefill,
        theme: { color: colors.cobalt },
        handler: (response: CheckoutResponse) => void confirm(response),
        modal: { ondismiss: () => setState("idle") },
      });
      checkout.on("payment.failed", (response) => {
        setError(response.error?.description ?? "The payment failed. Please try again.");
      });
      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setState("idle");
    }
  }

  return (
    <div className="space-y-2">
      <Button size="lg" block onClick={start} disabled={state !== "idle"}>
        {state !== "idle" ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {state === "confirming" ? "Confirming payment…" : label}
      </Button>
      <p role="status" aria-live="polite" className="min-h-5 text-sm font-semibold">
        {error ? (
          <span className="inline-flex items-start gap-1.5 text-danger-text">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
        ) : null}
      </p>
    </div>
  );
}
