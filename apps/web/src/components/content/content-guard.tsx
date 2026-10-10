"use client";

import { EyeOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/** How long content stays hidden after a PrintScreen key press. */
const PRINT_SCREEN_HIDE_MS = 2000;

/**
 * Blurs paid reading content (notes, formulas, questions, PDFs) while the page is not the
 * focused window: switching to another window or tab, opening a screenshot or screen-share
 * tool that takes focus, printing, or pressing PrintScreen.
 *
 * This is a deterrent, not a lock: a phone photo of the screen, or a tool that captures
 * without taking focus, can't be detected from a web page. Not used on the video tab,
 * where focus moves into the player's iframe as soon as it is clicked.
 */
export function ContentGuard({
  enabled = true,
  children,
}: {
  enabled?: boolean;
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const unfocused = () => !document.hasFocus() || document.visibilityState !== "visible";
    let printScreenTimer: ReturnType<typeof setTimeout> | undefined;

    // Initial state must not be set during render: the server can't know the focus.
    setHidden(unfocused());

    const hide = () => setHidden(true);
    const sync = () => {
      // Stay hidden while a PrintScreen press is still being handled.
      if (printScreenTimer === undefined) setHidden(unfocused());
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "PrintScreen") return;
      setHidden(true);
      // Replace the captured image on the clipboard where the browser allows it.
      void navigator.clipboard?.writeText("").catch(() => undefined);
      clearTimeout(printScreenTimer);
      printScreenTimer = setTimeout(() => {
        printScreenTimer = undefined;
        setHidden(unfocused());
      }, PRINT_SCREEN_HIDE_MS);
    };

    window.addEventListener("blur", hide);
    window.addEventListener("focus", sync);
    window.addEventListener("beforeprint", hide);
    window.addEventListener("afterprint", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      clearTimeout(printScreenTimer);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", sync);
      window.removeEventListener("beforeprint", hide);
      window.removeEventListener("afterprint", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  return (
    <div className="relative print:hidden" data-content-guard={hidden ? "hidden" : "visible"}>
      {/* No transition on purpose: a screenshot tool must never catch a half-visible page. */}
      <div
        inert={hidden}
        aria-hidden={hidden}
        style={hidden ? { filter: "blur(32px)", opacity: 0.35 } : undefined}
        className={hidden ? "pointer-events-none select-none" : undefined}
      >
        {children}
      </div>
      {hidden ? (
        <div
          role="status"
          className="absolute inset-0 z-20 flex items-start justify-center p-6 pt-24 text-center"
        >
          <p className="flex max-w-sm items-center gap-2 rounded-2xl border-2 bg-card px-4 py-3 font-semibold shadow-lg">
            <EyeOff className="size-5 shrink-0" aria-hidden="true" />
            Content is hidden while this window isn&apos;t in focus. Click here to continue.
          </p>
        </div>
      ) : null}
    </div>
  );
}
