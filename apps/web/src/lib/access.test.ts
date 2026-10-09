import { describe, expect, it } from "vitest";
import { moduleLockState } from "./access";

describe("moduleLockState", () => {
  it("asks visitors to sign in, even for free modules", () => {
    expect(
      moduleLockState({ signedIn: false, isFreePreview: true, hasSubjectAccess: false }),
    ).toEqual({ kind: "sign_in", reason: "free_preview" });
    expect(
      moduleLockState({ signedIn: false, isFreePreview: false, hasSubjectAccess: false }),
    ).toEqual({ kind: "sign_in", reason: "paid" });
  });

  it("opens free modules for signed-in students", () => {
    expect(
      moduleLockState({ signedIn: true, isFreePreview: true, hasSubjectAccess: false }),
    ).toEqual({ kind: "open" });
  });

  it("shows the paywall on paid modules without access", () => {
    expect(
      moduleLockState({ signedIn: true, isFreePreview: false, hasSubjectAccess: false }),
    ).toEqual({ kind: "paywall" });
  });

  it("opens paid modules with subject access", () => {
    expect(
      moduleLockState({ signedIn: true, isFreePreview: false, hasSubjectAccess: true }),
    ).toEqual({ kind: "open" });
  });
});
