import { ChevronDown } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y-2 overflow-hidden rounded-[1.75rem] border-[3px] border-line bg-card shadow-[0_6px_0_0_var(--line)]">
      {items.map((item) => (
        <details
          key={item.q}
          name="faq"
          className="faq-item group px-5 transition-colors open:bg-accent/40 hover:bg-muted/50 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex min-h-16 items-center justify-between gap-4 py-4 font-bold">
            {item.q}
            <ChevronDown
              className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="pb-5 text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
