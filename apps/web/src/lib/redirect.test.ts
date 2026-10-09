import { describe, expect, it } from "vitest";
import { safeNextPath, signInPath } from "./redirect";

describe("safeNextPath", () => {
  it.each([
    ["/home", "/home"],
    ["/subjects/abc?tab=pyqs", "/subjects/abc?tab=pyqs"],
    ["/pricing#faq", "/pricing#faq"],
  ])("keeps on-site path %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [""],
    ["home"],
    ["https://evil.example"],
    ["//evil.example"],
    ["/\\evil.example"],
    ["/\t/evil.example"],
    ["javascript:alert(1)"],
  ])("falls back for unsafe value %s", (input) => {
    expect(safeNextPath(input)).toBe("/home");
  });

  it("supports a custom fallback", () => {
    expect(safeNextPath(null, "/")).toBe("/");
  });
});

describe("signInPath", () => {
  it("encodes the return path", () => {
    expect(signInPath("/subjects/x?tab=viva")).toBe("/sign-in?next=%2Fsubjects%2Fx%3Ftab%3Dviva");
  });
});
