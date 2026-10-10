import { describe, expect, it } from "vitest";
import { countsSummary, parseModuleTab, tabCount, type ModuleCounts } from "./module-tabs";

const counts: ModuleCounts = {
  videos: 2,
  has_short_notes: true,
  has_formula_sheet: true,
  formula_cards: 2,
  pyqs: 3,
  important_questions: 3,
  viva_questions: 1,
  has_pyq_sheet: false,
  has_important_sheet: false,
  has_viva_sheet: false,
};

const empty: ModuleCounts = {
  videos: 0,
  has_short_notes: false,
  has_formula_sheet: false,
  formula_cards: 0,
  pyqs: 0,
  important_questions: 0,
  viva_questions: 0,
  has_pyq_sheet: false,
  has_important_sheet: false,
  has_viva_sheet: false,
};

describe("parseModuleTab", () => {
  it("accepts known tabs and defaults to videos", () => {
    expect(parseModuleTab("pyqs")).toBe("pyqs");
    expect(parseModuleTab(["viva", "notes"])).toBe("viva");
    expect(parseModuleTab("nope")).toBe("videos");
    expect(parseModuleTab(undefined)).toBe("videos");
  });
});

describe("tabCount", () => {
  it("maps counts to tabs", () => {
    expect(tabCount("videos", counts)).toBe(2);
    expect(tabCount("notes", counts)).toBe(1);
    expect(tabCount("formulas", counts)).toBe(2);
    expect(tabCount("formulas", { ...counts, formula_cards: 0 })).toBe(1);
    expect(tabCount("viva", counts)).toBe(1);
    expect(tabCount("pyqs", undefined)).toBe(0);
  });

  it("counts a PDF question sheet as content on its tab", () => {
    expect(tabCount("pyqs", { ...empty, has_pyq_sheet: true })).toBe(1);
    expect(tabCount("pyqs", { ...counts, has_pyq_sheet: true })).toBe(4);
    expect(tabCount("important", { ...empty, has_important_sheet: true })).toBe(1);
    expect(tabCount("viva", { ...empty, has_viva_sheet: true })).toBe(1);
  });
});

describe("countsSummary", () => {
  it("summarises what a module contains", () => {
    expect(countsSummary(counts)).toBe("2 videos · Notes · Formulas · 3 PYQs · 4 more Qs");
  });

  it("says coming soon for empty modules", () => {
    expect(countsSummary(undefined)).toBe("Coming soon");
    expect(countsSummary(empty)).toBe("Coming soon");
  });

  it("mentions question PDFs when there are no question rows", () => {
    expect(countsSummary({ ...empty, has_pyq_sheet: true, has_viva_sheet: true })).toBe(
      "PYQs · More Qs",
    );
  });
});
