import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { SessionWatch } from "@/components/session-watch";
import { getViewer, isAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Header links prefetch the whole page in the background, so a click opens it at once.
const navLink =
  "inline-flex min-h-11 items-center rounded-full px-1.5 text-sm font-extrabold whitespace-nowrap text-foreground transition-colors hover:bg-muted sm:px-3 relative after:absolute after:inset-x-3 after:bottom-1.5 after:h-[3px] after:origin-left after:scale-x-0 after:rounded-full after:bg-cobalt after:transition-transform after:duration-300 hover:after:scale-x-100";

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="relative z-40 px-3 pt-4 sm:px-4">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-1 rounded-full border-[3px] border-line bg-card py-1 pr-1 pl-3 shadow-[0_5px_0_0_var(--line)] motion-safe:animate-rise sm:gap-2 sm:pr-2 sm:pl-5">
        <Link
          prefetch
          href={viewer ? "/home" : "/"}
          aria-label="Modulr home"
          className="shrink-0 rounded-lg"
        >
          {/* On very narrow phones the wordmark gives way so the icons always fit. */}
          <Logo className="max-[340px]:[&>span:last-child]:hidden" />
        </Link>
        <nav aria-label="Main" className="flex shrink-0 items-center sm:gap-1">
          {viewer ? (
            <>
              <SessionWatch />
              {isAdmin(viewer) ? (
                <Link prefetch href="/admin" className={cn(navLink, "hidden sm:inline-flex")}>
                  Admin
                </Link>
              ) : null}
              <Link prefetch href="/pricing" className={navLink}>
                Pricing
              </Link>
              <Link prefetch href="/home" className={navLink}>
                <span className="sm:hidden">Subjects</span>
                <span className="hidden sm:inline">My subjects</span>
              </Link>
              <Link
                prefetch
                href="/account"
                aria-label="Account"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}
              >
                <CircleUserRound aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <Link prefetch href="/pricing" className={navLink}>
                Pricing
              </Link>
              <Link prefetch href="/sign-in" className={buttonVariants({ size: "sm" })}>
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
