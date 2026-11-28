"use client";

import { Eraser, Highlighter, PenLine, Trash2, Undo2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addPoint, MARK_COLORS, TOOL_STYLE, type MarkTool, type Stroke } from "@/lib/pdf-marks";
import { cn } from "@/lib/utils";

export type MarkMode = MarkTool | "eraser";

/** Eraser reach, as a fraction of page width. */
const ERASER_RADIUS = 0.015;
/** Canvas resolution cap, so big zoomed pages don't use too much memory. */
const MAX_DPR = 2;

const at = (p: number[], i: number) => p[i] ?? 0;

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, w: number, h: number) {
  const style = TOOL_STYLE[stroke.tool];
  const width = Math.max(1, style.width * w);
  const p = stroke.points;
  ctx.globalAlpha = style.alpha;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (p.length === 2) {
    ctx.arc(at(p, 0) * w, at(p, 1) * h, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.moveTo(at(p, 0) * w, at(p, 1) * h);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(at(p, i) * w, at(p, i + 1) * h);
  ctx.stroke();
}

/** The nearest scrollable ancestor (the full-screen wrapper), or the page itself. */
function scrollParent(el: HTMLElement | null): HTMLElement | Window {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight)
      return node;
  }
  return window;
}

/**
 * A transparent canvas over one PDF page that shows that page's marks and, while a tool
 * is on, takes pen, mouse and one-finger touch input. Two fingers scroll instead of
 * drawing. It only ever holds the student's own strokes, never the PDF itself.
 */
export function MarkLayer({
  strokes,
  mode,
  color,
  onStroke,
  onErase,
}: {
  strokes: Stroke[];
  mode: MarkMode | null;
  color: string;
  onStroke: (stroke: Stroke) => void;
  /** Called with "start" once, then each eraser position, then "end". */
  onErase: (
    phase: "start" | "move" | "end",
    x: number,
    y: number,
    radius: number,
    aspect: number,
  ) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef(strokes);
  const liveRef = useRef<Stroke | null>(null);
  const erasingRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  // Touch points currently on the layer, for two-finger scrolling.
  const touchesRef = useRef(new Map<number, number>());
  const panYRef = useRef<number | null>(null);

  const redraw = () => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of strokesRef.current) drawStroke(ctx, s, canvas.width, canvas.height);
      if (liveRef.current) drawStroke(ctx, liveRef.current, canvas.width, canvas.height);
    });
  };

  useEffect(() => {
    strokesRef.current = strokes;
    redraw();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Match the canvas to its on-screen size, so marks scale with zoom and width.
    const observer = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      redraw();
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Turning the tool off mid-stroke drops the unfinished stroke.
  useEffect(() => {
    if (mode) return;
    liveRef.current = null;
    erasingRef.current = null;
    touchesRef.current.clear();
    panYRef.current = null;
    redraw();
  }, [mode]);

  const position = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 1, 1);
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      aspect: rect.width / rect.height,
    };
  };

  const finish = (pointerId: number) => {
    if (erasingRef.current === pointerId) {
      erasingRef.current = null;
      onErase("end", 0, 0, ERASER_RADIUS, 1);
    }
    const live = liveRef.current;
    if (live && live.points.length > 0) {
      liveRef.current = null;
      onStroke(live);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!mode || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    try {
      // Keep receiving moves if the finger or pen slides off the page mid-stroke.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone; the stroke just ends at the page edge.
    }
    if (e.pointerType === "touch") {
      touchesRef.current.set(e.pointerId, e.clientY);
      if (touchesRef.current.size >= 2) {
        // A second finger means scroll: drop whatever the first finger started.
        liveRef.current = null;
        if (erasingRef.current !== null) {
          erasingRef.current = null;
          onErase("end", 0, 0, ERASER_RADIUS, 1);
        }
        panYRef.current = average(touchesRef.current);
        redraw();
        return;
      }
    }
    const { x, y, aspect } = position(e);
    if (mode === "eraser") {
      erasingRef.current = e.pointerId;
      onErase("start", x, y, ERASER_RADIUS, aspect);
      onErase("move", x, y, ERASER_RADIUS, aspect);
      return;
    }
    const stroke: Stroke = { tool: mode, color, points: [] };
    addPoint(stroke.points, x, y, aspect);
    liveRef.current = stroke;
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!mode) return;
    if (e.pointerType === "touch" && touchesRef.current.has(e.pointerId)) {
      touchesRef.current.set(e.pointerId, e.clientY);
      if (panYRef.current !== null) {
        const y = average(touchesRef.current);
        scrollParent(canvasRef.current).scrollBy(0, panYRef.current - y);
        panYRef.current = y;
        return;
      }
    }
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const samples = events.length > 0 ? events : [e];
    if (erasingRef.current === e.pointerId) {
      for (const s of samples) {
        const { x, y, aspect } = position(s);
        onErase("move", x, y, ERASER_RADIUS, aspect);
      }
      return;
    }
    const live = liveRef.current;
    if (!live) return;
    let added = false;
    for (const s of samples) {
      const { x, y, aspect } = position(s);
      added = addPoint(live.points, x, y, aspect) || added;
    }
    if (added) redraw();
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    touchesRef.current.delete(e.pointerId);
    if (panYRef.current !== null) {
      // Stay in scroll mode until every finger is lifted.
      panYRef.current = touchesRef.current.size > 0 ? average(touchesRef.current) : null;
      return;
    }
    if (e.type === "pointercancel") {
      liveRef.current = null;
      redraw();
    }
    finish(e.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-mark-layer=""
      className={cn(
        "absolute inset-0 block h-full w-full mix-blend-multiply [-webkit-touch-callout:none]",
        mode ? "cursor-crosshair touch-none" : "pointer-events-none",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    />
  );
}

function average(map: Map<number, number>): number {
  let sum = 0;
  for (const v of map.values()) sum += v;
  return sum / map.size;
}

const TOOLS: { mode: MarkMode; label: string; Icon: typeof PenLine }[] = [
  { mode: "pen", label: "Pen", Icon: PenLine },
  { mode: "highlighter", label: "Highlighter", Icon: Highlighter },
  { mode: "eraser", label: "Eraser", Icon: Eraser },
];

/** Tool, colour, undo and clear controls shown while marking is on. */
export function MarkToolbar({
  mode,
  color,
  canUndo,
  canClear,
  onMode,
  onColor,
  onUndo,
  onClear,
}: {
  mode: MarkMode;
  color: string;
  canUndo: boolean;
  canClear: boolean;
  onMode: (mode: MarkMode) => void;
  onColor: (color: string) => void;
  onUndo: () => void;
  onClear: () => void;
}) {
  return (
    <div role="toolbar" aria-label="Marking tools" className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        {TOOLS.map(({ mode: m, label, Icon }) => (
          <Button
            key={m}
            variant={mode === m ? "sunflower" : "outline"}
            size="icon"
            aria-label={label}
            aria-pressed={mode === m}
            title={label}
            onClick={() => onMode(m)}
          >
            <Icon aria-hidden="true" />
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1" role="group" aria-label="Colour">
        {MARK_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-label={c.label}
            aria-pressed={color === c.value}
            title={c.label}
            onClick={() => onColor(c.value)}
            className="flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span
              className={cn(
                "block size-7 rounded-full border-[3px] border-line",
                color === c.value && "ring-[3px] ring-line ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: c.value }}
            />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Undo"
          title="Undo"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Clear this page"
          title="Clear this page"
          disabled={!canClear}
          onClick={onClear}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
