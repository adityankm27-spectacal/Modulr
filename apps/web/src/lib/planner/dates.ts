/**
 * Calendar-day helpers. Days are "YYYY-MM-DD" strings in the student's own timezone
 * (never converted through UTC), so an exam on the 5th stays on the 5th.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local midnight for an ISO day. Returns null for anything that isn't a real date. */
export function parseISODate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
    ? date
    : null;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole days from a to b (b later = positive). Immune to daylight-saving shifts. */
export function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / DAY_MS);
}

export interface GridCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

/** Six Monday-first weeks covering the month (month is 0-11). */
export function monthGrid(year: number, month: number): GridCell[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(year, month, 1 - offset + i);
    return { iso: toISODate(date), day: date.getDate(), inMonth: date.getMonth() === month };
  });
}

interface Spanning {
  starts_on: string;
  ends_on: string | null;
}

/** Longest range expanded onto the grid; guards against a mistyped end date. */
const MAX_SPAN_DAYS = 120;

/** Groups events by every day they cover, so a week-long holiday marks all seven days. */
export function eventsByDay<T extends Spanning>(events: readonly T[]): Map<string, T[]> {
  const byDay = new Map<string, T[]>();
  for (const event of events) {
    const start = parseISODate(event.starts_on);
    if (!start) continue;
    const end = (event.ends_on && parseISODate(event.ends_on)) || start;
    const span = Math.min(Math.max(daysBetween(start, end), 0), MAX_SPAN_DAYS);
    for (let i = 0; i <= span; i++) {
      const iso = toISODate(addDays(start, i));
      const list = byDay.get(iso);
      if (list) list.push(event);
      else byDay.set(iso, [event]);
    }
  }
  return byDay;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

export const monthName = (month: number) => MONTHS[month] ?? "";

/** "Fri, 13 Nov" */
export function formatDay(iso: string): string {
  const date = parseISODate(iso);
  if (!date) return iso;
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "13 Nov" or "13 Nov – 20 Nov" */
export function formatRange(startsOn: string, endsOn: string | null): string {
  const short = (iso: string) => {
    const date = parseISODate(iso);
    return date ? `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}` : iso;
  };
  return endsOn && endsOn !== startsOn ? `${short(startsOn)} – ${short(endsOn)}` : short(startsOn);
}

export const isOverdue = (dueOn: string, todayIso: string) => dueOn < todayIso;
