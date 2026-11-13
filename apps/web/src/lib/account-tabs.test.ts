import { describe, expect, it } from "vitest";
import { DEFAULT_ACCOUNT_TAB, initials, parseAccountTab } from "./account-tabs";

describe("parseAccountTab", () => {
  it("accepts the known sections", () => {
    expect(parseAccountTab("profile")).toBe("profile");
    expect(parseAccountTab("sign-out")).toBe("sign-out");
    expect(parseAccountTab(["billing", "profile"])).toBe("billing");
  });

  it("falls back to billing for anything else", () => {
    expect(parseAccountTab(undefined)).toBe(DEFAULT_ACCOUNT_TAB);
    expect(parseAccountTab("payments")).toBe("billing");
    expect(parseAccountTab("")).toBe("billing");
  });
});

describe("initials", () => {
  it("uses the first and last word of the name", () => {
    expect(initials("Aditya Arvind Nikam", "a@b.c")).toBe("AN");
    expect(initials("  asha ", null)).toBe("A");
  });

  it("falls back to the email, then a placeholder", () => {
    expect(initials(null, "zed@example.com")).toBe("Z");
    expect(initials("", "")).toBe("?");
  });
});
