import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, resolveSettings } from "./settings";

describe("resolveSettings", () => {
  it("returns defaults when the table is empty", () => {
    expect(resolveSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it("overrides known keys and ignores unknown ones", () => {
    const s = resolveSettings([
      { key: "devices.max_active", value: 1 },
      { key: "not.a.setting", value: true },
    ]);
    expect(s["devices.max_active"]).toBe(1);
    expect(s).not.toHaveProperty("not.a.setting");
  });
});
