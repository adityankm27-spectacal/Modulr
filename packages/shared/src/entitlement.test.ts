import { describe, expect, it } from "vitest";
import type {
  EntitlementModule,
  EntitlementOptions,
  EntitlementPurchase,
  EntitlementSubscription,
  EntitlementUser,
} from "./entitlement";
import { hasAccess, subscriptionGrantsAccess } from "./entitlement";

const NOW = new Date("2026-10-08T12:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);
const opts: EntitlementOptions = { now: NOW, graceDays: 3, trialDays: 0 };

const student: EntitlementUser = { role: "student", compAccessUntil: null, createdAt: day(-30) };
const subject = { id: "subj-1", syllabusVersionId: "sv-1", semester: 3 };
const paidModule: EntitlementModule = { isFreePreview: false, subject };
const freeModule: EntitlementModule = { isFreePreview: true, subject };

const sub = (overrides: Partial<EntitlementSubscription>): EntitlementSubscription => ({
  status: "active",
  currentPeriodEnd: day(20),
  graceUntil: null,
  ...overrides,
});

const purchase = (overrides: Partial<EntitlementPurchase>): EntitlementPurchase => ({
  scope: "subject",
  subjectId: "subj-1",
  syllabusVersionId: null,
  semester: null,
  validUntil: day(10),
  ...overrides,
});

describe("hasAccess", () => {
  it("denies visitors, even on free preview", () => {
    expect(hasAccess(null, freeModule, [], [], opts)).toBe(false);
  });

  it("allows signed-in students on free preview modules only", () => {
    expect(hasAccess(student, freeModule, [], [], opts)).toBe(true);
    expect(hasAccess(student, paidModule, [], [], opts)).toBe(false);
  });

  it("allows admins everywhere", () => {
    expect(hasAccess({ ...student, role: "admin" }, paidModule, [], [], opts)).toBe(true);
  });

  it("does not give contributors content access by role alone", () => {
    expect(hasAccess({ ...student, role: "contributor" }, paidModule, [], [], opts)).toBe(false);
  });

  it("honours comp access until it expires", () => {
    expect(hasAccess({ ...student, compAccessUntil: day(1) }, paidModule, [], [], opts)).toBe(true);
    expect(hasAccess({ ...student, compAccessUntil: day(-1) }, paidModule, [], [], opts)).toBe(
      false,
    );
  });

  it("honours an optional trial window", () => {
    const fresh = { ...student, createdAt: day(-2) };
    expect(hasAccess(fresh, paidModule, [], [], opts)).toBe(false);
    expect(hasAccess(fresh, paidModule, [], [], { ...opts, trialDays: 7 })).toBe(true);
    expect(hasAccess(student, paidModule, [], [], { ...opts, trialDays: 7 })).toBe(false);
  });

  it("allows active subscribers", () => {
    expect(hasAccess(student, paidModule, [sub({})], [], opts)).toBe(true);
  });

  it("covers purchases by subject, semester and all", () => {
    expect(hasAccess(student, paidModule, [], [purchase({})], opts)).toBe(true);
    expect(hasAccess(student, paidModule, [], [purchase({ subjectId: "other" })], opts)).toBe(
      false,
    );
    const sem = purchase({
      scope: "semester",
      subjectId: null,
      syllabusVersionId: "sv-1",
      semester: 3,
    });
    expect(hasAccess(student, paidModule, [], [sem], opts)).toBe(true);
    expect(hasAccess(student, paidModule, [], [{ ...sem, semester: 4 }], opts)).toBe(false);
    expect(
      hasAccess(student, paidModule, [], [purchase({ scope: "all", subjectId: null })], opts),
    ).toBe(true);
  });

  it("ignores expired purchases", () => {
    expect(hasAccess(student, paidModule, [], [purchase({ validUntil: day(-1) })], opts)).toBe(
      false,
    );
    expect(hasAccess(student, paidModule, [], [purchase({ validUntil: NOW })], opts)).toBe(false);
  });
});

describe("subscriptionGrantsAccess", () => {
  it.each(["created", "halted", "completed", "expired"] as const)("denies %s", (status) => {
    expect(subscriptionGrantsAccess(sub({ status }), opts)).toBe(false);
  });

  it.each(["cancelled", "pending"] as const)("allows %s within period + grace", (status) => {
    expect(subscriptionGrantsAccess(sub({ status, currentPeriodEnd: day(5) }), opts)).toBe(true);
    // Period ended 2 days ago, grace is 3 days.
    expect(subscriptionGrantsAccess(sub({ status, currentPeriodEnd: day(-2) }), opts)).toBe(true);
    // Period ended 4 days ago, past grace.
    expect(subscriptionGrantsAccess(sub({ status, currentPeriodEnd: day(-4) }), opts)).toBe(false);
    expect(subscriptionGrantsAccess(sub({ status, currentPeriodEnd: null }), opts)).toBe(false);
  });

  it("prefers an explicit grace_until", () => {
    const s = sub({ status: "cancelled", currentPeriodEnd: day(-10), graceUntil: day(1) });
    expect(subscriptionGrantsAccess(s, opts)).toBe(true);
    expect(subscriptionGrantsAccess({ ...s, graceUntil: day(-1) }, opts)).toBe(false);
  });
});
