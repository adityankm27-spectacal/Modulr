/** Pure playback rules shared by the player and its tests. */

export const SAVE_INTERVAL_MS = 15_000;
const MIN_POSITION_CHANGE_SEC = 3;

/** Save while playing every ~15s, and only when the position actually moved. */
export function shouldSaveProgress(input: {
  now: number;
  lastSavedAt: number;
  lastSavedPosition: number;
  position: number;
}): boolean {
  return (
    input.now - input.lastSavedAt >= SAVE_INTERVAL_MS &&
    Math.abs(input.position - input.lastSavedPosition) >= MIN_POSITION_CHANGE_SEC
  );
}

/** Watched to (nearly) the end: within the last 5% or the last 15 seconds. */
export function isCompleted(position: number, duration: number | null): boolean {
  if (!duration || duration <= 0) return false;
  return position >= duration * 0.95 || duration - position <= 15;
}

/**
 * Where to resume. Skips trivially early positions and restarts videos that
 * were finished (or nearly finished) so "resume" never lands on the credits.
 */
export function resumePosition(
  saved: number | null,
  duration: number | null,
  completed: boolean,
): number {
  if (!saved || completed || saved < 10) return 0;
  if (duration && isCompleted(saved, duration)) return 0;
  return Math.max(0, saved - 3); // a little context before the stopping point
}

/** Index of the chapter playing at `time`, or -1 before the first chapter. */
export function currentChapterIndex(
  chapters: ReadonlyArray<{ start_sec: number }>,
  time: number,
): number {
  let index = -1;
  chapters.forEach((c, i) => {
    if (time >= c.start_sec) index = i;
  });
  return index;
}

/**
 * Next watermark position (percent offsets). Always moves to a different
 * quadrant so a crop or blur can't remove it for long (spec §5.5).
 */
export function nextWatermarkPosition(
  previous: { top: number; left: number } | null,
  random: () => number = Math.random,
): { top: number; left: number } {
  const quadrant = (p: { top: number; left: number }) =>
    (p.top < 45 ? 0 : 2) + (p.left < 45 ? 0 : 1);
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = { top: 6 + random() * 72, left: 4 + random() * 56 };
    if (!previous || quadrant(candidate) !== quadrant(previous)) return candidate;
  }
  return previous && previous.top < 45 ? { top: 70, left: previous.left } : { top: 8, left: 8 };
}
