"use client";

import { Highlighter, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useRef, useState } from "react";
import { MarkLayer, MarkToolbar, type MarkMode } from "@/components/content/pdf-marks";
import { Button } from "@/components/ui/button";
import {
  eraseAt,
  loadMarks,
  MARK_COLORS,
  saveMarks,
  storageKey,
  type MarkTool,
  type PageMarks,
  type Stroke,
} from "@/lib/pdf-marks";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

/**
 * View-only PDF notes (spec §16 Q6: no downloads). Pages are drawn onto canvases with
 * pdf.js, so there is no browser PDF toolbar, download or print button, and each page
 * carries the viewer's name and email as a watermark. A determined user can still
 * screenshot; this only removes the easy paths and identifies leaks.
 *
 * Students can turn on a pen or highlighter and mark pages. Marks are drawn on a separate
 * canvas per page and saved on this device only (lib/pdf-marks.ts), keyed by `marksKey`.
 */
export function PdfViewer({
  url,
  title,
  watermark,
  userId,
  marksKey,
}: {
  url: string;
  title: string;
  watermark: { name: string; email: string } | null;
  userId: string | null;
  /** Identifies this PDF file for saved marks; change it when the file is replaced. */
  marksKey: string;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(1);

  const docRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MarkMode | null>(null);
  const [lastTool, setLastTool] = useState<MarkTool>("highlighter");
  const [color, setColor] = useState<string>(MARK_COLORS[0].value);
  const [marks, setMarks] = useState<PageMarks>({});
  // Latest marks, updated as soon as they change, so several events in one frame
  // (eraser samples, a stroke right after an erase) never work from a stale copy.
  const marksRef = useRef<PageMarks>({});
  const [undo, setUndo] = useState<{ page: number; prev: Stroke[] }[]>([]);
  const erasingRef = useRef<{ page: number; prev: Stroke[] } | null>(null);
  const key = storageKey(userId, marksKey);

  const commit = (next: PageMarks) => {
    marksRef.current = next;
    setMarks(next);
    saveMarks(key, next);
  };

  // Saved marks live in localStorage, so they can only be read after mounting.
  useEffect(() => {
    const loaded = loadMarks(key);
    marksRef.current = loaded;
    setMarks(loaded);
    setUndo([]);
  }, [key]);

  const setPage = (page: number, strokes: Stroke[]) =>
    commit({ ...marksRef.current, [page]: strokes });

  const pushUndo = (page: number, prev: Stroke[]) =>
    setUndo((stack) => [...stack.slice(-49), { page, prev }]);

  const addStroke = (page: number, stroke: Stroke) => {
    const prev = marksRef.current[page] ?? [];
    pushUndo(page, prev);
    setPage(page, [...prev, stroke]);
  };

  const erase = (
    page: number,
    phase: "start" | "move" | "end",
    x: number,
    y: number,
    radius: number,
    aspect: number,
  ) => {
    const prev = marksRef.current[page] ?? [];
    if (phase === "start") {
      erasingRef.current = { page, prev };
    } else if (phase === "move") {
      const next = eraseAt(prev, x, y, radius, aspect);
      if (next !== prev) setPage(page, next);
    } else {
      const started = erasingRef.current;
      erasingRef.current = null;
      if (started && started.page === page && prev !== started.prev) {
        pushUndo(page, started.prev);
      }
    }
  };

  const undoLast = () => {
    const last = undo.at(-1);
    if (!last) return;
    setUndo(undo.slice(0, -1));
    setPage(last.page, last.prev);
  };

  /** The page taking up most of the screen, or the first page with marks. */
  const currentPage = (): number | null => {
    let best: number | null = null;
    let bestArea = 0;
    for (const el of docRef.current?.querySelectorAll<HTMLElement>("[data-page]") ?? []) {
      const r = el.getBoundingClientRect();
      const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      if (visible > bestArea) {
        bestArea = visible;
        best = Number(el.dataset.page);
      }
    }
    return best;
  };

  const clearPage = () => {
    const page = currentPage();
    if (page === null) return;
    const prev = marksRef.current[page] ?? [];
    if (prev.length === 0) return;
    pushUndo(page, prev);
    setPage(page, []);
  };

  const chooseMode = (next: MarkMode) => {
    setMode(next);
    if (next !== "eraser") setLastTool(next);
  };
  const chooseColor = (next: string) => {
    setColor(next);
    if (mode === "eraser") setMode(lastTool);
  };
  const hasMarks = Object.values(marks).some((list) => list.length > 0);

  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)));
  }, []);

  // Native fullscreen where the browser supports it (not iPhone Safari); otherwise the
  // same layout is shown as a fixed overlay.
  const enterFull = () => {
    setFull(true);
    const el = wrapRef.current;
    if (el && document.fullscreenEnabled) void el.requestFullscreen().catch(() => undefined);
  };
  const exitFull = useCallback(() => {
    setFull(false);
    setZoom(1);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    // Esc leaves native fullscreen without telling us, so keep the state in step.
    const onChange = () => {
      if (!document.fullscreenElement) {
        setFull(false);
        setZoom(1);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitFull();
      else if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP);
      else if (e.key === "-") zoomBy(-ZOOM_STEP);
      else if (e.key === "0") setZoom(1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [full, exitFull, zoomBy]);

  useEffect(() => {
    let cancelled = false;
    let task: { destroy(): Promise<void> } | null = null;
    void (async () => {
      try {
        // Loaded on demand: pdf.js only runs in the browser.
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        if (cancelled) return;
        const loading = pdfjs.getDocument({ url });
        task = loading;
        const loaded = await loading.promise;
        if (!cancelled) setPdf(loaded);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [url]);

  if (failed) {
    return (
      <p role="alert" className="rounded-2xl border-2 p-6 text-center font-semibold">
        Couldn&apos;t load the notes. Reload the page to try again.
      </p>
    );
  }
  if (!pdf) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 rounded-2xl border-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        Loading notes…
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={
        full ? "fixed inset-0 z-50 overflow-auto bg-background px-4 pb-8 sm:px-8" : "space-y-3"
      }
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-end gap-2",
          full
            ? "sticky top-0 z-10 -mx-4 mb-4 border-b-2 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8"
            : mode
              ? "sticky top-0 z-10 -mx-2 rounded-b-2xl bg-background/95 px-2 py-2 backdrop-blur"
              : null,
        )}
      >
        {mode ? (
          <MarkToolbar
            mode={mode}
            color={color}
            canUndo={undo.length > 0}
            canClear={hasMarks}
            onMode={chooseMode}
            onColor={chooseColor}
            onUndo={undoLast}
            onClear={clearPage}
          />
        ) : null}
        <Button
          type="button"
          variant={mode ? "sunflower" : "outline"}
          size="sm"
          aria-pressed={mode !== null}
          onClick={() => setMode(mode ? null : lastTool)}
        >
          <Highlighter aria-hidden="true" />
          {mode ? "Done" : "Mark"}
        </Button>
        {full ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Zoom out"
            >
              <ZoomOut aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setZoom(1)}
              aria-label="Reset zoom"
              className="min-w-16 tabular-nums"
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Zoom in"
            >
              <ZoomIn aria-hidden="true" />
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={full ? exitFull : enterFull}
          aria-label={full ? "Exit full screen" : "Full screen"}
        >
          {full ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          {full ? "Exit" : "Full screen"}
        </Button>
      </div>
      {mode ? (
        <p className="hidden text-right text-xs text-muted-foreground pointer-coarse:block">
          Drawing is on: use two fingers to scroll.
        </p>
      ) : null}
      <div
        ref={docRef}
        aria-label={title}
        role="document"
        className="mx-auto space-y-4 select-none"
        style={full ? { width: `calc(min(100%, 56rem) * ${zoom})` } : undefined}
        onContextMenu={(e) => e.preventDefault()}
      >
        {Array.from({ length: pdf.numPages }, (_, i) => (
          <PdfPage
            key={i + 1}
            pdf={pdf}
            pageNumber={i + 1}
            total={pdf.numPages}
            watermark={watermark}
            zoom={zoom}
            full={full}
            strokes={marks[i + 1] ?? NO_STROKES}
            mode={mode}
            color={color}
            onStroke={addStroke}
            onErase={erase}
          />
        ))}
      </div>
    </div>
  );
}

const NO_STROKES: Stroke[] = [];

function PdfPage({
  pdf,
  pageNumber,
  total,
  watermark,
  zoom,
  full,
  strokes,
  mode,
  color,
  onStroke,
  onErase,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  total: number;
  watermark: { name: string; email: string } | null;
  zoom: number;
  full: boolean;
  strokes: Stroke[];
  mode: MarkMode | null;
  color: string;
  onStroke: (page: number, stroke: Stroke) => void;
  onErase: (
    page: number,
    phase: "start" | "move" | "end",
    x: number,
    y: number,
    radius: number,
    aspect: number,
  ) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // A4 portrait until the real size is known, so the page list doesn't jump around.
  const [aspect, setAspect] = useState(1 / Math.SQRT2);
  const [rendered, setRendered] = useState(false);
  // Screen readers can't read a canvas, so each page's text is also kept off-screen.
  // The PDF is already in the browser to be drawn, so this doesn't make copying easier.
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void pdf
      .getPage(pageNumber)
      .then((page) => page.getTextContent())
      .then((content) => {
        if (cancelled) return;
        const pageText = content.items
          .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
          .join("")
          .trim();
        setText(pageText);
      })
      .catch(() => {
        if (!cancelled) setText("");
      });
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    let task: { cancel(): void } | null = null;
    let done = false;

    const render = async () => {
      if (done) return;
      done = true;
      const page = await pdf.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      setAspect(base.width / base.height);
      // Sharp on high-DPI screens; capped so huge pages don't exhaust memory.
      const scale = Math.min((box.clientWidth * window.devicePixelRatio) / base.width, 4);
      const viewport = page.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const renderTask = page.render({ canvas, viewport });
      task = renderTask;
      await renderTask.promise.catch(() => undefined);
      setRendered(true);
    };

    // Draw pages as they approach the screen, not all at once.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          void render();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(box);
    return () => {
      observer.disconnect();
      task?.cancel();
    };
  }, [pdf, pageNumber, zoom, full]);

  return (
    <figure className="space-y-1">
      <div
        ref={boxRef}
        data-page={pageNumber}
        className="relative overflow-hidden rounded-xl border-2 bg-white shadow-sm"
        style={{ aspectRatio: aspect }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
        <MarkLayer
          strokes={strokes}
          mode={rendered ? mode : null}
          color={color}
          onStroke={(stroke) => onStroke(pageNumber, stroke)}
          onErase={(phase, x, y, r, a) => onErase(pageNumber, phase, x, y, r, a)}
        />
        {!rendered ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          </div>
        ) : null}
        {watermark ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <p className="-rotate-30 font-mono text-sm font-semibold whitespace-nowrap text-black/10 sm:text-lg">
              {watermark.name} · {watermark.email}
            </p>
          </div>
        ) : null}
      </div>
      <figcaption className="text-center text-xs text-muted-foreground">
        Page {pageNumber} of {total}
      </figcaption>
      <div className="sr-only whitespace-pre-line">
        {text === null
          ? "Loading this page's text."
          : text || "This page has no readable text; it may be a scanned image."}
      </div>
    </figure>
  );
}
