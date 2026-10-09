/**
 * What a module page shows, given who is looking. Mirrors the entitlement rule
 * in has_access(): free preview needs a signed-in user; everything else needs
 * paid subject access. RLS enforces this on the data itself; this only decides
 * which lock message to show.
 */
export type ModuleLockState =
  { kind: "open" } | { kind: "sign_in"; reason: "free_preview" | "paid" } | { kind: "paywall" };

export function moduleLockState(input: {
  signedIn: boolean;
  isFreePreview: boolean;
  hasSubjectAccess: boolean;
}): ModuleLockState {
  if (!input.signedIn) {
    return { kind: "sign_in", reason: input.isFreePreview ? "free_preview" : "paid" };
  }
  if (input.isFreePreview || input.hasSubjectAccess) return { kind: "open" };
  return { kind: "paywall" };
}
