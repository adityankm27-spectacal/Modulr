"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { CheckoutPauseContext } from "./checkout-pause";
import { PRICING_SEEN_COOKIE } from "./pricing-seen";

/**
 * A big window with the plans, shown over the home page. It opens by itself,
 * records that this student has seen it (so it never opens again), and closes
 * with the X, the Esc key, a click outside, or "Maybe later". The native
 * <dialog> element keeps focus inside it and returns it afterwards.
 */
export function PricingPopup({
  userId,
  freeLink,
  children,
}: {
  userId: string;
  /** A free module the student can open instead of subscribing now. */
  freeLink?: { href: string; label: string } | null;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    try {
      document.cookie = `${PRICING_SEEN_COOKIE}=${encodeURIComponent(userId)}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Without the cookie the popup just shows again next time.
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [userId]);

  function close() {
    ref.current?.close();
  }

  // While Razorpay's checkout is open the popup hides, then comes back if they cancel.
  const checkout = {
    pause: () => ref.current?.close(),
    resume: () => {
      const dialog = ref.current;
      if (!dialog || dialog.open) return;
      dialog.showModal();
      document.body.style.overflow = "hidden";
    },
  };

  return (
    <CheckoutPauseContext value={checkout}>
      <dialog
        ref={ref}
        aria-labelledby="pricing-popup-title"
        onClose={() => {
          document.body.style.overflow = "";
        }}
        // Clicks on the dimmed area outside the window land on the <dialog> itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-auto max-h-[94dvh] w-[min(96vw,76rem)] overflow-y-auto overscroll-contain rounded-[2rem] border-[3px] border-line bg-background p-0 text-foreground shadow-[0_10px_0_0_var(--line)] backdrop:bg-ink/70 open:motion-safe:animate-pop"
      >
        <div className="relative px-5 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full border-[3px] border-line bg-card shadow-[0_3px_0_0_var(--line)] transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--line)] active:translate-y-0.5 active:shadow-none sm:top-6 sm:right-6"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-block -rotate-2 rounded-full border-[3px] border-line bg-mint px-4 py-1.5 text-sm font-extrabold text-ink">
              Welcome to Modulr
            </p>
            <h2 id="pricing-popup-title" className="mt-5 text-4xl font-black sm:text-6xl">
              Unlock every module
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Animated videos, one-page notes, formula sheets and solved PYQs for every subject.
              Pick a plan, and cancel any time.
            </p>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-6">
            {children}
          </div>

          <div className="mt-10 flex flex-col items-center gap-1 text-center">
            {freeLink ? (
              <Link
                href={freeLink.href}
                className="mb-2 inline-flex min-h-11 items-center rounded-full border-[3px] border-line bg-mint px-5 font-extrabold text-ink shadow-[0_4px_0_0_var(--line)] transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--line)] active:translate-y-0.5 active:shadow-none"
              >
                {freeLink.label}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center rounded-full px-5 font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
        </div>
      </dialog>
    </CheckoutPauseContext>
  );
}
