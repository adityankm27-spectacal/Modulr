import type { QuestionKind } from "@modulr/shared";

/**
 * Every module tab that can show an uploaded PDF, stored as one `documents` row per
 * module and kind (documents_one_per_kind). Short notes and formula sheets also have
 * Markdown; the question sheets are PDF-only and sit above that tab's question list.
 */
export const PDF_DOCUMENT_KINDS = [
  "short_notes",
  "formula_sheet",
  "pyq_sheet",
  "important_sheet",
  "viva_sheet",
] as const;
export type PdfDocumentKind = (typeof PDF_DOCUMENT_KINDS)[number];

/** The PDF sheet shown on each question tab. */
export const QUESTION_SHEET_KIND: Record<QuestionKind, PdfDocumentKind> = {
  pyq: "pyq_sheet",
  important: "important_sheet",
  viva: "viva_sheet",
};

/** What the PDF is called in admin, and the default title for a new one. */
export const PDF_LABELS: Record<PdfDocumentKind, string> = {
  short_notes: "Short notes",
  formula_sheet: "Formula sheet",
  pyq_sheet: "PYQ paper",
  important_sheet: "Important questions",
  viva_sheet: "Viva questions",
};
