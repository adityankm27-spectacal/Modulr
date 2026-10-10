import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { fromBunnyChapters, mapBunnyStatus, toBunnyChapters } = await import("./bunny");

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

describe("fromBunnyChapters", () => {
  it("reads Bunny chapters as Modulr chapters, sorted, with whole-second starts", () => {
    expect(
      fromBunnyChapters([
        { title: " Main part ", start: 95.6, end: 300 },
        { title: "Intro", start: 0, end: 95 },
      ]),
    ).toEqual([
      { title: "Intro", start_sec: 0 },
      { title: "Main part", start_sec: 96 },
    ]);
  });

  it("drops malformed entries and non-arrays", () => {
    expect(
      fromBunnyChapters([
        { title: "", start: 1 },
        { title: "No start" },
        { title: "Negative", start: -5 },
        null,
        "text",
        { title: "Ok", start: 10 },
      ]),
    ).toEqual([{ title: "Ok", start_sec: 10 }]);
    expect(fromBunnyChapters(undefined)).toEqual([]);
    expect(fromBunnyChapters({ title: "x", start: 1 })).toEqual([]);
  });
});
