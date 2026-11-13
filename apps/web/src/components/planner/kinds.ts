import type { CalendarEventKind } from "@modulr/shared";

/** Brand colours per kind of event. Fills that need dark text (see globals.css). */
export const KIND: Record<CalendarEventKind, { label: string; dot: string; chip: string }> = {
  exam: { label: "Exam", dot: "bg-orange", chip: "bg-orange text-ink" },
  holiday: { label: "Holiday", dot: "bg-mint", chip: "bg-mint text-ink" },
  deadline: { label: "Deadline", dot: "bg-pink", chip: "bg-pink text-ink" },
  event: { label: "Event", dot: "bg-cobalt", chip: "bg-cobalt text-white" },
  reminder: { label: "Reminder", dot: "bg-sunflower", chip: "bg-sunflower text-ink" },
};

/** Shared look of the planner's cards, matching the rest of the site. */
export const plannerCard =
  "rounded-3xl border-[3px] border-line bg-card p-4 shadow-[0_5px_0_0_var(--line)]";

export const smallField =
  "min-h-10 w-full rounded-xl border-[3px] border-line bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none";
