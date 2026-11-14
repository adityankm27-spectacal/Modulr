import { formatTimestamp, parseTimestamp, readChapters } from "@modulr/shared";
import type { ProviderVideoStatus } from "./types";

/**
 * Provider-generated chapters (e.g. Bunny Smart Chapters) fill in a video's chapters
 * only while it has none, so chapters written or edited by an admin are never replaced.
 * Returns the column update to apply, or an empty object for no change.
 */
export function providerChaptersUpdate(
  current: unknown,
  status: Pick<ProviderVideoStatus, "chapters">,
): { chapters?: ProviderVideoStatus["chapters"] } {
  if (readChapters(current).length > 0 || status.chapters.length === 0) return {};
  return { chapters: status.chapters };
}

/**
 * Adds a chapter at `seconds` to the chapters text (one `m:ss Title` per line), keeping the
 * lines in time order. If a chapter already starts within a second of that time, nothing is
 * added and its line is returned instead. `line` is the index of the new or existing line.
 */
export function insertChapterLine(
  text: string,
  seconds: number,
  title = "New chapter",
): { text: string; line: number; created: boolean } {
  const at = Math.max(0, Math.floor(seconds));
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const startOf = (line: string) => parseTimestamp(line.trim().split(/\s+/)[0] ?? "");

  const existing = lines.findIndex((l) => {
    const start = startOf(l);
    return start !== null && Math.abs(start - at) <= 1;
  });
  if (existing !== -1) return { text: lines.join("\n"), line: existing, created: false };

  const added = `${formatTimestamp(at)} ${title}`;
  // Goes before the first chapter that starts later; unreadable lines are left where they are.
  const before = lines.findIndex((l) => {
    const start = startOf(l);
    return start !== null && start > at;
  });
  const index = before === -1 ? lines.length : before;
  lines.splice(index, 0, added);
  return { text: lines.join("\n"), line: index, created: true };
}
