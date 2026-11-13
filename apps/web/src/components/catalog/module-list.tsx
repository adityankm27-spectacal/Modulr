import { ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { moduleLockState } from "@/lib/access";
import { countsSummary, type ModuleCounts } from "@/lib/module-tabs";

export interface ModuleListItem {
  id: string;
  number: number;
  title: string;
  is_free_preview: boolean;
}

export function ModuleList({
  subjectId,
  modules,
  counts,
  signedIn,
  hasSubjectAccess,
}: {
  subjectId: string;
  modules: ModuleListItem[];
  counts: Map<string, ModuleCounts>;
  signedIn: boolean;
  hasSubjectAccess: boolean;
}) {
  if (modules.length === 0) {
    return (
      <p className="rounded-2xl bg-muted p-6 text-muted-foreground">
        Modules for this subject are being written. Check back soon.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {modules.map((module) => {
        const lock = moduleLockState({
          signedIn,
          isFreePreview: module.is_free_preview,
          hasSubjectAccess,
        });
        const locked = lock.kind !== "open" && !module.is_free_preview;
        return (
          <li
            key={module.id}
            className="motion-safe:animate-rise"
            style={{ animationDelay: `${Math.min(module.number - 1, 10) * 60}ms` }}
          >
            <Link
              href={`/subjects/${subjectId}/modules/${module.number}`}
              className="group flex items-center gap-4 rounded-2xl border-[3px] border-line bg-card p-4 shadow-[0_4px_0_0_var(--line)] transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--line)] active:translate-y-1 active:shadow-none"
            >
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-xl border-[3px] border-line bg-sunflower text-ink font-display text-lg font-black transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
              >
                {module.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="sr-only">Module {module.number}: </span>
                <span className="block font-bold leading-snug">{module.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {countsSummary(counts.get(module.id))}
                </span>
                <span className="mt-2 flex flex-wrap gap-2">
                  {module.is_free_preview ? <Badge variant="free">Free preview</Badge> : null}
                  {locked ? (
                    <Badge variant="locked">
                      <Lock aria-hidden="true" />
                      Locked
                    </Badge>
                  ) : null}
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
