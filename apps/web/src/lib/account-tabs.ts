/** Sections of the account page, shown one at a time via ?tab=. */
export const ACCOUNT_TABS = ["profile", "billing", "sign-out"] as const;
export type AccountTab = (typeof ACCOUNT_TABS)[number];

/** What most students come to the page for. */
export const DEFAULT_ACCOUNT_TAB: AccountTab = "billing";

export function parseAccountTab(value: string | string[] | undefined): AccountTab {
  const first = Array.isArray(value) ? value[0] : value;
  return ACCOUNT_TABS.find((tab) => tab === first) ?? DEFAULT_ACCOUNT_TAB;
}

/** "Asha Rao" → "AR", "asha" → "A"; falls back to the email's first letter. */
export function initials(name: string | null | undefined, email: string | null | undefined) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words.slice(0, 1);
  const fromName = letters.map((word) => word?.[0] ?? "").join("");
  return (fromName || (email ?? "").trim()[0] || "?").toUpperCase();
}
