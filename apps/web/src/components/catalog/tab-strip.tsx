"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Horizontally scrollable tab strip that centres the active tab (aria-current)
 * on load, so deep links like ?tab=viva show the selected tab on narrow screens.
 */
export function TabStrip({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.clientWidth) / 2;
  });

  return (
    <nav
      ref={ref}
      aria-label={label}
      className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none]"
    >
      {children}
    </nav>
  );
}
