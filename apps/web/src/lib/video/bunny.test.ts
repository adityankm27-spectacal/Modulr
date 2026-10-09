import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mapBunnyStatus, toBunnyChapters } = await import("./bunny");

describe("mapBunnyStatus", () => {
  it.each([
    [0, "pending"],
    [1, "processing"],
    [2, "processing"],
    [3, "processing"],
    [4, "ready"],
    [5, "failed"],
    [6, "failed"],
    [7, "processing"],
  ])("Bunny status %i → %s", (code, status) => {
    expect(mapBunnyStatus(code)).toBe(status);
  });
});

describe("toBunnyChapters", () => {
  it("ends each chapter where the next begins and the last at the video end", () => {
    expect(
      toBunnyChapters(
        [
          { title: "Intro", start_sec: 0 },
          { title: "Main", start_sec: 95 },
        ],
        300,
      ),
    ).toEqual([
      { title: "Intro", start: 0, end: 95 },
      { title: "Main", start: 95, end: 300 },
    ]);
  });
});
