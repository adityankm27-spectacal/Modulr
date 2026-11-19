"use client";

import { useEffect } from "react";

/** How long a link click may go without the address changing before the page is loaded the plain way. */
const STUCK_AFTER_MS = 6000;

/**
 * Safety net for in-app navigation. Clicking a link normally swaps the page without a
 * reload, and the address only changes once the new page has arrived. If that never
 * happens (a request that went nowhere, or a tab left open across a site update), the
 * click appears to do nothing, so after a few seconds the link is opened with a normal
 * page load instead.
 */
export function NavWatchdog() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const here = window.location.pathname + window.location.search;
      const there = url.pathname + url.search;
      if (there === here) return; // same page, or only a #hash change

      setTimeout(() => {
        // Still on the page we left: the soft navigation never completed.
        if (window.location.pathname + window.location.search === here) {
          window.location.assign(url.href);
        }
      }, STUCK_AFTER_MS);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
