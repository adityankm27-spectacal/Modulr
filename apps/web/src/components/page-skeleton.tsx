"use client";

import { useEffect } from "react";

/** How long a loading screen may stay up before the page is reloaded to unstick it. */
const STUCK_AFTER_MS = 8000;
/** Never reload more than once in this window, so a real outage can't cause a reload loop. */
const RELOAD_COOLDOWN_MS = 30_000;
const STORAGE_KEY = "modulr:stuck-reload";

/**
 * Loading placeholder sized like a list page, so content doesn't jump in. If it is
 * still showing after a few seconds (a navigation request that never answered, e.g. on a
 * flaky connection), the page is reloaded once so nobody is left staring at it.
 */
export function PageSkeleton() {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const last = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0);
        if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
        sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // No storage: still reload once, the page was stuck.
      }
      window.location.reload();
    }, STUCK_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-3/4 animate-pulse rounded-xl bg-muted" />
      <div className="mt-10 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
