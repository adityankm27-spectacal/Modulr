"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontally scrollable tab strip that centres the active tab (aria-current)
 * on load, so deep links like ?tab=viva show the selected tab on narrow screens.
 * When tabs are cut off, an arrow and a fade appear on that side; the arrows and
 * a plain mouse wheel scroll the strip sideways, so it also works without touch.
 */
export function TabStrip({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const nav = ref.current;
    if (!nav) return;
    const max = nav.scrollWidth - nav.clientWidth;
    // A couple of pixels of slack so rounding never leaves an arrow showing at the end.
    const next = { left: nav.scrollLeft > 2, right: nav.scrollLeft < max - 2 };
    setEdges((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, []);

  // Centre the active tab when it changes (first load or a tab switch), but not on every
  // render, or the strip would jump back each time an arrow updates the state.
  const centred = useRef<string | null>(null);
  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    const key = active?.getAttribute("href") ?? null;
    if (nav && active && key !== centred.current) {
      centred.current = key;
      nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.clientWidth) / 2;
    }
    measure();
  });

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    if (nav.firstElementChild) observer.observe(nav.firstElementChild);

    // A vertical mouse wheel scrolls the strip sideways while there is room to go,
    // then lets the page scroll as usual.
    function onWheel(event: WheelEvent) {
      if (!nav || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = nav.scrollWidth - nav.clientWidth;
      if (max <= 0) return;
      const atStart = nav.scrollLeft <= 0 && event.deltaY < 0;
      const atEnd = nav.scrollLeft >= max - 1 && event.deltaY > 0;
      if (atStart || atEnd) return;
      event.preventDefault();
      nav.scrollLeft += event.deltaY;
    }
    nav.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer.disconnect();
      nav.removeEventListener("wheel", onWheel);
    };
  }, [measure]);

  function scrollBy(direction: -1 | 1) {
    const nav = ref.current;
    if (!nav) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollBy({ left: direction * nav.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="relative -mx-4">
      <nav
        ref={ref}
        aria-label={label}
        onScroll={measure}
        className="relative overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </nav>
      <ScrollButton side="left" visible={edges.left} onClick={() => scrollBy(-1)} />
      <ScrollButton side="right" visible={edges.right} onClick={() => scrollBy(1)} />
    </div>
  );
}

function ScrollButton({
  side,
  visible,
  onClick,
}: {
  side: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <div
      // Sits over the tab row only (the strip has a bottom border and padding below it).
      className={cn(
        "pointer-events-none absolute top-0 bottom-5 flex w-16 items-center transition-opacity duration-200",
        side === "left"
          ? "left-0 justify-start bg-gradient-to-r from-background from-40% to-transparent pl-1"
          : "right-0 justify-end bg-gradient-to-l from-background from-40% to-transparent pr-1",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        // Hidden arrows can't be focused or clicked; the tabs stay reachable by keyboard.
        tabIndex={visible ? 0 : -1}
        aria-hidden={visible ? undefined : true}
        aria-label={side === "left" ? "Scroll sections left" : "Scroll sections right"}
        className={cn(
          "flex size-9 items-center justify-center rounded-full border-[3px] border-line bg-card text-foreground shadow-[0_3px_0_0_var(--line)] transition-[translate,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--line)] active:translate-y-0.5 active:shadow-none",
          visible ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
