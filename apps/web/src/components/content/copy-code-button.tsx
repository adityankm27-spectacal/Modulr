"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Older way to copy, for browsers that block the Clipboard API (some in-app browsers,
 * plain-http pages): select a hidden textarea and run the copy command.
 */
function copyWithSelection(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/** Copies a program's code to the clipboard and confirms it for a moment. */
export function CopyCodeButton({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <button
      type="button"
      onClick={() => {
        const fallback = () => setState(copyWithSelection(code) ? "copied" : "failed");
        if (!navigator.clipboard) return fallback();
        navigator.clipboard
          .writeText(code)
          .then(() => setState("copied"))
          .catch(fallback);
      }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-white/25 px-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
    >
      {state === "copied" ? (
        <Check className="size-4 text-mint" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      <span aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy"}
      </span>
    </button>
  );
}
