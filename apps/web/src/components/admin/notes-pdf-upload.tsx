"use client";

import { CheckCircle2, FileText, Loader2, TriangleAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { attachNotesPdf } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/client";

/** Matches the `notes` bucket's file_size_limit. */
const MAX_BYTES = 20 * 1024 * 1024;

type Phase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/**
 * Uploads a PDF straight from the admin's browser to the private `notes` bucket
 * (storage policy: admins only), then attaches it to the module's short notes.
 */
export function NotesPdfUpload({
  moduleId,
  title,
  hasPdf,
}: {
  moduleId: string;
  title: string;
  hasPdf: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  async function upload(file: File) {
    if (file.type !== "application/pdf") {
      setPhase({ kind: "error", message: "Choose a PDF file." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhase({ kind: "error", message: "The PDF is larger than 20 MB." });
      return;
    }
    setPhase({ kind: "uploading" });
    const path = `${moduleId}/${crypto.randomUUID()}.pdf`;
    const { error } = await createClient()
      .storage.from("notes")
      .upload(path, file, { contentType: "application/pdf", upsert: false });
    if (error) {
      setPhase({ kind: "error", message: `Upload failed: ${error.message}` });
      return;
    }
    const result = await attachNotesPdf({ moduleId, path, title });
    if (result.status === "error") {
      setPhase({ kind: "error", message: result.message ?? "Couldn't attach the PDF." });
      return;
    }
    setPhase({ kind: "done", message: result.message ?? "PDF attached." });
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border-2 border-dashed p-4">
      <div className="flex flex-wrap items-center gap-3">
        <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="flex-1 text-sm">
          {hasPdf
            ? "A PDF is attached. Students see it instead of the text notes below."
            : "Upload a PDF to show your designed notes exactly as they are (view only, no download)."}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          aria-label="Choose a PDF"
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
          disabled={phase.kind === "uploading"}
          onClick={() => inputRef.current?.click()}
        >
          {phase.kind === "uploading" ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Upload aria-hidden="true" />
          )}
          {hasPdf ? "Replace PDF" : "Upload PDF"}
        </Button>
      </div>
      <p role="status" aria-live="polite" className="text-sm">
        {phase.kind === "uploading" ? "Uploading…" : null}
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
