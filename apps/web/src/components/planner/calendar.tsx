"use client";

import type { CalendarEventKind } from "@modulr/shared";
import { CALENDAR_EVENT_KINDS } from "@modulr/shared";
import { ChevronLeft, ChevronRight, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteEvent, saveEvent } from "@/lib/planner/actions";
import {
  eventsByDay,
  formatDay,
  formatRange,
  monthGrid,
  monthName,
  parseISODate,
  toISODate,
} from "@/lib/planner/dates";
import type { PlannerEvent } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { KIND, plannerCard, smallField } from "./kinds";

interface Draft {
  id?: string;
  title: string;
  kind: CalendarEventKind;
  startsOn: string;
  endsOn: string;
  notes: string;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function PlannerCalendar({ events }: { events: PlannerEvent[] }) {
  // "Today" belongs to the student's clock, so it is read after mount rather than on the server.
  const [today, setToday] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ year: number; month: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const now = new Date();
    setToday(toISODate(now));
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelected(toISODate(now));
  }, []);

  const byDay = useMemo(() => eventsByDay(events), [events]);
  const grid = useMemo(() => (cursor ? monthGrid(cursor.year, cursor.month) : []), [cursor]);
  const upcoming = useMemo(() => {
    if (!today) return [];
    return events
      .filter((e) => (e.ends_on ?? e.starts_on) >= today)
      .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
      .slice(0, 4);
  }, [events, today]);

  const dayEvents = selected ? (byDay.get(selected) ?? []) : [];

  const goToMonth = (delta: number) =>
    setCursor((c) => {
      if (!c) return c;
      const date = new Date(c.year, c.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  const pick = (iso: string) => {
    setSelected(iso);
    setDraft(null);
    setError(null);
    const date = parseISODate(iso);
    if (date) setCursor({ year: date.getFullYear(), month: date.getMonth() });
  };

  const startNew = () => {
    if (!selected) return;
    setError(null);
    setDraft({ title: "", kind: "event", startsOn: selected, endsOn: "", notes: "" });
  };

  const startEdit = (event: PlannerEvent) => {
    setError(null);
    setDraft({
      id: event.id,
      title: event.title,
      kind: event.kind,
      startsOn: event.starts_on,
      endsOn: event.ends_on ?? "",
      notes: event.notes ?? "",
    });
  };

  const submit = () => {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveEvent({
        id: draft.id,
        title: draft.title,
        kind: draft.kind,
        startsOn: draft.startsOn,
        endsOn: draft.endsOn || null,
        notes: draft.notes,
      });
      if (result.ok) {
        setDraft(null);
        setError(null);
        setSelected(draft.startsOn);
      } else {
        setError(result.error);
      }
    });
  };

  const remove = (event: PlannerEvent) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteEvent({ id: event.id });
      setError(result.ok ? null : result.error);
    });
  };

  return (
    <section aria-labelledby="calendar-heading" className={cn(plannerCard, "space-y-4")}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="calendar-heading" className="font-sans text-lg font-extrabold tracking-normal">
          Calendar
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <span className="min-w-28 text-center text-sm font-extrabold" aria-live="polite">
            {cursor ? `${monthName(cursor.month)} ${cursor.year}` : ""}
          </span>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-extrabold text-muted-foreground">
        {WEEKDAYS.map((day, i) => (
          <span key={i} aria-hidden="true">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Pick a day">
        {(grid.length ? grid : Array.from({ length: 42 }, () => null)).map((cell, i) => {
          if (!cell) return <span key={i} className="h-10 rounded-lg bg-muted/40" />;
          const list = byDay.get(cell.iso) ?? [];
          const isSelected = selected === cell.iso;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => pick(cell.iso)}
              aria-pressed={isSelected}
              aria-label={`${formatDay(cell.iso)}${
                list.length ? `, ${list.length} event${list.length === 1 ? "" : "s"}` : ""
              }`}
              className={cn(
                "flex h-10 flex-col items-center justify-center rounded-lg border-2 text-sm font-bold transition-[background-color,border-color,scale] duration-150 hover:scale-110 active:scale-95",
                isSelected
                  ? "border-line bg-sunflower text-ink"
                  : today === cell.iso
                    ? "border-line"
                    : "border-transparent hover:bg-muted",
                !cell.inMonth && !isSelected && "text-muted-foreground/60",
              )}
            >
              {cell.day}
              {list.length ? (
                <span className="-mt-0.5 flex gap-0.5" aria-hidden="true">
                  {[...new Set(list.map((e) => e.kind))].slice(0, 3).map((kind) => (
                    <span key={kind} className={cn("size-1.5 rounded-full", KIND[kind].dot)} />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="space-y-3 border-t-2 pt-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-sans text-base font-extrabold tracking-normal">
              {formatDay(selected)}
            </h3>
            {!draft ? (
              <Button type="button" size="sm" variant="outline" onClick={startNew}>
                <Plus aria-hidden="true" />
                Add event
              </Button>
            ) : null}
          </div>

          {dayEvents.length === 0 && !draft ? (
            <p className="text-sm text-muted-foreground">Nothing planned. Add an event.</p>
          ) : null}

          <ul className="space-y-2">
            {dayEvents.map((event) => (
              <li key={event.id} className="rounded-xl bg-muted/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-extrabold",
                        KIND[event.kind].chip,
                      )}
                    >
                      {KIND[event.kind].label}
                    </span>
                    <p className="mt-1 font-bold break-words">{event.title}</p>
                    {event.ends_on ? (
                      <p className="text-xs text-muted-foreground">
                        {formatRange(event.starts_on, event.ends_on)}
                      </p>
                    ) : null}
                    {event.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{event.notes}</p>
                    ) : null}
                  </div>
                  {event.scope === "college" ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-muted-foreground">
                      <Lock className="size-3.5" aria-hidden="true" />
                      College
                    </span>
                  ) : (
                    <span className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(event)}
                        aria-label={`Edit ${event.title}`}
                        className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(event)}
                        aria-label={`Delete ${event.title}`}
                        className="flex size-9 items-center justify-center rounded-full text-danger-text hover:bg-muted"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {draft ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="space-y-3 rounded-2xl border-[3px] border-line bg-background p-3"
            >
              <label className="block text-sm font-bold">
                Title
                <input
                  className={cn(smallField, "mt-1")}
                  value={draft.title}
                  maxLength={120}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="DSA unit test"
                  autoFocus
                />
              </label>
              <label className="block text-sm font-bold">
                Type
                <select
                  className={cn(smallField, "mt-1")}
                  value={draft.kind}
                  onChange={(e) =>
                    setDraft({ ...draft, kind: e.target.value as CalendarEventKind })
                  }
                >
                  {CALENDAR_EVENT_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {KIND[kind].label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm font-bold">
                  From
                  <input
                    type="date"
                    className={cn(smallField, "mt-1")}
                    value={draft.startsOn}
                    onChange={(e) => setDraft({ ...draft, startsOn: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-bold">
                  To (optional)
                  <input
                    type="date"
                    className={cn(smallField, "mt-1")}
                    value={draft.endsOn}
                    min={draft.startsOn}
                    onChange={(e) => setDraft({ ...draft, endsOn: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-sm font-bold">
                Note (optional)
                <textarea
                  className={cn(smallField, "mt-1 min-h-16 py-2")}
                  value={draft.notes}
                  maxLength={500}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </label>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  {draft.id ? "Save changes" : "Add event"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          <p
            role="status"
            aria-live="polite"
            className="min-h-5 text-sm font-bold text-danger-text"
          >
            {error}
          </p>
        </div>
      ) : null}

      {upcoming.length ? (
        <div className="space-y-2 border-t-2 pt-3">
          <h3 className="font-sans text-base font-extrabold tracking-normal">Coming up</h3>
          <ul className="space-y-1">
            {upcoming.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() =>
                    pick(
                      event.starts_on < (today ?? "")
                        ? (today ?? event.starts_on)
                        : event.starts_on,
                    )
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-[background-color,translate] hover:translate-x-1 hover:bg-muted"
                >
                  <span className={cn("size-2.5 shrink-0 rounded-full", KIND[event.kind].dot)} />
                  <span className="w-16 shrink-0 text-xs font-bold text-muted-foreground">
                    {formatRange(event.starts_on, null)}
                  </span>
                  <span className="min-w-0 truncate text-sm font-bold">{event.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
