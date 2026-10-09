import { parseChapters, parseSymbols, parseTimestamp } from "@modulr/shared";
import { z } from "zod";

/** HTML checkboxes submit "on" when ticked and nothing when not. */
// Note: Zod 4 treats a key as required unless it is `.optional()`, even when the
// schema accepts undefined, so absent checkboxes/inputs must use `.optional()`.
export const checkbox = z
  .enum(["on", "true", "false"])
  .optional()
  .transform((v) => v === "on" || v === "true");

const text = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((v) => v || null);

const id = z.uuid({ error: "Missing or invalid id." });
const optionalId = z
  .union([z.literal(""), z.uuid()])
  .optional()
  .transform((v) => v || null);

const intInRange = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

const optionalInt = (label: string, min: number, max: number) =>
  z
    .union([z.literal(""), intInRange(label, min, max)])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null));

export const idSchema = z.object({ id });

export const collegeSchema = z.object({
  id: optionalId,
  name: text("Name", 120),
  short_code: text("Short code", 20).regex(
    /^[A-Za-z0-9-]+$/,
    "Use letters, numbers and dashes only.",
  ),
});

export const branchSchema = z.object({
  id: optionalId,
  college_id: id,
  name: text("Name", 120),
  code: text("Code", 20).regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers and dashes only."),
});

export const syllabusSchema = z.object({
  id: optionalId,
  branch_id: id,
  label: text("Label", 80),
  is_current: checkbox,
});

export const subjectSchema = z.object({
  id: optionalId,
  syllabus_version_id: id,
  semester: intInRange("Semester", 1, 8),
  code: text("Code", 30),
  name: text("Name", 160),
  description: optionalText(2000),
  is_published: checkbox,
});

export const moduleSchema = z.object({
  id: optionalId,
  subject_id: id,
  number: intInRange("Number", 1, 99),
  title: text("Title", 200),
  // "auto" lets the database apply the free-preview default from app_settings.
  is_free_preview: z.enum(["auto", "yes", "no", "on"]).optional(),
  is_published: checkbox,
});

export const videoSchema = z
  .object({
    id: optionalId,
    module_id: id,
    title: text("Title", 200),
    duration: z.string().trim().optional(),
    chapters: z.string().max(10000).optional(),
    is_published: checkbox,
  })
  .transform((v, ctx) => {
    const duration = v.duration ? parseTimestamp(v.duration) : null;
    if (v.duration && duration === null) {
      ctx.addIssue({
        code: "custom",
        path: ["duration"],
        message: "Use a time like 8:30 or 1:02:03.",
      });
    }
    const chapters = parseChapters(v.chapters ?? "");
    if (chapters.errors.length) {
      ctx.addIssue({ code: "custom", path: ["chapters"], message: chapters.errors.join(" ") });
    }
    if (duration !== null && chapters.items.some((c) => c.start_sec >= duration)) {
      ctx.addIssue({
        code: "custom",
        path: ["chapters"],
        message: "A chapter starts after the end of the video.",
      });
    }
    return { ...v, duration_sec: duration, chapters: chapters.items };
  });

export const documentSchema = z.object({
  id: optionalId,
  module_id: id,
  kind: z.enum(["short_notes", "formula_sheet"]),
  title: text("Title", 200),
  content_md: z.string().max(200_000, "The document is too long (200,000 characters max)."),
  // Optimistic concurrency: the version the editor started from.
  version: optionalInt("Version", 1, 1_000_000),
  is_published: checkbox,
});

export const formulaCardSchema = z
  .object({
    id: optionalId,
    module_id: id,
    title: text("Title", 200),
    formula_latex: text("Formula", 2000),
    symbols: z.string().max(10000).optional(),
    when_to_use: z.string().trim().max(5000).optional(),
    is_published: checkbox,
  })
  .transform((v, ctx) => {
    const symbols = parseSymbols(v.symbols ?? "");
    if (symbols.errors.length) {
      ctx.addIssue({ code: "custom", path: ["symbols"], message: symbols.errors.join(" ") });
    }
    return { ...v, symbols: symbols.items, when_to_use: v.when_to_use ?? "" };
  });

export const questionSchema = z.object({
  id: optionalId,
  subject_id: id,
  module_id: optionalId,
  kind: z.enum(["pyq", "important", "viva"], { error: "Choose a type." }),
  question_md: text("Question", 5000),
  answer_md: z.string().trim().max(20000, "The answer is too long.").default(""),
  marks: optionalInt("Marks", 1, 100),
  sessions: z
    .string()
    .optional()
    .transform((v) => [
      ...new Set(
        (v ?? "")
          .split(/[;,|]/)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string().max(40, "Each session must be 40 characters or fewer.")).max(12)),
  frequency: z
    .union([z.literal(""), z.enum(["very_frequent", "frequent", "sometimes"])])
    .optional()
    .transform((v) => v || null),
  is_published: checkbox,
});

export const PUBLISHABLE = [
  "subjects",
  "modules",
  "videos",
  "documents",
  "formula_cards",
  "questions",
] as const;
export type PublishableTable = (typeof PUBLISHABLE)[number];

export const REORDERABLE = ["subjects", "modules", "videos", "formula_cards", "questions"] as const;
export type ReorderableTable = (typeof REORDERABLE)[number];
