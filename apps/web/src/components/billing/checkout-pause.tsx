"use client";

import { createContext, useContext } from "react";

/**
 * Lets a window that covers the page (like the pricing popup) step aside while
 * Razorpay's checkout is open. A modal <dialog> sits above everything on the
 * page, which would otherwise hide the checkout behind it.
 */
export const CheckoutPauseContext = createContext<{
  pause: () => void;
  resume: () => void;
} | null>(null);

export function useCheckoutPause() {
  return useContext(CheckoutPauseContext);
}
