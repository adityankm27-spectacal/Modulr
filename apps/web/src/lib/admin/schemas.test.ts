import { describe, expect, it } from "vitest";
import {
  checkbox,
  documentSchema,
  formulaCardSchema,
  moduleSchema,
  questionSchema,
  subjectSchema,
  videoSchema,
} from "./schemas";

const subject = "40000000-0000-4000-8000-000000000002";
const mod = "50000000-0000-4000-8000-000000000021";
const syllabus = "30000000-0000-4000-8000-000000000001";

// Browsers leave unticked checkboxes (and some inputs) out of the form entirely.
describe("checkbox", () => {
  it("treats a missing field as false", () => {
    expect(checkbox.parse(undefined)).toBe(false);
    expect(checkbox.parse("on")).toBe(true);
    expect(checkbox.parse("false")).toBe(false);
  });
});

describe("questionSchema", () => {
  const base = {
    subject_id: subject,
    kind: "viva",
    module_id: mod,
    question_md: "What is $\\log_2 8$?",
    answer_md: "3",
  };

  it("accepts a form with optional fields blank or missing", () => {
    for (const extra of [{}, { marks: "", sessions: "", frequency: "" }]) {
      const result = questionSchema.safeParse({ ...base, ...extra });
      expect(result.error?.issues).toBeUndefined();
      expect(result.data).toMatchObject({
        marks: null,
        sessions: [],
        frequency: null,
        is_published: false,
        id: null,
      });
    }
  });

  it("parses marks, sessions and module", () => {
    const result = questionSchema.parse({
      ...base,
      module_id: "",
      marks: "5",
      sessions: "May 2024; Dec 2023, May 2024",
      frequency: "frequent",
      is_published: "on",
    });
    expect(result).toMatchObject({
      module_id: null,
      marks: 5,
      sessions: ["May 2024", "Dec 2023"],
      frequency: "frequent",
      is_published: true,
    });
  });

  it("rejects bad values with field-level messages", () => {
    const result = questionSchema.safeParse({
      ...base,
      question_md: "  ",
      marks: "0",
      kind: "quiz",
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]).sort();
    expect(paths).toEqual(["kind", "marks", "question_md"]);
  });
});

describe("other content schemas accept unticked checkboxes", () => {
  it("subject", () => {
    expect(
      subjectSchema.safeParse({
        syllabus_version_id: syllabus,
        semester: "3",
        code: "X",
        name: "Y",
      }).success,
    ).toBe(true);
  });

  it("module", () => {
    const data = moduleSchema.parse({ subject_id: subject, number: "4", title: "T" });
    expect(data.is_published).toBe(false);
    expect(data.is_free_preview).toBeUndefined(); // database default applies
  });

  it("document keeps the optimistic-lock version", () => {
    expect(
      documentSchema.parse({
        module_id: mod,
        kind: "short_notes",
        title: "T",
        content_md: "x",
        version: "3",
      }),
    ).toMatchObject({ version: 3, is_published: false });
  });

  it("video parses duration and chapters, and reports bad chapters", () => {
    const ok = videoSchema.parse({
      module_id: mod,
      title: "V",
      duration: "8:30",
      chapters: "0:00 Intro\n1:35 Main",
    });
    expect(ok).toMatchObject({
      duration_sec: 510,
      chapters: [
        { title: "Intro", start_sec: 0 },
        { title: "Main", start_sec: 95 },
      ],
    });

    const bad = videoSchema.safeParse({
      module_id: mod,
      title: "V",
      duration: "eight",
      chapters: "Intro",
    });
    expect(bad.error?.issues.map((i) => i.path[0]).sort()).toEqual(["chapters", "duration"]);

    const late = videoSchema.safeParse({
      module_id: mod,
      title: "V",
      duration: "1:00",
      chapters: "0:00 A\n2:00 B",
    });
    expect(late.error?.issues[0]?.message).toBe("A chapter starts after the end of the video.");
  });

  it("formula card parses symbols", () => {
    expect(
      formulaCardSchema.parse({
        module_id: mod,
        title: "T",
        formula_latex: "a=b",
        symbols: "a :: first",
      }),
    ).toMatchObject({
      symbols: [{ symbol: "a", meaning: "first" }],
      when_to_use: "",
      is_published: false,
    });
  });
});
