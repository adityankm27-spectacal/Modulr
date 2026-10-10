import { describe, expect, it } from "vitest";
import { providerChaptersUpdate } from "./chapters";

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
