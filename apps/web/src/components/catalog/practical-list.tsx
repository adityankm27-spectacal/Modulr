import { FlaskConical, Lock } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { SubjectTone } from "@/lib/subject-style";
import { SUBJECT_TONE } from "./subject-visuals";

/** The subject's lab experiments, each opening its explanation videos. */
export function PracticalList({
  subjectId,
  practicals,
  tone,
  locked,
}: {
  subjectId: string;
  practicals: { id: string; number: number; title: string; is_free_preview: boolean }[];
  tone: SubjectTone;
  /** The viewer has no access to the videos yet. */
  locked: boolean;
}) {
  const { color, ink } = SUBJECT_TONE[tone];

  return (
    <ol
      className="grid gap-4 sm:grid-cols-2"
      style={{ "--tone": color, "--tone-ink": ink } as CSSProperties}
    >
      {practicals.map((practical, index) => (
        <li
          key={practical.id}
          className="motion-safe:animate-rise"
          style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
        >
          <Link
            href={`/subjects/${subjectId}/practicals/${practical.number}`}
            className="group flex h-full items-center gap-4 rounded-2xl border-[3px] border-line bg-card p-4 shadow-[0_5px_0_0_var(--line)] transition-[translate,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_9px_0_0_var(--tone)] focus-visible:-translate-y-1 focus-visible:shadow-[0_9px_0_0_var(--tone)] active:translate-y-1 active:shadow-none"
          >
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border-[3px] border-line bg-(--tone) font-display text-lg font-black text-(--tone-ink) transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
            >
              {practical.number}
            </span>
            <span className="min-w-0 flex-1">
              <span className="sr-only">Practical {practical.number}: </span>
              <span className="block leading-snug font-bold">{practical.title}</span>
              <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                {locked && !practical.is_free_preview ? (
                  <>
                    <Lock className="size-3.5" aria-hidden="true" /> Subscribers
                  </>
                ) : (
                  <>
                    <FlaskConical className="size-3.5" aria-hidden="true" />{" "}
                    {practical.is_free_preview ? "Free · video explanation" : "Video explanation"}
                  </>
                )}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
