import { describe, expect, it } from "vitest";
import { isSessionCheckExempt, isSessionReplaced } from "./session";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("isSessionReplaced", () => {
  it("signs out a session that is not the active one", () => {
    expect(isSessionReplaced(A, B)).toBe(true);
  });

  it("keeps the active session", () => {
    expect(isSessionReplaced(A, A)).toBe(false);
  });

  it("fails open when either side is unknown", () => {
    expect(isSessionReplaced(undefined, B)).toBe(false);
    expect(isSessionReplaced(A, null)).toBe(false);
    expect(isSessionReplaced(A, undefined)).toBe(false);
    expect(isSessionReplaced(42, B)).toBe(false);
  });
});

describe("isSessionCheckExempt", () => {
  it("lets sign-in and sign-out finish", () => {
    expect(isSessionCheckExempt("/auth/callback")).toBe(true);
    expect(isSessionCheckExempt("/auth/sign-out")).toBe(true);
    expect(isSessionCheckExempt("/sign-in")).toBe(true);
  });

  it("checks everything else", () => {
    expect(isSessionCheckExempt("/home")).toBe(false);
    expect(isSessionCheckExempt("/api/session")).toBe(false);
    expect(isSessionCheckExempt("/authors")).toBe(false);
  });
});
