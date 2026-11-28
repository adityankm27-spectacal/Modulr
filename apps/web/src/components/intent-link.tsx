"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ComponentProps } from "react";

/** A little under Next's 5-minute client cache, so a warmed page never expires unseen. */
const REWARM_AFTER_MS = 4 * 60_000;

/**
 * A link that loads the next page in the background only when the visitor shows
 * intent (hover, keyboard focus or the start of a tap), instead of as soon as it is on
 * screen. A page full of links no longer makes the server render a dozen other pages
 * on every visit, while a click still opens almost instantly.
 *
 * Next keeps a prefetched page for 5 minutes, so the link warms it again once that has
 * passed: coming back to a tab after a while still opens pages quickly.
 */
export function IntentLink({
  href,
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const warmedAt = useRef(0);

  function warm() {
    if (typeof href !== "string") return;
    const now = Date.now();
    if (now - warmedAt.current < REWARM_AFTER_MS) return;
    warmedAt.current = now;
    router.prefetch(href);
  }

  return (
    <Link
      href={href}
      prefetch={false}
      onPointerEnter={(event) => {
        warm();
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        warm();
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        warm();
        onTouchStart?.(event);
      }}
      {...props}
    />
  );
}
