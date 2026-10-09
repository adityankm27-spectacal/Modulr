import { describe, expect, it } from "vitest";
import { attendanceStatus } from "./attendance";

describe("attendanceStatus", () => {
  it("handles no lectures yet", () => {
    expect(attendanceStatus(0, 0)).toEqual({ kind: "no_lectures", percentage: null });
  });

  it.each([
    // [attended, total, lecturesNeeded]
    [30, 50, 30], // 60/80 = 75%
    [7, 10, 2], // 9/12 = 75%
    [0, 1, 3], // 3/4 = 75%
    [0, 10, 30], // 30/40 = 75%
  ])("below target: %i/%i needs %i more", (a, t, n) => {
    const status = attendanceStatus(a, t);
    expect(status).toMatchObject({ kind: "below_target", lecturesNeeded: n });
    // Attending exactly n more reaches the target; n - 1 does not.
    expect((a + n) / (t + n)).toBeGreaterThanOrEqual(0.75);
    expect((a + n - 1) / (t + n - 1)).toBeLessThan(0.75);
  });

  it.each([
    // [attended, total, safeToMiss]
    [45, 50, 10], // 45/60 = 75%
    [3, 4, 0], // exactly 75%
    [10, 10, 3], // 10/13 = 76.9%, 10/14 = 71.4%
    [75, 100, 0],
  ])("on track: %i/%i can miss %i", (a, t, m) => {
    const status = attendanceStatus(a, t);
    expect(status).toMatchObject({ kind: "on_track", safeToMiss: m });
    expect(a / (t + m)).toBeGreaterThanOrEqual(0.75);
    expect(a / (t + m + 1)).toBeLessThan(0.75);
  });

  it("reports percentage", () => {
    expect(attendanceStatus(3, 4).percentage).toBe(75);
  });

  it("supports a custom target", () => {
    expect(attendanceStatus(5, 10, 0.6)).toMatchObject({ kind: "below_target", lecturesNeeded: 3 });
  });

  it("rejects invalid input", () => {
    expect(() => attendanceStatus(5, 4)).toThrow(RangeError);
    expect(() => attendanceStatus(-1, 4)).toThrow(RangeError);
    expect(() => attendanceStatus(1.5, 4)).toThrow(RangeError);
    expect(() => attendanceStatus(1, 4, 1)).toThrow(RangeError);
  });
});
