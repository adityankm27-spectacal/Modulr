import { readChapters } from "@modulr/shared";
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
