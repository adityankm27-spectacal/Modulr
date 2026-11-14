import { describe, expect, it } from "vitest";
import { insertChapterLine, providerChaptersUpdate } from "./chapters";

const generated = [
  { title: "Intro", start_sec: 0 },
  { title: "Main", start_sec: 60 },
];

describe("providerChaptersUpdate", () => {
  it("fills in provider chapters when the video has none", () => {
    expect(providerChaptersUpdate([], { chapters: generated })).toEqual({ chapters: generated });
    expect(providerChaptersUpdate(null, { chapters: generated })).toEqual({ chapters: generated });
  });

  it("never replaces chapters an admin already has", () => {
    expect(
      providerChaptersUpdate([{ title: "Mine", start_sec: 0 }], { chapters: generated }),
    ).toEqual({});
  });

  it("changes nothing when the provider has no chapters", () => {
    expect(providerChaptersUpdate([], { chapters: [] })).toEqual({});
  });
});

describe("insertChapterLine", () => {
  it("adds the first chapter", () => {
    expect(insertChapterLine("", 95)).toEqual({
      text: "1:35 New chapter",
      line: 0,
      created: true,
    });
  });

  it("keeps chapters in time order", () => {
    const result = insertChapterLine("0:00 Intro\n4:00 Recap", 95, "Main idea");
    expect(result.text).toBe("0:00 Intro\n1:35 Main idea\n4:00 Recap");
    expect(result.line).toBe(1);
  });

  it("adds at the end when it is the latest", () => {
    expect(insertChapterLine("0:00 Intro", 600).text).toBe("0:00 Intro\n10:00 New chapter");
  });

  it("does not duplicate a chapter that starts at the same moment", () => {
    const result = insertChapterLine("0:00 Intro\n1:35 Main idea", 96);
    expect(result).toEqual({ text: "0:00 Intro\n1:35 Main idea", line: 1, created: false });
  });
});
