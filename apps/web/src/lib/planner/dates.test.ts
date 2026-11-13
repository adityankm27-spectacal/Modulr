import { describe, expect, it } from "vitest";
import {
  daysBetween,
  eventsByDay,
  formatDay,
  formatRange,
  monthGrid,
  parseISODate,
  toISODate,
} from "./dates";

describe("ISO days", () => {
  it("round-trips without a timezone shift", () => {
    expect(toISODate(new Date(2026, 10, 5))).toBe("2026-11-05");
    const parsed = parseISODate("2026-12-31");
    expect(parsed && toISODate(parsed)).toBe("2026-12-31");
  });

  it("rejects impossible dates", () => {
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("2026-13-01")).toBeNull();
    expect(parseISODate("5 Nov 2026")).toBeNull();
  });

  it("counts whole days across a month end", () => {
    expect(daysBetween(new Date(2026, 9, 30), new Date(2026, 10, 2))).toBe(3);
  });
});

describe("monthGrid", () => {
  it("starts on the Monday on or before the 1st (Nov 2026 starts on a Sunday)", () => {
    const grid = monthGrid(2026, 10);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ iso: "2026-10-26", day: 26, inMonth: false });
    expect(grid[6]).toEqual({ iso: "2026-11-01", day: 1, inMonth: true });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30);
  });

  it("puts the 1st in the first column when the month starts on a Monday", () => {
    expect(monthGrid(2026, 5)[0]).toEqual({ iso: "2026-06-01", day: 1, inMonth: true });
  });
});

describe("eventsByDay", () => {
  it("marks every day of a multi-day event", () => {
    const byDay = eventsByDay([{ starts_on: "2026-12-24", ends_on: "2026-12-27", id: "a" }]);
    expect([...byDay.keys()]).toEqual(["2026-12-24", "2026-12-25", "2026-12-26", "2026-12-27"]);
  });

  it("keeps single-day events on one day and skips bad dates", () => {
    const byDay = eventsByDay([
      { starts_on: "2026-11-05", ends_on: null, id: "a" },
      { starts_on: "nonsense", ends_on: null, id: "b" },
    ]);
    expect([...byDay.keys()]).toEqual(["2026-11-05"]);
  });

  it("treats an end before the start as a single day", () => {
    const byDay = eventsByDay([{ starts_on: "2026-11-05", ends_on: "2026-11-01", id: "a" }]);
    expect([...byDay.keys()]).toEqual(["2026-11-05"]);
  });
});

describe("formatting", () => {
  it("formats days and ranges", () => {
    expect(formatDay("2026-11-13")).toBe("Fri, 13 Nov");
    expect(formatRange("2026-11-13", null)).toBe("13 Nov");
    expect(formatRange("2026-11-13", "2026-11-20")).toBe("13 Nov – 20 Nov");
  });
});
