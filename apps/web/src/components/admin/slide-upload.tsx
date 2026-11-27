"use client";

import { CheckCircle2, Loader2, RefreshCw, TriangleAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { attachSlide } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/client";
import {
  SLIDE_ACCEPT,
  SLIDE_FILE_TYPES,
  slideExtension,
  slideFileProblem,
  slideTitleFromFileName,
} from "@/lib/slide-files";

type Phase =
  | { kind: "idle" }
  | { kind: "uploading"; name: string }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/**
 * Uploads a deck, PDF or Word file straight from the admin's browser to the private
 * `slides` bucket (storage policy: admins only), then records it on the module's Slides
 * tab. With `replaceId` it swaps the file of that existing entry instead.
 */
export function SlideUpload({ moduleId, replaceId }: { moduleId: string; replaceId?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const replacing = Boolean(replaceId);

  async function upload(file: File) {
    const problem = slideFileProblem(file);
    const ext = slideExtension(file.name);
    if (problem || !ext) {
      setPhase({ kind: "error", message: problem ?? "Unsupported file." });
      return;
    }
    setPhase({ kind: "uploading", name: file.name });
    const path = `${moduleId}/${crypto.randomUUID()}.${ext}`;
    // Content type from the extension: browsers often report none for .ppt / .doc.
    const { error } = await createClient()
      .storage.from("slides")
      .upload(path, file, { contentType: SLIDE_FILE_TYPES[ext].mime, upsert: false });
    if (error) {
      setPhase({ kind: "error", message: `Upload failed: ${error.message}` });
      return;
    }
    const result = await attachSlide({
      moduleId,
      path,
      fileName: file.name,
      fileSize: file.size,
      title: title.trim() || slideTitleFromFileName(file.name),
      replaceId,
    });
    if (result.status === "error") {
      // The upload is orphaned; it's unreachable (no row points at it), so just report.
      setPhase({ kind: "error", message: result.message ?? "Couldn't save the file." });
      return;
    }
    setTitle("");
    setPhase({ kind: "done", message: result.message ?? "File saved." });
    router.refresh();
  }

  const busy = phase.kind === "uploading";

  return (
    <div className={replacing ? "space-y-1" : "space-y-3 rounded-2xl border-2 border-dashed p-4"}>
      <div className="flex flex-wrap items-end gap-3">
        {replacing ? null : (
          <label htmlFor={titleId} className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
            <span className="font-bold">Title (optional)</span>
            <Input
              id={titleId}
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Defaults to the file name"
            />
          </label>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={SLIDE_ACCEPT}
          className="sr-only"
          aria-label={replacing ? "Choose a replacement file" : "Choose a file to upload"}
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : replacing ? (
            <RefreshCw aria-hidden="true" />
          ) : (
            <Upload aria-hidden="true" />
          )}
          {replacing ? "Replace file" : "Upload file"}
        </Button>
      </div>
      {replacing ? null : (
        <p className="text-sm text-muted-foreground">
          PowerPoint (.pptx, .ppt), PDF or Word (.docx, .doc), up to 50 MB. PDFs show in the
          view-only viewer; PowerPoint and Word files are offered as a download.
        </p>
      )}
      <p role="status" aria-live="polite" className="text-sm">
        {phase.kind === "uploading" ? `Uploading ${phase.name}…` : null}
        {phase.kind === "done" ? (
          <span className="inline-flex items-center gap-1 font-semibold text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {phase.message}
          </span>
        ) : null}
        {phase.kind === "error" ? (
          <span className="inline-flex items-center gap-1 font-semibold text-destructive">
            <TriangleAlert className="size-4" aria-hidden="true" />
            {phase.message}
          </span>
        ) : null}
      </p>
    </div>
  );
}
