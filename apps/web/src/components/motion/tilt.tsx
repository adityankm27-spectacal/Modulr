"use client";

import type { ComponentProps, PointerEvent } from "react";
import { cn } from "@/lib/utils";

/** A card that leans towards the pointer. Mouse only, and never for reduced-motion users. */
export function Tilt({ className, max = 7, ...props }: ComponentProps<"div"> & { max?: number }) {
  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${(px * 2 * max).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * 2 * max).toFixed(2)}deg`);
  }

  function leave(event: PointerEvent<HTMLDivElement>) {
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
