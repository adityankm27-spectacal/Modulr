import { ChevronDown } from "lucide-react";
import { Markdown } from "@/components/markdown/markdown";
import { Badge } from "@/components/ui/badge";
import { pluralize } from "@/lib/format";
import type { QuestionRow } from "@/lib/catalog";
import { FREQUENCY_LABEL } from "@/lib/questions";

/** One question with its answer hidden behind "Show answer" (works without JavaScript). */
export function QuestionCard({
  question,
  number,
  showDraftBadge = false,
}: {
  question: QuestionRow;
  number: number;
  showDraftBadge?: boolean;
}) {
  const hasMeta =
    question.marks || question.frequency || question.sessions.length > 0 || showDraftBadge;

  return (
    <article className="rounded-2xl border-2 bg-card p-4 sm:p-5">
      <div className="flex gap-3">
        <span
          className="mt-1 shrink-0 font-mono text-sm font-semibold text-muted-foreground"
          aria-hidden="true"
        >
          Q{number}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="sr-only">Question {number}</h3>
          <Markdown>{question.question_md}</Markdown>
          {hasMeta ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {showDraftBadge && !question.is_published ? (
                <Badge variant="highlight">Draft</Badge>
              ) : null}
              {question.marks ? (
                <Badge variant="primary">{pluralize(question.marks, "mark")}</Badge>
              ) : null}
              {question.frequency ? (
                <Badge variant="highlight">{FREQUENCY_LABEL[question.frequency]}</Badge>
              ) : null}
              {question.sessions.map((session) => (
                <Badge key={session}>{session}</Badge>
              ))}
            </div>
          ) : null}

          {question.answer_md.trim() ? (
            <details className="group mt-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="inline-flex min-h-11 items-center gap-2 rounded-full bg-muted px-4 text-sm font-bold hover:bg-accent">
                <span className="group-open:hidden">Show answer</span>
                <span className="hidden group-open:inline">Hide answer</span>
                <ChevronDown
                  className="size-4 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="mt-4 border-t pt-4">
                <Markdown>{question.answer_md}</Markdown>
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </article>
  );
}
