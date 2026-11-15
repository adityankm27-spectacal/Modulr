"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

/**
 * A price that counts up to its value when it first appears. Screen readers get the
 * final price straight away, and reduced-motion users never see the count.
 */
export function AnimatedPrice({
  paise,
  className,
  delayMs = 250,
  durationMs = 900,
}: {
  paise: number;
  className?: string;
  delayMs?: number;
  durationMs?: number;
}) {
  const [shown, setShown] = useState(paise);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 4);
        setShown(t === 1 ? paise : Math.round((paise * eased) / 100) * 100);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      setShown(0);
      frame = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [paise, delayMs, durationMs]);

  return (
    <span className={className}>
      <span aria-hidden="true" className="tabular-nums">
        {formatPrice(shown)}
      </span>
      <span className="sr-only">{formatPrice(paise)}</span>
    </span>
  );
}
