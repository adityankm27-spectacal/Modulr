import type { Enums } from "@modulr/shared";

type Frequency = Enums<"question_frequency">;

interface FilterableQuestion {
  marks: number | null;
  sessions: string[];
}

export interface QuestionFilters {
  marks: number | null;
  session: string | null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "May 2024" → sortable key; unknown formats sort last. */
export function sessionSortKey(session: string): number {
  const match = /([a-z]{3})[a-z]*\.?\s+(\d{4})/i.exec(session);
  if (!match) return -1;
  const month = MONTHS.indexOf((match[1] as string).toLowerCase());
  return Number(match[2]) * 12 + Math.max(month, 0);
}

/** The filter chips to offer: distinct marks (ascending) and sessions (newest first). */
export function filterOptions(questions: readonly FilterableQuestion[]) {
  const marks = [...new Set(questions.flatMap((q) => (q.marks ? [q.marks] : [])))].sort(
    (a, b) => a - b,
  );
  const sessions = [...new Set(questions.flatMap((q) => q.sessions))].sort(
    (a, b) => sessionSortKey(b) - sessionSortKey(a) || a.localeCompare(b),
  );
  return { marks, sessions };
}

export function filterQuestions<T extends FilterableQuestion>(
  questions: readonly T[],
  filters: QuestionFilters,
): T[] {
  return questions.filter(
    (q) =>
      (filters.marks === null || q.marks === filters.marks) &&
      (filters.session === null || q.sessions.includes(filters.session)),
  );
}

export function parseQuestionFilters(params: {
  marks?: string | string[];
  session?: string | string[];
}): QuestionFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const marks = Number(first(params.marks));
  const session = first(params.session)?.trim();
  return {
    marks: Number.isInteger(marks) && marks > 0 ? marks : null,
    session: session ? session.slice(0, 40) : null,
  };
}

const FREQUENCY_RANK: Record<Frequency, number> = {
  very_frequent: 0,
  frequent: 1,
  sometimes: 2,
};

/** Most frequently asked first; keeps authored order within a frequency (stable sort). */
export function sortByFrequency<T extends { frequency: Frequency | null }>(
  questions: readonly T[],
): T[] {
  return [...questions].sort(
    (a, b) =>
      (a.frequency ? FREQUENCY_RANK[a.frequency] : 3) -
      (b.frequency ? FREQUENCY_RANK[b.frequency] : 3),
  );
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  very_frequent: "Very frequent",
  frequent: "Frequent",
  sometimes: "Sometimes",
};
