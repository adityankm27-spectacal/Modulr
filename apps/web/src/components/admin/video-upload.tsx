"use client";

import { CheckCircle2, Loader2, Upload as UploadIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { Button } from "@/components/ui/button";
import { finishVideoUpload, startVideoUpload } from "@/lib/admin/actions";
import { readVideoDuration } from "@/lib/video/client";
import type { UploadTarget } from "@/lib/video/types";

type Phase =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "uploading"; percent: number }
  | { kind: "finishing" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

interface Cancelable {
  abort(): void;
}

function uploadWithTus(
  file: File,
  target: Extract<UploadTarget, { protocol: "tus" }>,
  onProgress: (p: number) => void,
): { promise: Promise<void>; handle: Cancelable } {
  let upload: Upload | null = null;
  const promise = new Promise<void>((resolve, reject) => {
    upload = new Upload(file, {
      endpoint: target.endpoint,
      headers: target.headers,
      metadata: target.metadata,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 50 * 1024 * 1024,
      onProgress: (sent, total) => onProgress(total ? (sent / total) * 100 : 0),
      onSuccess: () => resolve(),
      onError: (error) => reject(error),
    });
    // Resume a previous interrupted upload of the same file, if the browser remembers one.
    void upload.findPreviousUploads().then((previous) => {
      if (previous[0]) upload?.resumeFromPreviousUpload(previous[0]);
      upload?.start();
    });
  });
  return { promise, handle: { abort: () => void upload?.abort(true) } };
}

function uploadWithPut(
  file: File,
  url: string,
  onProgress: (p: number) => void,
): { promise: Promise<void>; handle: Cancelable } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<void>((resolve, reject) => {
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100);
    xhr.onload = () =>
      xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new Error("Cancelled"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type || "video/mp4");
    xhr.send(file);
  });
  return { promise, handle: { abort: () => xhr.abort() } };
}

/**
 * Uploads a video file straight to the provider (spec §5.6: resumable, with
 * processing status). The provider's secret key never reaches the browser.
 */
export function VideoUpload({
  videoId,
  hasFile,
  label,
}: {
  videoId: string;
  hasFile: boolean;
  label: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const handle = useRef<Cancelable | null>(null);
  const busy =
    phase.kind === "preparing" || phase.kind === "uploading" || phase.kind === "finishing";

  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPhase({ kind: "preparing" });
    const [durationSec, start] = await Promise.all([
      readVideoDuration(file),
      startVideoUpload({ videoId, fileName: file.name, fileType: file.type, fileSize: file.size }),
    ]);
    if (start.status === "error") {
      setPhase({ kind: "error", message: start.message });
      return;
    }

    setPhase({ kind: "uploading", percent: 0 });
    const onProgress = (percent: number) => setPhase({ kind: "uploading", percent });
    const upload =
      start.target.protocol === "tus"
        ? uploadWithTus(file, start.target, onProgress)
        : uploadWithPut(file, start.target.url, onProgress);
    handle.current = upload.handle;
    try {
      await upload.promise;
    } catch (error) {
      handle.current = null;
      setPhase({
        kind: "error",
        message:
          error instanceof Error && error.message === "Cancelled"
            ? "Upload cancelled."
            : "Upload failed. Choose the file again to resume.",
      });
      return;
    }
    handle.current = null;

    setPhase({ kind: "finishing" });
    const result = await finishVideoUpload({ videoId, durationSec });
    setPhase(
      result.status === "ok"
        ? { kind: "done", message: result.message ?? "Uploaded" }
        : { kind: "error", message: result.message ?? "Couldn't finish the upload." },
    );
    router.refresh();
  };

  return (
    <div className="space-y-2">
      {busy ? null : (
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border-2 border-input px-3 text-sm font-bold hover:bg-muted focus-within:outline-2 focus-within:outline-ring">
          <UploadIcon className="size-4" aria-hidden="true" />
          {hasFile ? "Replace file" : "Upload file"}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            aria-label={`${hasFile ? "Replace" : "Upload"} video file for ${label}`}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {phase.kind === "preparing" || phase.kind === "finishing" ? (
        <p role="status" className="flex items-center gap-2 text-sm font-semibold">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {phase.kind === "preparing" ? "Preparing upload…" : "Finishing…"}
        </p>
      ) : null}

      {phase.kind === "uploading" ? (
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label={`Uploading ${label}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(phase.percent)}
            className="h-2.5 w-48 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${phase.percent}%` }}
            />
          </div>
          <span className="font-mono text-sm">{Math.round(phase.percent)}%</span>
          <Button variant="ghost" size="sm" onClick={() => handle.current?.abort()}>
            <X aria-hidden="true" />
            Cancel
          </Button>
        </div>
      ) : null}

      {phase.kind === "done" ? (
        <p role="status" className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          {phase.message}
        </p>
      ) : null}
      {phase.kind === "error" ? (
        <p role="alert" className="text-sm font-semibold text-danger-text">
          {phase.message}
        </p>
      ) : null}
    </div>
  );
}
