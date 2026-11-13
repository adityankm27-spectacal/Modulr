import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { SessionWatch } from "@/components/session-watch";
import { getViewer, isAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navLink =
  "inline-flex min-h-11 items-center rounded-full px-2 text-sm font-extrabold whitespace-nowrap text-foreground transition-colors hover:bg-muted sm:px-3";

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 rounded-full border-[3px] border-line bg-card py-1 pr-2 pl-4 sm:pl-5 shadow-[0_5px_0_0_var(--line)]">
        <Link href={viewer ? "/home" : "/"} aria-label="Modulr home" className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {viewer ? (
            <>
              <SessionWatch />
              {isAdmin(viewer) ? (
                <Link href="/admin" className={cn(navLink, "hidden sm:inline-flex")}>
                  Admin
                </Link>
              ) : null}
              <Link href="/pricing" className={navLink}>
                Pricing
              </Link>
              <Link href="/home" className={navLink}>
                <span className="sm:hidden">Subjects</span>
                <span className="hidden sm:inline">My subjects</span>
              </Link>
              <Link
                href="/account"
                aria-label="Account"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              >
                <CircleUserRound aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/pricing" className={navLink}>
                Pricing
              </Link>
              <Link href="/sign-in" className={buttonVariants({ size: "sm" })}>
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
