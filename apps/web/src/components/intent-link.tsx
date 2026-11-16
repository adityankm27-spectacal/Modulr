"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ComponentProps } from "react";

/**
 * A link that loads the next page in the background only when the visitor shows
 * intent (hover, keyboard focus or the start of a tap), instead of as soon as it is on
 * screen. A page full of links no longer makes the server render a dozen other pages
 * on every visit, while a click still opens almost instantly.
 */
export function IntentLink({
  href,
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const warmed = useRef(false);

  function warm() {
    if (warmed.current || typeof href !== "string") return;
    warmed.current = true;
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
