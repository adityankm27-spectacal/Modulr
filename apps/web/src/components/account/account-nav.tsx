import { CreditCard, LogOut, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { initials, type AccountTab } from "@/lib/account-tabs";
import { cn } from "@/lib/utils";

const ITEMS: { tab: AccountTab; label: string; short: string; icon: LucideIcon }[] = [
  { tab: "profile", label: "Profile", short: "Profile", icon: UserRound },
  { tab: "billing", label: "Plan and billing", short: "Plan", icon: CreditCard },
  { tab: "sign-out", label: "Sign out", short: "Sign out", icon: LogOut },
];

/** Sidebar on laptops, a scrolling row of pills above the content on phones. */
export function AccountNav({
  active,
  name,
  email,
}: {
  active: AccountTab;
  name: string | null;
  email: string | null;
}) {
  return (
    <nav
      aria-label="Account sections"
      className="rounded-3xl border-[3px] border-line bg-card p-3 shadow-[0_5px_0_0_var(--line)] lg:sticky lg:top-4 lg:self-start"
    >
      <div className="hidden items-center gap-3 px-2 pb-4 lg:flex">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-line bg-sunflower font-display text-base font-black text-ink"
        >
          {initials(name, email)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-extrabold">{name || "Your account"}</span>
          <span className="block truncate text-sm text-muted-foreground">{email}</span>
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:flex sm:overflow-x-auto lg:flex-col lg:overflow-visible">
        {ITEMS.map(({ tab, label, short, icon: Icon }) => {
          const current = tab === active;
          return (
            <li key={tab} className="min-w-0 sm:shrink-0 lg:shrink">
              <Link
                href={`/account?tab=${tab}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-xl border-[3px] px-3 font-extrabold whitespace-nowrap transition-colors sm:justify-start",
                  current
                    ? "border-line bg-sunflower text-ink"
                    : "border-transparent hover:bg-muted",
                  tab === "sign-out" && !current && "text-danger-text",
                )}
              >
                <Icon className="hidden size-5 shrink-0 sm:block" aria-hidden="true" />
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
