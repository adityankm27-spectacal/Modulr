import { describe, expect, it } from "vitest";
import { parsePlayerJsMessage, playerJsCommand, readTimeUpdate } from "./playerjs";
import {
  currentChapterIndex,
  isCompleted,
  nextWatermarkPosition,
  resumePosition,
  shouldSaveProgress,
} from "./watch";

describe("shouldSaveProgress", () => {
  it("waits 15s and a real position change", () => {
    const base = { now: 20_000, lastSavedAt: 0, lastSavedPosition: 0, position: 20 };
    expect(shouldSaveProgress(base)).toBe(true);
    expect(shouldSaveProgress({ ...base, now: 10_000 })).toBe(false);
    expect(shouldSaveProgress({ ...base, position: 2 })).toBe(false);
  });
});

describe("isCompleted", () => {
  it("counts the last 5% or last 15 seconds as done", () => {
    expect(isCompleted(570, 600)).toBe(true);
    expect(isCompleted(586, 600)).toBe(true);
    expect(isCompleted(500, 600)).toBe(false);
    expect(isCompleted(50, 60)).toBe(true);
    expect(isCompleted(10, null)).toBe(false);
  });
});

describe("resumePosition", () => {
  it("resumes slightly before where the viewer stopped", () => {
    expect(resumePosition(200, 600, false)).toBe(197);
  });
  it("starts over for new, finished or nearly finished videos", () => {
    expect(resumePosition(null, 600, false)).toBe(0);
    expect(resumePosition(5, 600, false)).toBe(0);
    expect(resumePosition(300, 600, true)).toBe(0);
    expect(resumePosition(590, 600, false)).toBe(0);
  });
});

describe("currentChapterIndex", () => {
  const chapters = [{ start_sec: 0 }, { start_sec: 60 }, { start_sec: 120 }];
  it("finds the chapter playing now", () => {
    expect(currentChapterIndex(chapters, 0)).toBe(0);
    expect(currentChapterIndex(chapters, 59.9)).toBe(0);
    expect(currentChapterIndex(chapters, 60)).toBe(1);
    expect(currentChapterIndex(chapters, 500)).toBe(2);
    expect(currentChapterIndex([{ start_sec: 10 }], 5)).toBe(-1);
    expect(currentChapterIndex([], 5)).toBe(-1);
  });
});

describe("nextWatermarkPosition", () => {
  it("stays inside the frame and always changes quadrant", () => {
    let position = nextWatermarkPosition(null, () => 0.1);
    for (let i = 0; i < 50; i++) {
      const next = nextWatermarkPosition(position);
      expect(next.top).toBeGreaterThanOrEqual(6);
      expect(next.top).toBeLessThanOrEqual(78);
      expect(next.left).toBeGreaterThanOrEqual(4);
      expect(next.left).toBeLessThanOrEqual(60);
      const q = (p: typeof next) => (p.top < 45 ? 0 : 2) + (p.left < 45 ? 0 : 1);
      expect(q(next)).not.toBe(q(position));
      position = next;
    }
  });

  it("falls back to a different corner when randomness keeps repeating", () => {
    const stuck = nextWatermarkPosition({ top: 10, left: 10 }, () => 0);
    expect(stuck.top).toBe(70);
  });
});

describe("player.js protocol", () => {
  it("parses player.js events from strings or objects and ignores others", () => {
    expect(parsePlayerJsMessage('{"context":"player.js","event":"ready","value":{}}')).toEqual({
      event: "ready",
      value: {},
      listener: undefined,
    });
    expect(
      parsePlayerJsMessage({
        context: "player.js",
        event: "timeupdate",
        value: { seconds: 3 },
        listener: "1",
      }),
    ).toMatchObject({ event: "timeupdate", listener: "1" });
    expect(parsePlayerJsMessage("not json")).toBeNull();
    expect(parsePlayerJsMessage({ context: "other", event: "x" })).toBeNull();
    expect(parsePlayerJsMessage(null)).toBeNull();
  });

  it("builds commands", () => {
    expect(JSON.parse(playerJsCommand("setCurrentTime", 42))).toEqual({
      context: "player.js",
      version: "0.0.11",
      method: "setCurrentTime",
      value: 42,
    });
    expect(JSON.parse(playerJsCommand("addEventListener", "timeupdate", "l1"))).toMatchObject({
      method: "addEventListener",
      value: "timeupdate",
      listener: "l1",
    });
  });

  it("reads time updates", () => {
    expect(readTimeUpdate({ seconds: 12.5, duration: 600 })).toEqual({
      seconds: 12.5,
      duration: 600,
    });
    expect(readTimeUpdate({ seconds: 1, duration: 0 })).toEqual({ seconds: 1, duration: null });
    expect(readTimeUpdate({ seconds: "x" })).toBeNull();
  });
});
