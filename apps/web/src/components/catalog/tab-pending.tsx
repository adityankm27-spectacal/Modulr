"use client";

import { useLinkStatus } from "next/link";

/**
 * Placed inside a tab link: tints and pulses the tab from the moment it is clicked
 * until its page arrives, so the tap is acknowledged at once. The link must be
 * `relative`; the overlay doesn't change the tab's size.
 */
export function TabPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-cobalt/20 ring-2 ring-cobalt"
    />
  );
}
