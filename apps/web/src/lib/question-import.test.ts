import { describe, expect, it } from "vitest";
import { validateQuestionImport } from "./question-import";

const context = {
  modules: [
    { id: "m1", number: 1 },
    { id: "m2", number: 2 },
  ],
  existing: [{ kind: "viva", question_md: "What is  an  Algorithm?" }],
};

const run = (csv: string) => validateQuestionImport(csv, context);

describe("validateQuestionImport", () => {
  it("accepts valid rows and maps every column", () => {
    const result = run(
      [
        "Kind,Module,Question,Answer,Marks,Sessions,Frequency",
        'pyq,2,"Explain $x^2$, briefly",Because.,5,May 2024; Dec 2023,',
        "important,,Cross-module question,Answer,10,,very frequent",
      ].join("\n"),
    );
    expect(result.fileErrors).toEqual([]);
    expect(result.validCount).toBe(2);
    expect(result.rows[0]?.value).toEqual({
      kind: "pyq",
      module_id: "m2",
      question_md: "Explain $x^2$, briefly",
      answer_md: "Because.",
      marks: 5,
      sessions: ["May 2024", "Dec 2023"],
      frequency: null,
    });
    expect(result.rows[1]?.value).toMatchObject({ module_id: null, frequency: "very_frequent" });
  });

  it("accepts column aliases and any column order", () => {
    const result = run("answer_md,question_md,kind,module_number\nA,Q,viva,module 1");
    expect(result.validCount).toBe(1);
    expect(result.rows[0]?.value).toMatchObject({ module_id: "m1", kind: "viva" });
  });

  it("reports every problem on a row without saving it", () => {
    const result = run("kind,module,question,answer,marks,frequency\nquiz,9,,,abc,often");
    expect(result.validCount).toBe(0);
    expect(result.rows[0]?.errors).toEqual([
      "kind must be one of pyq, important, viva.",
      "question is empty.",
      "answer is empty.",
      "module 9 doesn't exist in this subject.",
      "marks must be a whole number from 1 to 100.",
      "frequency must be one of very_frequent, frequent, sometimes.",
    ]);
    expect(result.rows[0]?.value).toBeNull();
  });

  it("catches duplicates in the file and against existing questions", () => {
    const result = run(
      "kind,question,answer\nviva,what is an algorithm?,A\npyq,Q one,A\npyq,Q  ONE,A\nviva,Q one,A",
    );
    expect(result.rows.map((r) => r.errors)).toEqual([
      ["This question already exists in the subject."],
      [],
      ["Same question as line 3."],
      [],
    ]);
  });

  it("flags extra unquoted commas", () => {
    const result = run("kind,question,answer\nviva,Q,A, with a comma");
    expect(result.rows[0]?.errors).toContain(
      "Has more values than there are columns (check for an unquoted comma).",
    );
  });

  it("rejects bad files before looking at rows", () => {
    expect(run("").fileErrors).toEqual(["The file is empty."]);
    expect(run("kind,question\nviva,Q").fileErrors).toEqual([
      "Missing required column(s): answer.",
    ]);
    expect(run("kind,question,answer,sesions\nviva,Q,A,x").fileErrors[0]).toMatch(
      /^Unknown column: sesions\./,
    );
    expect(run("kind,question,answer").fileErrors).toEqual([
      "The file has a header but no questions.",
    ]);
    expect(run('kind,question,answer\nviva,"Q,A').fileErrors[0]).toMatch(/never closed/);
  });
});
