"use client";

import { useEffect } from "react";
import { SESSION_REPLACED } from "@/lib/session";

const CHECK_EVERY_MS = 30_000;

/**
 * Signs this tab out within ~30 s when the account signs in on another device, even
 * if the user just sits on a page (e.g. watching a video). Checks on an interval and
 * whenever the tab comes back into view; the proxy decides and clears the session.
 */
export function SessionWatch() {
  useEffect(() => {
    let stopped = false;

    async function check() {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        if (res.status !== 401) return;
        const body = (await res.json().catch(() => null)) as { code?: string } | null;
        if (body?.code === SESSION_REPLACED) {
          stopped = true;
          // A full load on purpose: drops every cached signed-in page from the client router.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign(`/sign-in?error=${SESSION_REPLACED}`);
        }
      } catch {
        // Offline or a blip: try again next time.
      }
    }

    const timer = setInterval(() => void check(), CHECK_EVERY_MS);
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return null;
}
