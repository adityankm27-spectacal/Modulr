"use client";

import { Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { startTransition, useActionState, useOptimistic } from "react";
import { setFlag } from "@/lib/admin/actions";
import { IDLE } from "@/lib/admin/state";
import type { PublishableTable } from "@/lib/admin/schemas";
import { cn } from "@/lib/utils";

/** One-click publish / free-preview switch with optimistic UI. */
export function FlagToggle({
  table,
  id,
  field = "is_published",
  value,
  label,
}: {
  table: PublishableTable;
  id: string;
  field?: "is_published" | "is_free_preview";
  value: boolean;
  /** Accessible name for the item, e.g. "Module 2". */
  label: string;
}) {
  const [state, action, pending] = useActionState(setFlag, IDLE);
  const [optimistic, setOptimistic] = useOptimistic(value);

  const on = optimistic;
  const text =
    field === "is_published" ? (on ? "Published" : "Draft") : on ? "Free preview" : "Paid";
  const Icon = field === "is_published" ? (on ? Eye : EyeOff) : on ? Sparkles : Lock;

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${field === "is_published" ? "Published" : "Free preview"}: ${label}`}
        disabled={pending}
        onClick={() => {
          const data = new FormData();
          data.set("table", table);
          data.set("id", id);
          data.set("field", field);
          data.set("value", on ? "false" : "true");
          startTransition(() => {
            setOptimistic(!on);
            action(data);
          });
        }}
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold transition-colors disabled:opacity-60 [&_svg]:size-3.5",
          on
            ? field === "is_published"
              ? "border-transparent bg-mint text-ink"
              : "border-transparent bg-sunflower text-ink"
            : "border-border bg-background text-muted-foreground hover:border-input",
        )}
      >
        <Icon aria-hidden="true" />
        {text}
      </button>
      {state.status === "error" ? (
        <span role="alert" className="mt-1 text-xs font-semibold text-danger-text">
          {state.message}
        </span>
      ) : null}
    </span>
  );
}
