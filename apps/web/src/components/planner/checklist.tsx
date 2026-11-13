"use client";

import { MODULE_STEPS, type ModuleStep } from "@modulr/shared";
import { Check } from "lucide-react";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { setStep } from "@/lib/planner/actions";
import type { PlannerModule, PlannerSteps } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { plannerCard } from "./kinds";

const LABEL: Record<ModuleStep, string> = {
  video: "Watch",
  notes: "Notes",
  formulas: "Formulas",
  questions: "Questions",
};

type Change = { moduleId: string; step: ModuleStep; done: boolean };

function apply(state: PlannerSteps, change: Change): PlannerSteps {
  const current = state[change.moduleId] ?? [];
  const next = change.done
    ? [...new Set([...current, change.step])]
    : current.filter((s) => s !== change.step);
  return { ...state, [change.moduleId]: next };
}

export function PlannerChecklist({
  modules,
  steps,
}: {
  modules: PlannerModule[];
  steps: PlannerSteps;
}) {
  const [current, change] = useOptimistic(steps, apply);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const subjects = useMemo(() => {
    const groups = new Map<string, { name: string; modules: PlannerModule[] }>();
    for (const m of modules) {
      const group = groups.get(m.subjectId) ?? { name: m.subjectName, modules: [] };
      group.modules.push(m);
      groups.set(m.subjectId, group);
    }
    return [...groups.entries()];
  }, [modules]);

  const toggle = (moduleId: string, step: ModuleStep, done: boolean) =>
    startTransition(async () => {
      change({ moduleId, step, done });
      const result = await setStep({ moduleId, step, done });
      setError(result.ok ? null : result.error);
    });

  return (
    <section aria-labelledby="checklist-heading" className={cn(plannerCard, "space-y-3")}>
      <h2 id="checklist-heading" className="font-sans text-lg font-extrabold tracking-normal">
        Module checklist
      </h2>
      <p role="status" aria-live="polite" className="text-sm font-bold text-danger-text">
        {error}
      </p>

      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your modules will appear here as soon as they are published.
        </p>
      ) : null}

      {subjects.map(([subjectId, subject]) => {
        const total = subject.modules.length * MODULE_STEPS.length;
        const done = subject.modules.reduce((sum, m) => sum + (current[m.id]?.length ?? 0), 0);
        const percent = total ? Math.round((done / total) * 100) : 0;
        return (
          <details
            key={subjectId}
            className="group rounded-2xl border-[3px] border-line bg-background"
          >
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate font-extrabold">{subject.name}</span>
                <span className="mt-1 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <span
                    className="h-2 w-24 overflow-hidden rounded-full border-2 border-line bg-muted"
                    role="progressbar"
                    aria-label={`${subject.name} progress`}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span className="block h-full bg-mint" style={{ width: `${percent}%` }} />
                  </span>
                  {done}/{total} steps
                </span>
              </span>
            </summary>
            <ul className="space-y-3 border-t-2 p-3">
              {subject.modules.map((m) => (
                <li key={m.id}>
                  <p className="text-sm font-bold">
                    Module {m.number}: {m.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {MODULE_STEPS.map((step) => {
                      const ticked = current[m.id]?.includes(step) ?? false;
                      return (
                        <button
                          key={step}
                          type="button"
                          aria-pressed={ticked}
                          onClick={() => toggle(m.id, step, !ticked)}
                          className={cn(
                            "inline-flex min-h-9 items-center gap-1 rounded-full border-2 border-line px-3 text-xs font-extrabold transition-colors",
                            ticked ? "bg-mint text-ink" : "bg-background hover:bg-muted",
                          )}
                        >
                          {ticked ? <Check className="size-3.5" aria-hidden="true" /> : null}
                          {LABEL[step]}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}
