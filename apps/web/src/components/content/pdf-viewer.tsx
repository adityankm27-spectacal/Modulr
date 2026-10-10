"use client";

import { Loader2 } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

/**
 * View-only PDF notes (spec §16 Q6: no downloads). Pages are drawn onto canvases with
 * pdf.js, so there is no browser PDF toolbar, download or print button, and each page
 * carries the viewer's name and email as a watermark. A determined user can still
 * screenshot; this only removes the easy paths and identifies leaks.
 */
export function PdfViewer({
  url,
  title,
  watermark,
}: {
  url: string;
  title: string;
  watermark: { name: string; email: string } | null;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);

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
      aria-label={title}
      role="document"
      className="space-y-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {Array.from({ length: pdf.numPages }, (_, i) => (
        <PdfPage
          key={i + 1}
          pdf={pdf}
          pageNumber={i + 1}
          total={pdf.numPages}
          watermark={watermark}
        />
      ))}
    </div>
  );
}

function PdfPage({
  pdf,
  pageNumber,
  total,
  watermark,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  total: number;
  watermark: { name: string; email: string } | null;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // A4 portrait until the real size is known, so the page list doesn't jump around.
  const [aspect, setAspect] = useState(1 / Math.SQRT2);
  const [rendered, setRendered] = useState(false);

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
  }, [pdf, pageNumber]);

  return (
    <figure className="space-y-1">
      <div
        ref={boxRef}
        className="relative overflow-hidden rounded-xl border-2 bg-white shadow-sm"
        style={{ aspectRatio: aspect }}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          aria-label={`Page ${pageNumber} of ${total}`}
          role="img"
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
    </figure>
  );
}
