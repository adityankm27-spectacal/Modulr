"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Thin bar across the top of the page from the moment an in-app link is clicked until
 * the new page arrives. Pages are rendered on the server and links only load on intent,
 * so a click can take a moment; without this nothing on screen changes in the meantime
 * and the site feels stuck.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  // The address changes once the new page has arrived: finish the bar.
  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
  }, [pathname, search]);

  useEffect(() => {
    if (state !== "done") return;
    const timer = setTimeout(() => setState("idle"), 350);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      // Module tabs switch in the browser without loading anything.
      if (anchor.hasAttribute("data-instant-tab")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // API routes (e.g. a file download) don't change the page.
      if (url.pathname.startsWith("/api/")) return;
      const here = window.location.pathname + window.location.search;
      if (url.pathname + url.search === here) return; // same page or only a #hash
      setState("loading");
    }
    // Capture phase, so the bar starts even if a link handler stops the event later.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (state === "idle") return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        className={
          state === "loading"
            ? "nav-progress-run h-full bg-cobalt shadow-[0_0_8px_var(--color-cobalt)]"
            : "h-full w-full bg-cobalt opacity-0 transition-opacity duration-300"
        }
      />
    </div>
  );
}
