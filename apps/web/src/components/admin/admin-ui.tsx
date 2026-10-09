import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3.5" aria-hidden="true" /> : null}
            {item.href ? (
              <Link href={item.href} className="font-semibold hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AdminSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)} aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-sans text-lg font-extrabold tracking-normal">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Collapsible inline editor ("Edit" / "Add …") without client JavaScript. */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-bold text-link hover:bg-muted">
        {summary}
      </summary>
      <div className="mt-3 rounded-2xl border-2 bg-background p-4">{children}</div>
    </details>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">{children}</p>;
}
