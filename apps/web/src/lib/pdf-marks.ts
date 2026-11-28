/**
 * Pen and highlighter marks that students draw on view-only PDFs. Pure logic only (no
 * DOM), so it can be unit-tested; the overlay lives in components/content/pdf-viewer.tsx.
 *
 * Points are stored as fractions of the page's width and height (0..1), and line widths
 * as a fraction of the page width, so a mark stays on the same line at any zoom or
 * screen width. Marks are saved per device in localStorage, one entry per user and PDF.
 */

export type MarkTool = "pen" | "highlighter";

export interface Stroke {
  tool: MarkTool;
  color: string;
  /** Flat list of normalised coordinates: x0, y0, x1, y1, … */
  points: number[];
}

/** Strokes per page number (1-based). Pages without marks are left out. */
export type PageMarks = Record<number, Stroke[]>;

export const MARK_COLORS = [
  { id: "yellow", label: "Yellow", value: "#facc15" },
  { id: "green", label: "Green", value: "#22c55e" },
  { id: "blue", label: "Blue", value: "#3b82f6" },
  { id: "red", label: "Red", value: "#ef4444" },
] as const;

const ALLOWED_COLORS: ReadonlySet<string> = new Set(MARK_COLORS.map((c) => c.value));

/** Line width as a fraction of page width, and opacity. */
export const TOOL_STYLE: Record<MarkTool, { width: number; alpha: number }> = {
  pen: { width: 0.003, alpha: 1 },
  highlighter: { width: 0.03, alpha: 0.4 },
};

/** Stored precision: 1/10000 of the page is well under a pixel on any screen. */
const PRECISION = 10_000;
/** Skip points closer than this (in page-width fractions) to the previous one. */
const MIN_STEP = 0.0015;
/** Hard caps so a runaway entry can't fill localStorage. */
const MAX_STROKES_PER_PAGE = 500;
const MAX_POINTS_PER_STROKE = 4_000;

const STORAGE_PREFIX = "modulr:pdf-marks:v1";

export function storageKey(userId: string | null, documentKey: string): string {
  return `${STORAGE_PREFIX}:${userId ?? "guest"}:${documentKey}`;
}

/** Coordinate i of a flat point list (0 past the end, which callers never reach). */
const at = (p: number[], i: number) => p[i] ?? 0;

const round = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * PRECISION) / PRECISION;

/**
 * Appends a point (already normalised) to a stroke's point list unless it is too close to
 * the last one. `aspect` is page width / height, so distances are measured in true page
 * proportions. Returns true if the point was added.
 */
export function addPoint(points: number[], x: number, y: number, aspect: number): boolean {
  if (points.length >= MAX_POINTS_PER_STROKE * 2) return false;
  const nx = round(x);
  const ny = round(y);
  const n = points.length;
  if (n >= 2) {
    const dx = nx - (points[n - 2] ?? 0);
    const dy = (ny - (points[n - 1] ?? 0)) / aspect;
    if (Math.hypot(dx, dy) < MIN_STEP) return false;
  }
  points.push(nx, ny);
  return true;
}

/** Squared distance from point p to segment a–b. */
function segmentDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return cx * cx + cy * cy;
}

/**
 * Whether the eraser at (x, y) touches a stroke. Coordinates are normalised; `aspect` is
 * page width / height and `radius` is a fraction of page width. The stroke's own half
 * width counts too, so a wide highlighter is easy to hit.
 */
export function strokeHit(
  stroke: Stroke,
  x: number,
  y: number,
  radius: number,
  aspect: number,
): boolean {
  // Work in units of page width: y fractions are scaled by height / width.
  const sy = 1 / aspect;
  const reach = radius + TOOL_STYLE[stroke.tool].width / 2;
  const reachSq = reach * reach;
  const p = stroke.points;
  if (p.length === 2) {
    const dx = at(p, 0) - x;
    const dy = (at(p, 1) - y) * sy;
    return dx * dx + dy * dy <= reachSq;
  }
  for (let i = 2; i < p.length; i += 2) {
    const d = segmentDistSq(
      x,
      y * sy,
      at(p, i - 2),
      at(p, i - 1) * sy,
      at(p, i),
      at(p, i + 1) * sy,
    );
    if (d <= reachSq) return true;
  }
  return false;
}

/** The strokes left after erasing at (x, y); the same array if nothing was hit. */
export function eraseAt(
  strokes: Stroke[],
  x: number,
  y: number,
  radius: number,
  aspect: number,
): Stroke[] {
  const kept = strokes.filter((s) => !strokeHit(s, x, y, radius, aspect));
  return kept.length === strokes.length ? strokes : kept;
}

function isStroke(value: unknown): value is Stroke {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    (s.tool === "pen" || s.tool === "highlighter") &&
    typeof s.color === "string" &&
    ALLOWED_COLORS.has(s.color) &&
    Array.isArray(s.points) &&
    s.points.length >= 2 &&
    s.points.length % 2 === 0 &&
    s.points.length <= MAX_POINTS_PER_STROKE * 2 &&
    s.points.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1)
  );
}

/** Reads saved marks, dropping anything malformed. Never throws. */
export function parseMarks(raw: string | null): PageMarks {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  const pages = (data as { pages?: unknown } | null)?.pages;
  if (!pages || typeof pages !== "object") return {};
  const out: PageMarks = {};
  for (const [key, list] of Object.entries(pages)) {
    const page = Number(key);
    if (!Number.isInteger(page) || page < 1 || !Array.isArray(list)) continue;
    const strokes = list.filter(isStroke).slice(0, MAX_STROKES_PER_PAGE);
    if (strokes.length > 0) out[page] = strokes;
  }
  return out;
}

/** Serialises marks for storage, or null when there are none (so the entry is removed). */
export function serializeMarks(marks: PageMarks): string | null {
  const pages: PageMarks = {};
  for (const [key, strokes] of Object.entries(marks)) {
    if (strokes.length > 0) pages[Number(key)] = strokes.slice(-MAX_STROKES_PER_PAGE);
  }
  if (Object.keys(pages).length === 0) return null;
  return JSON.stringify({ pages });
}

export function loadMarks(key: string): PageMarks {
  try {
    return parseMarks(window.localStorage.getItem(key));
  } catch {
    return {};
  }
}

/** Saves marks; returns false if storage is unavailable or full. */
export function saveMarks(key: string, marks: PageMarks): boolean {
  try {
    const value = serializeMarks(marks);
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
