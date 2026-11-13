import { CALENDAR_EVENT_KINDS, type CalendarEventKind } from "@modulr/shared";
import { parseCsv } from "@/lib/csv";
import { addDays, parseISODate, toISODate } from "@/lib/planner/dates";

/**
 * Reads a college calendar for the planner (admin import). Two formats:
 *  - .ics, the calendar file most colleges and Google Calendar export
 *  - .csv with a header row: title, date, end_date, kind, notes
 * Nothing is saved from here; the admin sees a per-row report first.
 */
export const MAX_CALENDAR_IMPORT_BYTES = 1_000_000;
export const MAX_CALENDAR_EVENTS = 1000;
export const CALENDAR_CSV_COLUMNS = ["title", "date", "end_date", "kind", "notes"] as const;

export interface ImportedEvent {
  title: string;
  kind: CalendarEventKind;
  starts_on: string;
  ends_on: string | null;
  notes: string | null;
}

export interface ImportRow {
  line: number;
  title: string;
  date: string;
  errors: string[];
  value: ImportedEvent | null;
}

export interface CalendarImportValidation {
  fileErrors: string[];
  rows: ImportRow[];
  validCount: number;
}

interface RawEvent {
  line: number;
  title: string;
  start: string;
  end: string;
  kind: string;
  notes: string;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Accepts 2026-12-05, 05/12/2026 and 5-12-2026 (day first, as in India), and "5 Dec 2026". */
export function parseCalendarDate(raw: string): string | null {
  const value = raw.trim();
  let year: number, month: number, day: number;
  let match: RegExpExecArray | null;
  if ((match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value))) {
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])] as [
      number,
      number,
      number,
    ];
  } else if ((match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value))) {
    [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])] as [
      number,
      number,
      number,
    ];
  } else if ((match = /^(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})$/.exec(value))) {
    const index = MONTHS.indexOf((match[2] ?? "").slice(0, 3).toLowerCase());
    if (index < 0) return null;
    [day, month, year] = [Number(match[1]), index + 1, Number(match[3])] as [
      number,
      number,
      number,
    ];
  } else {
    return null;
  }
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return parseISODate(iso) ? iso : null;
}

const KIND_WORDS: Record<string, CalendarEventKind> = {
  test: "exam",
  exams: "exam",
  examination: "exam",
  vacation: "holiday",
  break: "holiday",
  submission: "deadline",
  due: "deadline",
  other: "event",
};

/** Guesses the kind from the title when the file doesn't say. */
export function inferKind(title: string): CalendarEventKind {
  const t = title.toLowerCase();
  // Deadlines first: "exam form last date" is a deadline, not an exam.
  if (/\b(deadline|submission|submit|last date|due)\b/.test(t)) return "deadline";
  if (
    /\b(exams?|tests?|viva|practical (exam|test)s?|ia[- ]?\d|mid[- ]?terms?|term[- ]?end|end[- ]?term)\b/.test(
      t,
    )
  ) {
    return "exam";
  }
  if (
    /\b(holidays?|vacation|diwali|dussehra|holi|eid|christmas|ganesh|ganpati|break|no lectures?|college closed|closed)\b/.test(
      t,
    )
  ) {
    return "holiday";
  }
  return "event";
}

function resolveKind(raw: string, title: string): CalendarEventKind | null {
  const value = raw.trim().toLowerCase();
  if (!value) return inferKind(title);
  const direct = CALENDAR_EVENT_KINDS.find((kind) => kind === value);
  return direct ?? KIND_WORDS[value] ?? null;
}

/** Turns raw events into a validated, per-row report. */
function validateEvents(raw: RawEvent[]): CalendarImportValidation {
  if (raw.length === 0) {
    return { fileErrors: ["No events found in this file."], rows: [], validCount: 0 };
  }
  if (raw.length > MAX_CALENDAR_EVENTS) {
    return {
      fileErrors: [`This file has ${raw.length} events; the limit is ${MAX_CALENDAR_EVENTS}.`],
      rows: [],
      validCount: 0,
    };
  }
  const rows = raw.map((event): ImportRow => {
    const errors: string[] = [];
    const title = event.title.trim().replace(/\s+/g, " ");
    if (!title) errors.push("title is empty.");
    else if (title.length > 120) errors.push("title is longer than 120 characters.");

    const start = parseCalendarDate(event.start);
    if (!event.start.trim()) errors.push("date is empty.");
    else if (!start) errors.push(`"${event.start}" isn't a date. Use 2026-12-05 or 05/12/2026.`);

    let end: string | null = null;
    if (event.end.trim()) {
      end = parseCalendarDate(event.end);
      if (!end) errors.push(`end date "${event.end}" isn't a date.`);
      else if (start && end < start) errors.push("end date is before the start date.");
    }

    const kind = resolveKind(event.kind, title);
    if (!kind) errors.push(`kind must be one of ${CALENDAR_EVENT_KINDS.join(", ")}.`);

    const notes = event.notes.trim();
    if (notes.length > 500) errors.push("notes are longer than 500 characters.");

    const value =
      errors.length === 0 && start && kind
        ? {
            title,
            kind,
            starts_on: start,
            ends_on: end && end !== start ? end : null,
            notes: notes || null,
          }
        : null;
    return { line: event.line, title, date: event.start.trim(), errors, value };
  });
  return { fileErrors: [], rows, validCount: rows.filter((r) => r.value).length };
}

// --- CSV ---------------------------------------------------------------------

const ALIASES: Record<string, (typeof CALENDAR_CSV_COLUMNS)[number]> = {
  title: "title",
  event: "title",
  name: "title",
  summary: "title",
  date: "date",
  start: "date",
  start_date: "date",
  from: "date",
  end_date: "end_date",
  end: "end_date",
  to: "end_date",
  kind: "kind",
  type: "kind",
  category: "kind",
  notes: "notes",
  note: "notes",
  description: "notes",
};

function rawFromCsv(text: string): { events: RawEvent[]; errors: string[] } {
  const rows = parseCsv(text);
  const [header, ...body] = rows;
  if (!header) return { events: [], errors: ["The file is empty."] };

  const columns = new Map<(typeof CALENDAR_CSV_COLUMNS)[number], number>();
  header.cells.forEach((cell, i) => {
    const key =
      ALIASES[
        cell
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_")
      ];
    if (key && !columns.has(key)) columns.set(key, i);
  });
  const missing = (["title", "date"] as const).filter((c) => !columns.has(c));
  if (missing.length) {
    return {
      events: [],
      errors: [
        `The first row must be a header with the columns: ${CALENDAR_CSV_COLUMNS.join(", ")}. Missing: ${missing.join(", ")}.`,
      ],
    };
  }
  const get = (cells: string[], column: (typeof CALENDAR_CSV_COLUMNS)[number]) =>
    cells[columns.get(column) ?? -1] ?? "";
  return {
    events: body.map((row) => ({
      line: row.line,
      title: get(row.cells, "title"),
      start: get(row.cells, "date"),
      end: get(row.cells, "end_date"),
      kind: get(row.cells, "kind"),
      notes: get(row.cells, "notes"),
    })),
    errors: [],
  };
}

// --- ICS ---------------------------------------------------------------------

function unescapeIcs(value: string): string {
  return value.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1");
}

/** 20261205, 20261205T093000 and 20261205T193000Z → an ISO day in India time. */
function icsDay(value: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim());
  if (!match) return null;
  const [, y = "", mo = "", d = "", h = "0", mi = "0", sec = "0", utc] = match;
  if (utc) {
    // Stored in UTC; the college's calendar day is the day in India (UTC+5:30).
    const shifted = new Date(
      Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec)) +
        5.5 * 60 * 60 * 1000,
    );
    return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
  }
  return `${y}-${mo}-${d}`;
}

function rawFromIcs(text: string): { events: RawEvent[]; errors: string[] } {
  // Long lines are folded: a continuation starts with a space or tab.
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: RawEvent[] = [];
  let current: { line: number; props: Map<string, { params: string; value: string }> } | null =
    null;

  lines.forEach((line, index) => {
    const upper = line.trim().toUpperCase();
    if (upper === "BEGIN:VEVENT") {
      current = { line: index + 1, props: new Map() };
      return;
    }
    if (upper === "END:VEVENT" && current) {
      const props = current.props;
      const get = (name: string) => props.get(name);
      const start = get("DTSTART");
      const end = get("DTEND");
      const allDay =
        (start?.params ?? "").toUpperCase().includes("VALUE=DATE") && !/T/.test(start?.value ?? "");
      let endDay = end ? icsDay(end.value) : null;
      const startDay = start ? icsDay(start.value) : null;
      if (endDay && startDay && allDay) {
        // All-day events end on the next day (exclusive); show the last day itself.
        const last = parseISODate(endDay);
        endDay = last ? toISODate(addDays(last, -1)) : endDay;
      }
      events.push({
        line: current.line,
        title: unescapeIcs(get("SUMMARY")?.value ?? ""),
        start: startDay ?? start?.value ?? "",
        end: endDay && endDay !== startDay ? endDay : "",
        kind: "",
        notes: unescapeIcs(get("DESCRIPTION")?.value ?? ""),
      });
      current = null;
      return;
    }
    if (!current) return;
    const colon = line.indexOf(":");
    if (colon < 0) return;
    const [name = "", ...params] = line.slice(0, colon).split(";");
    const key = name.toUpperCase();
    if (!current.props.has(key)) {
      current.props.set(key, { params: params.join(";"), value: line.slice(colon + 1) });
    }
  });
  return { events, errors: events.length ? [] : ["No events found in this calendar file."] };
}

/** Validates an uploaded calendar file. `fileName` only helps pick the format. */
export function validateCalendarImport(text: string, fileName = ""): CalendarImportValidation {
  const isIcs = /\.ics$/i.test(fileName) || /^\s*BEGIN:VCALENDAR/i.test(text);
  try {
    const { events, errors } = isIcs ? rawFromIcs(text) : rawFromCsv(text);
    if (errors.length) return { fileErrors: errors, rows: [], validCount: 0 };
    return validateEvents(events);
  } catch {
    return { fileErrors: ["This file couldn't be read."], rows: [], validCount: 0 };
  }
}
