import { describe, expect, it } from "vitest";
import { canUsePlanner } from "./access";

const now = new Date("2026-11-13T10:00:00Z");
const base = { role: "student", compAccessUntil: null, hasSubscriptionAccess: false, now };

describe("canUsePlanner", () => {
  it("is for subscribers, admins and students with free access", () => {
    expect(canUsePlanner({ ...base, hasSubscriptionAccess: true })).toBe(true);
    expect(canUsePlanner({ ...base, role: "admin" })).toBe(true);
    expect(canUsePlanner({ ...base, compAccessUntil: "2026-12-01T00:00:00Z" })).toBe(true);
  });

  it("is not for everyone else", () => {
    expect(canUsePlanner(base)).toBe(false);
    expect(canUsePlanner({ ...base, compAccessUntil: "2026-11-01T00:00:00Z" })).toBe(false);
  });
});
