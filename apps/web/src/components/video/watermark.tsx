"use client";

import { useEffect, useState } from "react";
import { nextWatermarkPosition } from "@/lib/video/watch";

/**
 * Moving watermark with the viewer's name and email over the player (spec §5.5).
 * Purely visual and aria-hidden; it deters screen recording and identifies leaks.
 */
export function Watermark({ name, email }: { name: string; email: string }) {
  const [position, setPosition] = useState(() => nextWatermarkPosition(null));

  useEffect(() => {
    const timer = setInterval(() => setPosition((p) => nextWatermarkPosition(p)), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 max-w-[70%] select-none rounded-md px-2 py-1 font-mono text-[11px] leading-tight font-semibold text-white/25 transition-[top,left] duration-1000 ease-in-out [text-shadow:0_1px_2px_rgb(0_0_0/0.25)] motion-reduce:transition-none sm:text-xs"
      style={{ top: `${position.top}%`, left: `${position.left}%` }}
    >
      <span className="block truncate">{name}</span>
      <span className="block truncate">{email}</span>
    </div>
  );
}
