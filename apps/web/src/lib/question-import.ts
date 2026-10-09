import type { Enums } from "@modulr/shared";
import { parseCsv, CsvError } from "@/lib/csv";

/**
 * Validates a CSV of questions for one subject before anything is saved (spec §5.6).
 *
 * Columns (header row required, case-insensitive, any order):
 *   kind       pyq | important | viva                          required
 *   question   Markdown + LaTeX                                required
 *   answer     Markdown + LaTeX                                required
 *   module     module number in this subject; blank = spans modules
 *   marks      whole number, e.g. 2, 5, 10
 *   sessions   exam sessions separated by ";", e.g. May 2024; Dec 2023
 *   frequency  very_frequent | frequent | sometimes
 */

export const IMPORT_COLUMNS = [
  "kind",
  "module",
  "question",
  "answer",
  "marks",
  "sessions",
  "frequency",
] as const;
type Column = (typeof IMPORT_COLUMNS)[number];
const REQUIRED: Column[] = ["kind", "question", "answer"];

const ALIASES: Record<string, Column> = {
  question_md: "question",
  answer_md: "answer",
  module_number: "module",
  session: "sessions",
};

export const MAX_IMPORT_ROWS = 1000;
export const MAX_IMPORT_BYTES = 1_000_000;

const KINDS = ["pyq", "important", "viva"] as const;
const FREQUENCIES = ["very_frequent", "frequent", "sometimes"] as const;

export interface ImportedQuestion {
  kind: Enums<"question_kind">;
  module_id: string | null;
  question_md: string;
  answer_md: string;
  marks: number | null;
  sessions: string[];
  frequency: Enums<"question_frequency"> | null;
}

export interface ImportRowResult {
  line: number;
  /** Short plain preview of the question for the review table. */
  preview: string;
  kind: string;
  module: string;
  errors: string[];
  value: ImportedQuestion | null;
}

export interface ImportValidation {
  fileErrors: string[];
  rows: ImportRowResult[];
  validCount: number;
}

/** Lower-case and collapse whitespace so trivially different copies count as duplicates. */
export function normalizeQuestion(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function validateQuestionImport(
  csvText: string,
  context: {
    modules: ReadonlyArray<{ id: string; number: number }>;
    existing: ReadonlyArray<{ kind: string; question_md: string }>;
  },
): ImportValidation {
  const empty = (fileErrors: string[]): ImportValidation => ({
    fileErrors,
    rows: [],
    validCount: 0,
  });

  if (new TextEncoder().encode(csvText).length > MAX_IMPORT_BYTES) {
    return empty(["The file is larger than 1 MB. Split it into smaller files."]);
  }

  let parsed;
  try {
    parsed = parseCsv(csvText);
  } catch (error) {
    return empty([error instanceof CsvError ? error.message : "The file isn't valid CSV."]);
  }

  const [header, ...body] = parsed;
  if (!header) return empty(["The file is empty."]);

  const columns = header.cells.map((h) => {
    const name = normalizeHeader(h);
    return ALIASES[name] ?? name;
  });
  const fileErrors: string[] = [];
  const unknown = columns.filter((c) => c && !IMPORT_COLUMNS.includes(c as Column));
  if (unknown.length) {
    fileErrors.push(
      `Unknown column${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. Allowed: ${IMPORT_COLUMNS.join(", ")}.`,
    );
  }
  const missing = REQUIRED.filter((c) => !columns.includes(c));
  if (missing.length) fileErrors.push(`Missing required column(s): ${missing.join(", ")}.`);
  const dupes = columns.filter((c, i) => c && columns.indexOf(c) !== i);
  if (dupes.length) fileErrors.push(`Column listed twice: ${[...new Set(dupes)].join(", ")}.`);
  if (body.length === 0) fileErrors.push("The file has a header but no questions.");
  if (body.length > MAX_IMPORT_ROWS) {
    fileErrors.push(`Too many rows (${body.length}). Import at most ${MAX_IMPORT_ROWS} at a time.`);
  }
  if (fileErrors.length) return empty(fileErrors);

  const moduleByNumber = new Map(context.modules.map((m) => [m.number, m.id]));
  const seen = new Set(
    context.existing.map((q) => `${q.kind}|${normalizeQuestion(q.question_md)}`),
  );
  const seenInFile = new Map<string, number>();

  const rows = body.map(({ line, cells }): ImportRowResult => {
    const get = (column: Column) => {
      const index = columns.indexOf(column);
      return index >= 0 ? (cells[index] ?? "").trim() : "";
    };
    const errors: string[] = [];

    if (cells.length > columns.length && cells.slice(columns.length).some((c) => c.trim())) {
      errors.push("Has more values than there are columns (check for an unquoted comma).");
    }

    const kindRaw = get("kind").toLowerCase();
    const kind = KINDS.find((k) => k === kindRaw) ?? null;
    if (!kind) errors.push(`kind must be one of ${KINDS.join(", ")}.`);

    const question = get("question");
    const answer = get("answer");
    if (!question) errors.push("question is empty.");
    else if (question.length > 5000) errors.push("question is longer than 5,000 characters.");
    if (!answer) errors.push("answer is empty.");
    else if (answer.length > 20000) errors.push("answer is longer than 20,000 characters.");

    const moduleRaw = get("module").replace(/^module\s*/i, "");
    let moduleId: string | null = null;
    if (moduleRaw) {
      const n = Number(moduleRaw);
      moduleId = Number.isInteger(n) ? (moduleByNumber.get(n) ?? null) : null;
      if (!moduleId) errors.push(`module ${moduleRaw} doesn't exist in this subject.`);
    }

    const marksRaw = get("marks");
    let marks: number | null = null;
    if (marksRaw) {
      const n = Number(marksRaw);
      if (Number.isInteger(n) && n >= 1 && n <= 100) marks = n;
      else errors.push("marks must be a whole number from 1 to 100.");
    }

    const sessions = [
      ...new Set(
        get("sessions")
          .split(/[;|]/)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];
    if (sessions.length > 12) errors.push("sessions has more than 12 entries.");
    if (sessions.some((s) => s.length > 40))
      errors.push("Each session must be 40 characters or fewer.");

    const frequencyRaw = get("frequency")
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    let frequency: ImportedQuestion["frequency"] = null;
    if (frequencyRaw) {
      frequency = FREQUENCIES.find((f) => f === frequencyRaw) ?? null;
      if (!frequency) errors.push(`frequency must be one of ${FREQUENCIES.join(", ")}.`);
    }

    if (kind && question) {
      const key = `${kind}|${normalizeQuestion(question)}`;
      const earlier = seenInFile.get(key);
      if (earlier !== undefined) errors.push(`Same question as line ${earlier}.`);
      else if (seen.has(key)) errors.push("This question already exists in the subject.");
      seenInFile.set(key, line);
    }

    const preview = question.replace(/\s+/g, " ").slice(0, 120);
    const value =
      errors.length === 0 && kind
        ? {
            kind,
            module_id: moduleId,
            question_md: question,
            answer_md: answer,
            marks,
            sessions,
            frequency,
          }
        : null;

    return { line, preview, kind: kindRaw, module: moduleRaw, errors, value };
  });

  return { fileErrors: [], rows, validCount: rows.filter((r) => r.value).length };
}
