import { describe, expect, it } from "vitest";
import {
  addPoint,
  eraseAt,
  MARK_COLORS,
  parseMarks,
  serializeMarks,
  storageKey,
  strokeHit,
  type Stroke,
} from "./pdf-marks";

const yellow = MARK_COLORS[0].value;
const A4 = 1 / Math.SQRT2;

describe("storageKey", () => {
  it("separates users and documents", () => {
    expect(storageKey("u1", "doc:a")).not.toBe(storageKey("u2", "doc:a"));
    expect(storageKey("u1", "doc:a")).not.toBe(storageKey("u1", "doc:b"));
    expect(storageKey(null, "doc:a")).toContain(":guest:");
  });
});

describe("addPoint", () => {
  it("rounds, clamps and skips points that barely move", () => {
    const pts: number[] = [];
    expect(addPoint(pts, 0.123456, 1.2, A4)).toBe(true);
    expect(pts).toEqual([0.1235, 1]);
    expect(addPoint(pts, 0.1236, 1, A4)).toBe(false);
    expect(addPoint(pts, 0.2, 0.9, A4)).toBe(true);
    expect(pts).toHaveLength(4);
  });
});

describe("eraser", () => {
  const line: Stroke = { tool: "pen", color: yellow, points: [0.1, 0.5, 0.9, 0.5] };
  const dot: Stroke = { tool: "pen", color: yellow, points: [0.5, 0.1] };

  it("hits a stroke near any segment and misses far away", () => {
    expect(strokeHit(line, 0.5, 0.505, 0.01, A4)).toBe(true);
    expect(strokeHit(line, 0.5, 0.6, 0.01, A4)).toBe(false);
    expect(strokeHit(line, 0.95, 0.5, 0.01, A4)).toBe(false);
    expect(strokeHit(dot, 0.505, 0.1, 0.01, A4)).toBe(true);
  });

  it("counts the highlighter's width", () => {
    const hl: Stroke = { ...line, tool: "highlighter" };
    // 0.019 of page width away vertically: inside the highlighter's half width + radius.
    const y = 0.5 + 0.019 * A4;
    expect(strokeHit(hl, 0.5, y, 0.005, A4)).toBe(true);
    expect(strokeHit(line, 0.5, y, 0.005, A4)).toBe(false);
  });

  it("returns the same array when nothing is erased", () => {
    const strokes = [line, dot];
    expect(eraseAt(strokes, 0.5, 0.9, 0.01, A4)).toBe(strokes);
    expect(eraseAt(strokes, 0.5, 0.5, 0.01, A4)).toEqual([dot]);
  });
});

describe("parse / serialize", () => {
  it("round-trips marks and drops empty pages", () => {
    const marks = {
      1: [{ tool: "highlighter" as const, color: yellow, points: [0.1, 0.2] }],
      2: [],
    };
    const raw = serializeMarks(marks);
    expect(parseMarks(raw)).toEqual({ 1: marks[1] });
    expect(serializeMarks({ 3: [] })).toBeNull();
  });

  it("ignores malformed or hostile data", () => {
    expect(parseMarks(null)).toEqual({});
    expect(parseMarks("not json")).toEqual({});
    expect(parseMarks(JSON.stringify({ pages: [] }))).toEqual({});
    const raw = JSON.stringify({
      pages: {
        "0": [{ tool: "pen", color: yellow, points: [0, 0] }],
        x: [],
        "2": [
          { tool: "pen", color: yellow, points: [0.1, 0.2] },
          { tool: "laser", color: yellow, points: [0.1, 0.2] },
          { tool: "pen", color: "url(javascript:1)", points: [0.1, 0.2] },
          { tool: "pen", color: yellow, points: [0.1] },
          { tool: "pen", color: yellow, points: [0.1, 5] },
        ],
      },
    });
    expect(parseMarks(raw)).toEqual({ 2: [{ tool: "pen", color: yellow, points: [0.1, 0.2] }] });
  });
});
