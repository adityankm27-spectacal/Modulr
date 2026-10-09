/**
 * Parsing and formatting for structured content fields that admins edit as text
 * (video chapters, formula symbols) and the guards that read them back from jsonb.
 */

// Type aliases (not interfaces) so they are assignable to the generated jsonb `Json` type.
export type VideoChapter = {
  title: string;
  start_sec: number;
};

export type FormulaSymbol = {
  symbol: string;
  meaning: string;
};

export interface ParseResult<T> {
  items: T[];
  /** Human-readable problems, each prefixed with the 1-based line number. */
  errors: string[];
}

/** "1:35" → 95, "1:02:03" → 3723, "90" → 90. Returns null when invalid. */
export function parseTimestamp(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d{1,5}$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length > 1 && nums.slice(1).some((n) => n >= 60)) return null;
  return nums.reduce((total, n) => total * 60 + n, 0);
}

/** 95 → "1:35", 3723 → "1:02:03". */
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** One chapter per line: `m:ss Title`. Start times must be strictly increasing. */
export function parseChapters(text: string): ParseResult<VideoChapter> {
  const items: VideoChapter[] = [];
  const errors: string[] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const match = /^(\S+)\s+(.+)$/.exec(line);
    const start = match ? parseTimestamp(match[1] as string) : null;
    if (!match || start === null) {
      errors.push(`Line ${index + 1}: start with a time like 1:35, then the chapter title.`);
      return;
    }
    const previous = items[items.length - 1];
    if (previous && start <= previous.start_sec) {
      errors.push(`Line ${index + 1}: times must be in increasing order.`);
      return;
    }
    items.push({ title: (match[2] as string).trim(), start_sec: start });
  });

  return { items, errors };
}

export function formatChapters(chapters: readonly VideoChapter[]): string {
  return chapters.map((c) => `${formatTimestamp(c.start_sec)} ${c.title}`).join("\n");
}

/** One symbol per line: `symbol :: meaning` (the symbol is LaTeX). */
export function parseSymbols(text: string): ParseResult<FormulaSymbol> {
  const items: FormulaSymbol[] = [];
  const errors: string[] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const at = line.indexOf("::");
    const symbol = at >= 0 ? line.slice(0, at).trim() : "";
    const meaning = at >= 0 ? line.slice(at + 2).trim() : "";
    if (!symbol || !meaning) {
      errors.push(`Line ${index + 1}: write it as  symbol :: meaning`);
      return;
    }
    items.push({ symbol, meaning });
  });

  return { items, errors };
}

export function formatSymbols(symbols: readonly FormulaSymbol[]): string {
  return symbols.map((s) => `${s.symbol} :: ${s.meaning}`).join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads the `videos.chapters` jsonb column, dropping malformed entries. */
export function readChapters(value: unknown): VideoChapter[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    isRecord(item) && typeof item.title === "string" && typeof item.start_sec === "number"
      ? [{ title: item.title, start_sec: item.start_sec }]
      : [],
  );
}

/** Reads the `formula_cards.symbols` jsonb column, dropping malformed entries. */
export function readSymbols(value: unknown): FormulaSymbol[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    isRecord(item) && typeof item.symbol === "string" && typeof item.meaning === "string"
      ? [{ symbol: item.symbol, meaning: item.meaning }]
      : [],
  );
}
