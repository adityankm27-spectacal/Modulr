/** Who may use the planner: subscribers, plus admins and students given free access. */
export function canUsePlanner(input: {
  role: string;
  compAccessUntil: string | null;
  hasSubscriptionAccess: boolean;
  now?: Date;
}): boolean {
  if (input.role === "admin") return true;
  if (input.hasSubscriptionAccess) return true;
  const now = input.now ?? new Date();
  return Boolean(input.compAccessUntil && new Date(input.compAccessUntil) > now);
}
