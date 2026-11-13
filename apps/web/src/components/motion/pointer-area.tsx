"use client";

import type { ComponentProps, PointerEvent } from "react";

/**
 * Publishes the pointer's position to CSS so children can react to it:
 * `--mx` / `--my` run from -1 to 1 across the area, `--x` / `--y` are pixels
 * from its top-left corner. Mouse only, and never for reduced-motion users.
 */
export function PointerArea({
  as: Tag = "div",
  ...props
}: ComponentProps<"div"> & { as?: "div" | "header" | "section" }) {
  function move(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
    el.style.setProperty("--mx", ((x / rect.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--my", ((y / rect.height) * 2 - 1).toFixed(3));
  }

  function leave(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--mx", "0");
    event.currentTarget.style.setProperty("--my", "0");
  }

  return <Tag onPointerMove={move} onPointerLeave={leave} {...props} />;
}
