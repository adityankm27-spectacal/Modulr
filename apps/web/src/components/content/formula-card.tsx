import { readSymbols } from "@modulr/shared";
import { Formula, Markdown } from "@/components/markdown/markdown";
import { Badge } from "@/components/ui/badge";

export interface FormulaCardData {
  id: string;
  title: string;
  formula_latex: string;
  symbols: unknown;
  when_to_use: string;
  is_published: boolean;
}

/** A formula with what each symbol means and when to use it (spec §4). */
export function FormulaCard({
  card,
  showDraftBadge = false,
}: {
  card: FormulaCardData;
  showDraftBadge?: boolean;
}) {
  const symbols = readSymbols(card.symbols);
  return (
    <article className="flex flex-col rounded-2xl border-2 bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-base font-extrabold tracking-normal">{card.title}</h3>
        {showDraftBadge && !card.is_published ? <Badge variant="highlight">Draft</Badge> : null}
      </div>
      <div className="mt-3 rounded-xl bg-muted px-3 py-2">
        <Formula latex={card.formula_latex} />
      </div>
      {symbols.length > 0 ? (
        <dl className="mt-4 space-y-2 text-[0.9375rem]">
          {symbols.map((s) => (
            <div
              key={`${s.symbol}-${s.meaning}`}
              className="grid grid-cols-[minmax(3rem,auto)_1fr] gap-3"
            >
              <dt className="font-semibold">
                <Formula latex={s.symbol} display={false} />
              </dt>
              <dd className="text-muted-foreground">{s.meaning}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {card.when_to_use.trim() ? (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
            When to use
          </p>
          <Markdown className="mt-1 text-[0.9375rem]">{card.when_to_use}</Markdown>
        </div>
      ) : null}
    </article>
  );
}
