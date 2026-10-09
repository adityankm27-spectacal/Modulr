import { describe, expect, it } from "vitest";
import {
  formatChapters,
  formatSymbols,
  formatTimestamp,
  parseChapters,
  parseSymbols,
  parseTimestamp,
  readChapters,
  readSymbols,
} from "./content";

describe("timestamps", () => {
  it.each([
    ["0:00", 0],
    ["1:35", 95],
    ["1:02:03", 3723],
    ["90", 90],
  ])("parses %s", (input, seconds) => expect(parseTimestamp(input)).toBe(seconds));

  it.each(["", "abc", "1:75", "1:2:3:4", "-1:00", "1.5"])("rejects %j", (input) => {
    expect(parseTimestamp(input)).toBeNull();
  });

  it("formats seconds", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(95)).toBe("1:35");
    expect(formatTimestamp(3723)).toBe("1:02:03");
  });
});

describe("chapters", () => {
  it("parses and round-trips", () => {
    const { items, errors } = parseChapters("0:00 Intro\n\n1:35 Main idea\n4:00 Recap ");
    expect(errors).toEqual([]);
    expect(items).toEqual([
      { title: "Intro", start_sec: 0 },
      { title: "Main idea", start_sec: 95 },
      { title: "Recap", start_sec: 240 },
    ]);
    expect(formatChapters(items)).toBe("0:00 Intro\n1:35 Main idea\n4:00 Recap");
  });

  it("reports bad lines with line numbers", () => {
    const { items, errors } = parseChapters("0:00 Intro\nMain idea\n0:30 Late\n0:20 Early");
    expect(items).toHaveLength(2);
    expect(errors).toEqual([
      "Line 2: start with a time like 1:35, then the chapter title.",
      "Line 4: times must be in increasing order.",
    ]);
  });
});

describe("symbols", () => {
  it("parses and round-trips", () => {
    const { items, errors } = parseSymbols("S_n :: sum of n terms\n\\alpha :: angle :: in radians");
    expect(errors).toEqual([]);
    expect(items).toEqual([
      { symbol: "S_n", meaning: "sum of n terms" },
      { symbol: "\\alpha", meaning: "angle :: in radians" },
    ]);
    expect(formatSymbols(items)).toBe("S_n :: sum of n terms\n\\alpha :: angle :: in radians");
  });

  it("flags lines missing a symbol or meaning", () => {
    const { items, errors } = parseSymbols("x\n:: nothing\ny ::");
    expect(items).toEqual([]);
    expect(errors).toHaveLength(3);
  });
});

describe("jsonb readers", () => {
  it("keep valid entries and drop malformed ones", () => {
    expect(readChapters([{ title: "A", start_sec: 1 }, { title: 2 }, null, "x"])).toEqual([
      { title: "A", start_sec: 1 },
    ]);
    expect(readChapters({})).toEqual([]);
    expect(readSymbols([{ symbol: "x", meaning: "y" }, { symbol: "z" }])).toEqual([
      { symbol: "x", meaning: "y" },
    ]);
    expect(readSymbols(undefined)).toEqual([]);
  });
});
