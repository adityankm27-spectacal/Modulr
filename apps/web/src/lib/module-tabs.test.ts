import { describe, expect, it } from "vitest";
import {
  countsSummary,
  moduleTabs,
  parseModuleTab,
  tabCount,
  type ModuleCounts,
} from "./module-tabs";

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
  slides: 0,
  code_programs: 0,
  has_code_sheet: false,
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
  slides: 0,
  code_programs: 0,
  has_code_sheet: false,
};

describe("parseModuleTab", () => {
  it("accepts known tabs and defaults to videos", () => {
    expect(parseModuleTab("pyqs")).toBe("pyqs");
    expect(parseModuleTab(["viva", "notes"])).toBe("viva");
    expect(parseModuleTab("nope")).toBe("videos");
    expect(parseModuleTab(undefined)).toBe("videos");
  });

  it("only opens the Code tab in subjects that have it", () => {
    expect(parseModuleTab("code")).toBe("videos");
    expect(parseModuleTab("code", { hasCodeTab: true })).toBe("code");
  });
});

describe("moduleTabs", () => {
  it("hides the Code tab unless the subject turns it on", () => {
    expect(moduleTabs().map((t) => t.id)).not.toContain("code");
    expect(moduleTabs({ hasCodeTab: true }).map((t) => t.id)).toContain("code");
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
    expect(tabCount("slides", { ...counts, slides: 3 })).toBe(3);
    expect(tabCount("code", { ...counts, code_programs: 4 })).toBe(4);
    expect(tabCount("code", { ...counts, code_programs: 4, has_code_sheet: true })).toBe(5);
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
