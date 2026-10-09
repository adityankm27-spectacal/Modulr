/**
 * Entitlement rules (spec §8). This is the TypeScript twin of the SQL
 * functions `has_access(user, module)` and `has_subject_access(user, subject)`
 * in supabase/migrations/20261008000200_rls.sql. Any change here must be made
 * there too; both are covered by tests.
 */
import type { PlanScope, SubscriptionStatus, UserRole } from "./enums";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface EntitlementUser {
  role: UserRole;
  compAccessUntil: Date | null;
  /** Account creation time, used for the optional time-limited trial. */
  createdAt: Date;
}

export interface EntitlementSubscription {
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  graceUntil: Date | null;
}

export interface EntitlementPurchase {
  scope: PlanScope;
  subjectId: string | null;
  syllabusVersionId: string | null;
  semester: number | null;
  validUntil: Date;
}

export interface EntitlementSubject {
  id: string;
  syllabusVersionId: string;
  semester: number;
}

export interface EntitlementModule {
  isFreePreview: boolean;
  subject: EntitlementSubject;
}

export interface EntitlementOptions {
  now: Date;
  graceDays: number;
  trialDays: number;
}

/**
 * Whether a subscription currently grants access: always while `active`;
 * while `cancelled` or `pending`, until the paid period end plus grace.
 * `grace_until`, when set explicitly (e.g. by a webhook), wins over the
 * computed grace window.
 */
export function subscriptionGrantsAccess(
  sub: EntitlementSubscription,
  opts: Pick<EntitlementOptions, "now" | "graceDays">,
): boolean {
  if (sub.status === "active") return true;
  if (sub.status !== "cancelled" && sub.status !== "pending") return false;
  const accessEnd =
    sub.graceUntil ??
    (sub.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd.getTime() + opts.graceDays * DAY_MS)
      : null);
  return accessEnd !== null && opts.now < accessEnd;
}

export function purchaseCoversSubject(
  purchase: EntitlementPurchase,
  subject: EntitlementSubject,
  now: Date,
): boolean {
  if (now >= purchase.validUntil) return false;
  switch (purchase.scope) {
    case "all":
      return true;
    case "subject":
      return purchase.subjectId === subject.id;
    case "semester":
      return (
        purchase.syllabusVersionId === subject.syllabusVersionId &&
        purchase.semester === subject.semester
      );
  }
}

/** Paid (non-free-preview) access to every module of a subject. */
export function hasSubjectAccess(
  user: EntitlementUser | null,
  subject: EntitlementSubject,
  subscriptions: readonly EntitlementSubscription[],
  purchases: readonly EntitlementPurchase[],
  opts: EntitlementOptions,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.compAccessUntil && user.compAccessUntil > opts.now) return true;
  if (
    opts.trialDays > 0 &&
    opts.now.getTime() < user.createdAt.getTime() + opts.trialDays * DAY_MS
  ) {
    return true;
  }
  if (subscriptions.some((s) => subscriptionGrantsAccess(s, opts))) return true;
  return purchases.some((p) => purchaseCoversSubject(p, subject, opts.now));
}

/**
 * Access to a module's content. Visitors (no user) never get content; signed-in
 * students get free-preview modules; everything else needs paid access.
 */
export function hasAccess(
  user: EntitlementUser | null,
  module: EntitlementModule,
  subscriptions: readonly EntitlementSubscription[],
  purchases: readonly EntitlementPurchase[],
  opts: EntitlementOptions,
): boolean {
  if (!user) return false;
  if (module.isFreePreview) return true;
  return hasSubjectAccess(user, module.subject, subscriptions, purchases, opts);
}
