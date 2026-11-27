"use client";

import {
  Clapperboard,
  History,
  Mic,
  NotebookText,
  RefreshCcw,
  ShieldCheck,
  Sigma,
  Smartphone,
  X,
} from "lucide-react";
import { IntentLink as Link } from "@/components/intent-link";
import { useEffect, useRef, type ReactNode } from "react";
import { CheckoutPauseContext } from "./checkout-pause";
import { PRICING_SEEN_COOKIE } from "./pricing-seen";

const HIGHLIGHTS = [
  { icon: Clapperboard, label: "Animated videos", tint: "bg-sunflower" },
  { icon: NotebookText, label: "One-page notes", tint: "bg-mint" },
  { icon: Sigma, label: "Formula sheets", tint: "bg-pink" },
  { icon: History, label: "Solved PYQs", tint: "bg-periwinkle text-white" },
  { icon: Mic, label: "Viva prep", tint: "bg-orange" },
] as const;

const TRUST = [
  { icon: ShieldCheck, label: "Secure payments by Razorpay" },
  { icon: Smartphone, label: "UPI Autopay or card" },
  { icon: RefreshCcw, label: "Cancel any time, in one click" },
] as const;

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
        <div className="relative isolate px-5 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
          {/* Decoration only: a faint dot grid and a few shapes drifting about. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute inset-0 [background-image:radial-gradient(var(--line)_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-[0.07]" />
            <div className="absolute -top-10 -left-10 size-36 rounded-full border-[3px] border-line bg-sunflower motion-safe:animate-drift sm:size-44" />
            <div className="absolute top-24 -right-8 hidden size-20 rotate-12 rounded-2xl border-[3px] border-line bg-pink motion-safe:animate-bob sm:block" />
            <div className="absolute top-52 left-6 hidden size-10 -rotate-12 rounded-lg border-[3px] border-line bg-mint motion-safe:animate-sway lg:block" />
            <div className="absolute -right-16 -bottom-20 size-56 rounded-full border-[3px] border-line bg-cobalt/90 motion-safe:animate-drift [animation-delay:-6s]" />
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="group absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full border-[3px] border-line bg-card shadow-[0_3px_0_0_var(--line)] transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--line)] active:translate-y-0.5 active:shadow-none sm:top-6 sm:right-6"
          >
            <X
              className="size-5 transition-transform duration-300 group-hover:rotate-90"
              aria-hidden="true"
            />
          </button>

          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-block -rotate-2 rounded-full border-[3px] border-line bg-mint px-4 py-1.5 text-sm font-extrabold text-ink shadow-[0_3px_0_0_var(--line)] motion-safe:animate-pop">
              Welcome to Modulr
            </p>
            <h2 id="pricing-popup-title" className="mt-5 text-4xl font-black sm:text-6xl">
              Unlock{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-[-0.1em] bottom-[0.08em] -z-10 h-[0.42em] origin-left -rotate-1 rounded-md bg-sunflower motion-safe:animate-draw [animation-delay:350ms]"
                />
                every module
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One plan opens every subject. Pick what suits you, and cancel any time.
            </p>
          </div>

          <ul className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2.5">
            {HIGHLIGHTS.map(({ icon: Icon, label, tint }, i) => (
              <li
                key={label}
                style={{ animationDelay: `${200 + i * 80}ms` }}
                className={`inline-flex items-center gap-1.5 rounded-full border-[3px] border-line px-3.5 py-1.5 text-sm font-extrabold text-ink shadow-[0_3px_0_0_var(--line)] transition-transform duration-200 hover:-translate-y-1 hover:rotate-2 motion-safe:animate-pop ${tint}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-6">
            {children}
          </div>

          <ul className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-bold text-muted-foreground">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-center gap-1 text-center">
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
