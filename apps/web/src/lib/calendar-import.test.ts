import { describe, expect, it } from "vitest";
import { inferKind, parseCalendarDate, validateCalendarImport } from "./calendar-import";

describe("parseCalendarDate", () => {
  it("reads ISO, day-first and written dates", () => {
    expect(parseCalendarDate("2026-12-05")).toBe("2026-12-05");
    expect(parseCalendarDate("05/12/2026")).toBe("2026-12-05");
    expect(parseCalendarDate("5-12-2026")).toBe("2026-12-05");
    expect(parseCalendarDate("5 Dec 2026")).toBe("2026-12-05");
    expect(parseCalendarDate("05 December 2026")).toBe("2026-12-05");
  });

  it("rejects non-dates and impossible dates", () => {
    expect(parseCalendarDate("")).toBeNull();
    expect(parseCalendarDate("31/02/2026")).toBeNull();
    expect(parseCalendarDate("soon")).toBeNull();
  });
});

describe("inferKind", () => {
  it("guesses from the title", () => {
    expect(inferKind("Unit Test 1 - DSA")).toBe("exam");
    expect(inferKind("Diwali vacation")).toBe("holiday");
    expect(inferKind("Journal submission")).toBe("deadline");
    expect(inferKind("Annual day")).toBe("event");
    expect(inferKind("Semester 3 end term exams")).toBe("exam");
    expect(inferKind("Practical journal submission")).toBe("deadline");
    expect(inferKind("Exam form last date")).toBe("deadline");
    expect(inferKind("Practical exam: DBMS")).toBe("exam");
  });
});

describe("CSV import", () => {
  const csv = [
    "title,date,end_date,kind,notes",
    "Unit Test 1,20/11/2026,,,All subjects",
    "Diwali break,2026-11-09,2026-11-13,holiday,",
    "Bad date,tomorrow,,,",
    ",2026-12-01,,,",
    "Backwards,2026-12-05,2026-12-01,,",
    "Odd kind,2026-12-02,,party,",
  ].join("\n");

  it("validates each row and keeps the good ones", () => {
    const report = validateCalendarImport(csv, "calendar.csv");
    expect(report.fileErrors).toEqual([]);
    expect(report.rows).toHaveLength(6);
    expect(report.validCount).toBe(2);
    expect(report.rows[0]?.value).toEqual({
      title: "Unit Test 1",
      kind: "exam",
      starts_on: "2026-11-20",
      ends_on: null,
      notes: "All subjects",
    });
    expect(report.rows[1]?.value).toMatchObject({ kind: "holiday", ends_on: "2026-11-13" });
    expect(report.rows[2]?.errors[0]).toContain("isn't a date");
    expect(report.rows[3]?.errors).toContain("title is empty.");
    expect(report.rows[4]?.errors).toContain("end date is before the start date.");
    expect(report.rows[5]?.errors[0]).toContain("kind must be one of");
  });

  it("accepts common header names and any column order", () => {
    const report = validateCalendarImport("Date,Event,Type\n2026-12-01,Viva,test", "x.csv");
    expect(report.validCount).toBe(1);
    expect(report.rows[0]?.value).toMatchObject({ title: "Viva", kind: "exam" });
  });

  it("explains a missing header", () => {
    const report = validateCalendarImport("Unit test,2026-11-20", "x.csv");
    expect(report.fileErrors[0]).toContain("Missing");
    expect(validateCalendarImport("", "x.csv").fileErrors).toHaveLength(1);
  });
});

describe("ICS import", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "SUMMARY:Diwali vacation",
    "DTSTART;VALUE=DATE:20261109",
    "DTEND;VALUE=DATE:20261114",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "SUMMARY:Republic Day",
    "DTSTART;VALUE=DATE:20270126",
    "DTEND;VALUE=DATE:20270127",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "SUMMARY:Unit test\\, DSA",
    "DESCRIPTION:Chapters 1 to 3 \\n bring ID",
    "DTSTART:20261120T043000Z",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "SUMMARY:Late night lab",
    "DTSTART:20261205T193000Z",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "SUMMARY:A very long title that is folded over",
    "  two lines",
    "DTSTART;VALUE=DATE:20261201",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  it("reads all-day, single-day and timed events", () => {
    const report = validateCalendarImport(ics, "college.ics");
    expect(report.fileErrors).toEqual([]);
    expect(report.validCount).toBe(5);
    const [diwali, republic, test, lab, folded] = report.rows.map((r) => r.value);
    // All-day end dates are exclusive in ICS: Nov 14 means the break ends on the 13th.
    expect(diwali).toMatchObject({
      starts_on: "2026-11-09",
      ends_on: "2026-11-13",
      kind: "holiday",
    });
    expect(republic).toMatchObject({ starts_on: "2027-01-26", ends_on: null });
    expect(test).toMatchObject({ title: "Unit test, DSA", starts_on: "2026-11-20", kind: "exam" });
    expect(test?.notes).toContain("Chapters 1 to 3");
    // 19:30 UTC is already the next morning in India.
    expect(lab).toMatchObject({ starts_on: "2026-12-06" });
    expect(folded?.title).toBe("A very long title that is folded over two lines");
  });

  it("is chosen by content even without the .ics name", () => {
    expect(validateCalendarImport(ics, "export.txt").validCount).toBe(5);
    expect(
      validateCalendarImport("BEGIN:VCALENDAR\nEND:VCALENDAR", "x.ics").fileErrors,
    ).toHaveLength(1);
  });
});
