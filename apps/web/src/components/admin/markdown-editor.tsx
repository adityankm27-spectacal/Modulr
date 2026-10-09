"use client";

import { CALLOUT_LABELS, CALLOUT_KINDS, type CalloutKind } from "@modulr/shared";
import { Bold, Heading2, List, Sigma, SquareFunction } from "lucide-react";
import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { useFieldError } from "@/components/admin/action-form";
import { Markdown } from "@/components/markdown/markdown";
import { FieldError } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Edit = (selected: string) => { text: string; select?: [number, number] };

const wrap =
  (before: string, after: string, placeholder: string): Edit =>
  (selected) => {
    const inner = selected || placeholder;
    return {
      text: `${before}${inner}${after}`,
      select: [before.length, before.length + inner.length],
    };
  };

const block =
  (before: string, after: string, placeholder: string): Edit =>
  (selected) => {
    const inner = selected || placeholder;
    const open = `\n${before}\n`;
    return {
      text: `${open}${inner}\n${after}\n`,
      select: [open.length, open.length + inner.length],
    };
  };

const linePrefix =
  (prefix: string, placeholder: string): Edit =>
  (selected) => {
    const lines = (selected || placeholder)
      .split("\n")
      .map((l) => `${prefix}${l}`)
      .join("\n");
    return { text: `\n${lines}\n`, select: [1 + prefix.length, 1 + lines.length] };
  };

const TOOLS: { label: string; icon: typeof Bold; edit: Edit }[] = [
  { label: "Bold", icon: Bold, edit: wrap("**", "**", "bold text") },
  { label: "Heading", icon: Heading2, edit: linePrefix("## ", "Heading") },
  { label: "Bulleted list", icon: List, edit: linePrefix("- ", "List item") },
  { label: "Inline maths", icon: Sigma, edit: wrap("$", "$", "x^2") },
  { label: "Display maths", icon: SquareFunction, edit: block("$$", "$$", "\\frac{a}{b}") },
];

const CALLOUT_SHORT: Record<CalloutKind, string> = {
  trick: "Trick",
  tip: "Tip",
  mistake: "Mistake",
  definition: "Definition",
};

/**
 * Markdown + LaTeX editor with a live preview that uses the exact renderer
 * students see (spec §5.6). Submits through the surrounding form via `name`.
 */
export function MarkdownEditor({
  name,
  label,
  defaultValue,
  rows = 18,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  rows?: number;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const preview = useDeferredValue(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const error = useFieldError(name);
  const errorId = `${id}-error`;
  const dirty = value !== defaultValue;

  // After a save, the server sends the new text back as defaultValue.
  const [savedValue, setSavedValue] = useState(defaultValue);
  if (defaultValue !== savedValue) {
    setSavedValue(defaultValue);
    setValue(defaultValue);
  }

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const apply = (edit: Edit) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const result = edit(value.slice(start, end));
    setValue(value.slice(0, start) + result.text + value.slice(end));
    setMode("write");
    requestAnimationFrame(() => {
      el.focus();
      const [a, b] = result.select ?? [result.text.length, result.text.length];
      el.setSelectionRange(start + a, start + b);
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-bold">
          {label}
          {dirty ? (
            <span className="ml-2 rounded-full bg-sunflower px-2 py-0.5 text-xs text-ink">
              Unsaved changes
            </span>
          ) : null}
        </label>
        <div
          role="tablist"
          aria-label={`${label} view`}
          className="flex rounded-full bg-muted p-1 lg:hidden"
        >
          {(["write", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "min-h-9 rounded-full px-4 text-sm font-bold capitalize",
                mode === m ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {hint ? <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p> : null}

      <div className="mt-2 grid gap-4 lg:grid-cols-2">
        <div className={cn(mode === "preview" && "hidden lg:block")}>
          <div
            role="toolbar"
            aria-label="Formatting"
            className="flex flex-wrap gap-1 rounded-t-xl border-2 border-b-0 border-input bg-muted/60 p-1.5"
          >
            {TOOLS.map(({ label: toolLabel, icon: Icon, edit }) => (
              <button
                key={toolLabel}
                type="button"
                onClick={() => apply(edit)}
                aria-label={toolLabel}
                title={toolLabel}
                className="flex size-9 items-center justify-center rounded-lg hover:bg-background"
              >
                <Icon className="size-4" aria-hidden="true" />
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-border" aria-hidden="true" />
            {CALLOUT_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => apply(block(`:::${kind}`, ":::", `${CALLOUT_LABELS[kind]} text`))}
                title={`Insert ${CALLOUT_LABELS[kind].toLowerCase()} callout`}
                className="min-h-9 rounded-lg px-2.5 text-xs font-bold hover:bg-background"
              >
                {CALLOUT_SHORT[kind]}
              </button>
            ))}
          </div>
          <textarea
            ref={ref}
            id={id}
            name={name}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={rows}
            spellCheck
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="block w-full resize-y rounded-b-xl border-2 border-input bg-background px-4 py-3 font-mono text-sm leading-relaxed focus-visible:border-ring focus-visible:outline-none aria-[invalid=true]:border-destructive"
          />
          <FieldError id={errorId} message={error} />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {value.length.toLocaleString("en-IN")} characters
          </p>
        </div>

        <div className={cn(mode === "write" && "hidden lg:block")}>
          <p
            className="mb-2 text-xs font-extrabold tracking-wide text-muted-foreground uppercase"
            aria-hidden="true"
          >
            Student preview
          </p>
          <div
            aria-label={`${label} preview`}
            className="max-h-[70vh] min-h-48 overflow-y-auto rounded-xl border-2 border-dashed bg-background p-4"
          >
            {preview.trim() ? (
              <Markdown>{preview}</Markdown>
            ) : (
              <p className="text-muted-foreground">Nothing to preview yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
