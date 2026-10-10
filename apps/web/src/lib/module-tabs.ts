/** The six sections every module pack has (spec §4), in display order. */
export const MODULE_TABS = [
  { id: "videos", label: "Videos" },
  { id: "notes", label: "Short notes" },
  { id: "formulas", label: "Formulas" },
  { id: "pyqs", label: "PYQs" },
  { id: "important", label: "Important Qs" },
  { id: "viva", label: "Viva" },
] as const;

export type ModuleTabId = (typeof MODULE_TABS)[number]["id"];

export function parseModuleTab(value: string | string[] | undefined): ModuleTabId {
  const raw = Array.isArray(value) ? value[0] : value;
  return MODULE_TABS.find((tab) => tab.id === raw)?.id ?? "videos";
}

export interface ModuleCounts {
  videos: number;
  has_short_notes: boolean;
  has_formula_sheet: boolean;
  formula_cards: number;
  pyqs: number;
  important_questions: number;
  viva_questions: number;
  /** A published PDF question sheet on that tab (counts as one item). */
  has_pyq_sheet: boolean;
  has_important_sheet: boolean;
  has_viva_sheet: boolean;
}

export function tabCount(tab: ModuleTabId, counts: ModuleCounts | undefined): number {
  if (!counts) return 0;
  switch (tab) {
    case "videos":
      return counts.videos;
    case "notes":
      return counts.has_short_notes ? 1 : 0;
    case "formulas":
      return (
        counts.formula_cards + (counts.has_formula_sheet && counts.formula_cards === 0 ? 1 : 0)
      );
    case "pyqs":
      return counts.pyqs + (counts.has_pyq_sheet ? 1 : 0);
    case "important":
      return counts.important_questions + (counts.has_important_sheet ? 1 : 0);
    case "viva":
      return counts.viva_questions + (counts.has_viva_sheet ? 1 : 0);
  }
}

/** Short summary for module lists, e.g. "2 videos · Notes · 3 PYQs". */
export function countsSummary(counts: ModuleCounts | undefined): string {
  if (!counts) return "Coming soon";
  const parts: string[] = [];
  if (counts.videos) parts.push(`${counts.videos} ${counts.videos === 1 ? "video" : "videos"}`);
  if (counts.has_short_notes) parts.push("Notes");
  if (counts.formula_cards || counts.has_formula_sheet) parts.push("Formulas");
  if (counts.pyqs) parts.push(`${counts.pyqs} ${counts.pyqs === 1 ? "PYQ" : "PYQs"}`);
  else if (counts.has_pyq_sheet) parts.push("PYQs");
  const otherQuestions = counts.important_questions + counts.viva_questions;
  if (otherQuestions) parts.push(`${otherQuestions} more Qs`);
  else if (counts.has_important_sheet || counts.has_viva_sheet) parts.push("More Qs");
  return parts.length ? parts.join(" · ") : "Coming soon";
}
