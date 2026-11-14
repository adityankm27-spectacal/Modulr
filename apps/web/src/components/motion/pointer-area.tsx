"use client";

import { useRef, type ComponentProps, type PointerEvent } from "react";

/**
 * Publishes the pointer's position to CSS so children can react to it:
 * `--mx` / `--my` run from -1 to 1 across the area, `--x` / `--y` are pixels
 * from its top-left corner. Mouse only, and never for reduced-motion users.
 */
export function PointerArea({
  as: Tag = "div",
  ...props
}: ComponentProps<"div"> & { as?: "div" | "header" | "section" }) {
  // At most one style update per frame, however fast the pointer events arrive.
  const frame = useRef(0);

  function move(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || frame.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = event.currentTarget;
    const { clientX, clientY } = event;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      el.style.setProperty("--x", `${Math.round(x)}px`);
      el.style.setProperty("--y", `${Math.round(y)}px`);
      el.style.setProperty("--mx", ((x / rect.width) * 2 - 1).toFixed(2));
      el.style.setProperty("--my", ((y / rect.height) * 2 - 1).toFixed(2));
    });
  }

  function leave(event: PointerEvent<HTMLElement>) {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    event.currentTarget.style.setProperty("--mx", "0");
    event.currentTarget.style.setProperty("--my", "0");
  }

  return <Tag onPointerMove={move} onPointerLeave={leave} {...props} />;
}
