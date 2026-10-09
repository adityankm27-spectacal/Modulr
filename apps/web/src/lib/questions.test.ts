import { describe, expect, it } from "vitest";
import {
  filterOptions,
  filterQuestions,
  parseQuestionFilters,
  sessionSortKey,
  sortByFrequency,
} from "./questions";

const qs = [
  { id: "a", marks: 5, sessions: ["May 2024"], frequency: "sometimes" as const },
  { id: "b", marks: 2, sessions: ["Dec 2023", "May 2022"], frequency: "very_frequent" as const },
  { id: "c", marks: 5, sessions: [], frequency: null },
  { id: "d", marks: null, sessions: ["Dec 2023"], frequency: "frequent" as const },
];

describe("sessionSortKey", () => {
  it("orders exam sessions chronologically", () => {
    expect(sessionSortKey("Dec 2023")).toBeGreaterThan(sessionSortKey("May 2023"));
    expect(sessionSortKey("May 2024")).toBeGreaterThan(sessionSortKey("Dec 2023"));
    expect(sessionSortKey("December 2023")).toBe(sessionSortKey("Dec 2023"));
    expect(sessionSortKey("Supplementary")).toBe(-1);
  });
});

describe("filterOptions", () => {
  it("lists distinct marks ascending and sessions newest first", () => {
    expect(filterOptions(qs)).toEqual({
      marks: [2, 5],
      sessions: ["May 2024", "Dec 2023", "May 2022"],
    });
  });
});

describe("filterQuestions", () => {
  it("filters by marks and session together", () => {
    expect(filterQuestions(qs, { marks: null, session: null }).map((q) => q.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(filterQuestions(qs, { marks: 5, session: null }).map((q) => q.id)).toEqual(["a", "c"]);
    expect(filterQuestions(qs, { marks: null, session: "Dec 2023" }).map((q) => q.id)).toEqual([
      "b",
      "d",
    ]);
    expect(filterQuestions(qs, { marks: 2, session: "Dec 2023" }).map((q) => q.id)).toEqual(["b"]);
  });
});

describe("parseQuestionFilters", () => {
  it("accepts valid values and ignores junk", () => {
    expect(parseQuestionFilters({ marks: "5", session: " May 2024 " })).toEqual({
      marks: 5,
      session: "May 2024",
    });
    expect(parseQuestionFilters({ marks: "abc", session: "" })).toEqual({
      marks: null,
      session: null,
    });
    expect(parseQuestionFilters({ marks: ["10", "2"] })).toEqual({ marks: 10, session: null });
  });
});

describe("sortByFrequency", () => {
  it("puts the most frequent first and unknown last", () => {
    expect(sortByFrequency(qs).map((q) => q.id)).toEqual(["b", "d", "a", "c"]);
  });
});
