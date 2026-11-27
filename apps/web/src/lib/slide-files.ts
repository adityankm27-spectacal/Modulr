/**
 * Files on a module's Slides tab: decks and handouts uploaded as PowerPoint, PDF or
 * Word. Stored as `documents` rows of kind "slides" (several per module), with the
 * file in the private `slides` bucket at `<module id>/<random uuid>.<ext>`.
 */

/** Matches the `slides` bucket's file_size_limit. */
export const SLIDE_MAX_BYTES = 50 * 1024 * 1024;

export const SLIDE_FILE_TYPES = {
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    label: "PowerPoint",
  },
  ppt: { mime: "application/vnd.ms-powerpoint", label: "PowerPoint" },
  pdf: { mime: "application/pdf", label: "PDF" },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word",
  },
  doc: { mime: "application/msword", label: "Word" },
} as const;

export type SlideExtension = keyof typeof SLIDE_FILE_TYPES;
export const SLIDE_EXTENSIONS = Object.keys(SLIDE_FILE_TYPES) as SlideExtension[];

/** For the file picker's `accept`. */
export const SLIDE_ACCEPT = SLIDE_EXTENSIONS.flatMap((ext) => [
  `.${ext}`,
  SLIDE_FILE_TYPES[ext].mime,
]).join(",");

/** Storage path written by the admin's browser: `<module uuid>/<uuid>.<ext>`. */
export const SLIDE_PATH_PATTERN = new RegExp(
  `^[0-9a-f-]{36}/[0-9a-f-]{36}\\.(${SLIDE_EXTENSIONS.join("|")})$`,
);

/** The file's extension if it is one we accept (by name: browsers often omit the MIME type of .ppt/.doc). */
export function slideExtension(fileName: string): SlideExtension | null {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  return ext in SLIDE_FILE_TYPES && fileName.includes(".") ? (ext as SlideExtension) : null;
}

/** Why a file can't be uploaded, or null when it can. */
export function slideFileProblem(file: { name: string; size: number }): string | null {
  if (!slideExtension(file.name)) return "Choose a .pptx, .ppt, .pdf, .docx or .doc file.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > SLIDE_MAX_BYTES) return "The file is larger than 50 MB.";
  return null;
}

/** Title shown to students when the admin doesn't type one: the file name without its extension. */
export function slideTitleFromFileName(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_]+/g, " ")
    .trim();
  return (base || "Slides").slice(0, 200);
}

export function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
