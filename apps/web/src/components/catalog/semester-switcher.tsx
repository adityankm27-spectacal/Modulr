import Link from "next/link";
import { cn } from "@/lib/utils";

export function SemesterSwitcher({ current, own }: { current: number; own: number }) {
  return (
    <nav aria-label="Semester">
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => {
          const active = n === current;
          return (
            <li key={n}>
              <Link
                href={n === own ? "/home" : `/home?semester=${n}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-input hover:bg-muted",
                )}
              >
                <span>Sem {n}</span>
                {n === own && !active ? (
                  <span className="text-[0.6875rem] font-semibold text-muted-foreground">
                    yours
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
