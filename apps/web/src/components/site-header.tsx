import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { SessionWatch } from "@/components/session-watch";
import { getViewer, isAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navLink =
  "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href={viewer ? "/home" : "/"} aria-label="Modulr home" className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {viewer ? (
            <>
              <SessionWatch />
              {isAdmin(viewer) ? (
                <Link href="/admin" className={navLink}>
                  Admin
                </Link>
              ) : null}
              <Link href="/home" className={navLink}>
                My subjects
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
              <Link href="/subjects" className={cn(navLink, "hidden sm:inline-flex")}>
                Subjects
              </Link>
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
