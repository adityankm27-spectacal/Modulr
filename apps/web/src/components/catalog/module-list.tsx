import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { moduleLockState } from "@/lib/access";
import { countsSummary, type ModuleCounts } from "@/lib/module-tabs";
import type { SubjectTone } from "@/lib/subject-style";
import { SUBJECT_TONE } from "./subject-visuals";

export interface ModuleListItem {
  id: string;
  number: number;
  title: string;
  is_free_preview: boolean;
}

export function ModuleList({
  tone = "sunflower",
  subjectId,
  modules,
  counts,
  signedIn,
  hasSubjectAccess,
}: {
  tone?: SubjectTone;
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

  const { color, ink } = SUBJECT_TONE[tone];

  return (
    <ol className="space-y-4" style={{ "--tone": color, "--tone-ink": ink } as CSSProperties}>
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
              className="group flex items-center gap-4 rounded-2xl border-[3px] border-line bg-card p-4 shadow-[0_5px_0_0_var(--line)] transition-[translate,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_9px_0_0_var(--tone)] focus-visible:-translate-y-1 focus-visible:shadow-[0_9px_0_0_var(--tone)] active:translate-y-1 active:shadow-none"
            >
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-xl border-[3px] border-line bg-(--tone) text-(--tone-ink) font-display text-lg font-black transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
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
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-[translate,background-color,color] duration-200 group-hover:translate-x-1 group-hover:bg-(--tone) group-hover:text-(--tone-ink)">
                <ArrowRight className="size-5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
