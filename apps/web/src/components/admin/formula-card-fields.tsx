"use client";

import { formatSymbols, parseSymbols, type FormulaSymbol } from "@modulr/shared";
import { useDeferredValue, useState } from "react";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/action-form";
import { FormulaCard } from "@/components/content/formula-card";

/** Formula card inputs with a live preview of the student card. */
export function FormulaCardFields({
  defaults,
}: {
  defaults?: {
    title: string;
    formula_latex: string;
    symbols: FormulaSymbol[];
    when_to_use: string;
    is_published: boolean;
  };
}) {
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [latex, setLatex] = useState(defaults?.formula_latex ?? "");
  const [symbols, setSymbols] = useState(formatSymbols(defaults?.symbols ?? []));
  const [whenToUse, setWhenToUse] = useState(defaults?.when_to_use ?? "");
  const preview = useDeferredValue({ title, latex, symbols, whenToUse });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <TextField
          name="title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextAreaField
          name="formula_latex"
          label="Formula (LaTeX)"
          hint="No dollar signs needed, e.g. S_n = \frac{n}{2}(a + l)"
          mono
          rows={3}
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
        />
        <TextAreaField
          name="symbols"
          label="Symbol meanings"
          hint="One per line:  symbol :: meaning   (symbol in LaTeX)"
          mono
          rows={4}
          value={symbols}
          onChange={(e) => setSymbols(e.target.value)}
        />
        <TextAreaField
          name="when_to_use"
          label="When to use"
          hint="Markdown and $maths$ allowed."
          rows={3}
          value={whenToUse}
          onChange={(e) => setWhenToUse(e.target.value)}
        />
        <CheckboxField
          name="is_published"
          label="Published"
          defaultChecked={defaults?.is_published ?? false}
        />
      </div>
      <div>
        <p
          className="mb-2 text-xs font-extrabold tracking-wide text-muted-foreground uppercase"
          aria-hidden="true"
        >
          Student preview
        </p>
        {preview.latex.trim() ? (
          <FormulaCard
            card={{
              id: "preview",
              title: preview.title || "Untitled formula",
              formula_latex: preview.latex,
              symbols: parseSymbols(preview.symbols).items,
              when_to_use: preview.whenToUse,
              is_published: true,
            }}
          />
        ) : (
          <p className="rounded-2xl border-2 border-dashed p-6 text-muted-foreground">
            Type a formula to preview it.
          </p>
        )}
      </div>
    </div>
  );
}
