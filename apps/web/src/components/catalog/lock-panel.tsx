import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { ModuleLockState } from "@/lib/access";
import { formatPrice } from "@/lib/format";
import { signInPath } from "@/lib/redirect";

export function LockPanel({
  lock,
  returnTo,
  monthlyPricePaise,
  freeModuleHref,
}: {
  lock: Exclude<ModuleLockState, { kind: "open" }>;
  returnTo: string;
  monthlyPricePaise: number | null;
  freeModuleHref: string | null;
}) {
  const price = monthlyPricePaise ? `${formatPrice(monthlyPricePaise)}/month` : null;

  if (lock.kind === "sign_in" && lock.reason === "free_preview") {
    return (
      <Panel
        icon={<Sparkles aria-hidden="true" />}
        title="This module is free"
        body="Sign in to open the videos, notes and solved questions. It takes less than a minute and needs no payment."
      >
        <Link href={signInPath(returnTo)} className={buttonVariants({ size: "lg" })}>
          Sign in to start
        </Link>
      </Panel>
    );
  }

  return (
    <Panel
      icon={<Lock aria-hidden="true" />}
      title="Unlock this module"
      body={
        price
          ? `Get every module of every subject for ${price}. Cancel any time.`
          : "Subscribe to get every module of every subject."
      }
    >
      {lock.kind === "sign_in" ? (
        <Link href={signInPath(returnTo)} className={buttonVariants({ size: "lg" })}>
          Sign in
        </Link>
      ) : null}
      <Link
        href="/pricing"
        className={buttonVariants({
          size: "lg",
          variant: lock.kind === "sign_in" ? "outline" : "primary",
        })}
      >
        See plans
      </Link>
      {freeModuleHref ? (
        <Link
          href={freeModuleHref}
          className="inline-flex min-h-11 items-center text-sm font-bold text-link underline underline-offset-4"
        >
          Try the free module first
        </Link>
      ) : null}
    </Panel>
  );
}

function Panel({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-secondary p-6 text-secondary-foreground sm:p-8">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-sunflower text-ink [&_svg]:size-6">
        {icon}
      </span>
      <h2 className="mt-4 text-2xl">{title}</h2>
      <p className="mt-2 max-w-prose">{body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}
