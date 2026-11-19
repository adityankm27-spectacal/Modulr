"use client";

import { Loader2, Pencil, X } from "lucide-react";
import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { StatusMessage } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveModule } from "@/lib/admin/actions";
import { IDLE } from "@/lib/admin/state";

/**
 * A pencil button that opens a small inline form for renaming a module. It saves
 * through the same action as the Details tab, sending the module's other settings
 * back unchanged so only the title changes.
 */
export function RenameModule({
  id,
  subjectId,
  number,
  title,
  isFreePreview,
  isPublished,
}: {
  id: string;
  subjectId: string;
  number: number;
  title: string;
  isFreePreview: boolean;
  isPublished: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(saveModule, IDLE);
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "ok") setOpen(false);
  }, [state.at, state.status]);

  useEffect(() => {
    if (open) {
      input.current?.focus();
      input.current?.select();
    }
  }, [open]);

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Rename module ${number}`}
      >
        <Pencil aria-hidden="true" />
        Rename
      </Button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      noValidate
      className="flex w-full flex-wrap items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="subject_id" value={subjectId} />
      <input type="hidden" name="number" value={number} />
      <input type="hidden" name="is_free_preview" value={isFreePreview ? "yes" : "no"} />
      {isPublished ? <input type="hidden" name="is_published" value="on" /> : null}
      <label htmlFor={inputId} className="sr-only">
        New name for module {number}
      </label>
      <Input
        ref={input}
        id={inputId}
        name="title"
        defaultValue={title}
        maxLength={200}
        className="min-w-0 flex-1 sm:min-w-80"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Save
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
        <X aria-hidden="true" />
        <span className="sr-only">Cancel</span>
      </Button>
      <StatusMessage state={state} />
    </form>
  );
}
