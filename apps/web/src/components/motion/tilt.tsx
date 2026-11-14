"use client";

import { useRef, type ComponentProps, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/** A card that leans towards the pointer. Mouse only, and never for reduced-motion users. */
export function Tilt({ className, max = 7, ...props }: ComponentProps<"div"> & { max?: number }) {
  // At most one style update per frame, however fast the pointer events arrive.
  const frame = useRef(0);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || frame.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = event.currentTarget;
    const { clientX, clientY } = event;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const rect = el.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--ry", `${(px * 2 * max).toFixed(1)}deg`);
      el.style.setProperty("--rx", `${(-py * 2 * max).toFixed(1)}deg`);
    });
  }

  function leave(event: PointerEvent<HTMLDivElement>) {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      onPointerMove={move}
      onPointerLeave={leave}
      className={cn(
        "transition-[transform,box-shadow] duration-200 ease-out [transform:perspective(900px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]",
        className,
      )}
      {...props}
    />
  );
}
