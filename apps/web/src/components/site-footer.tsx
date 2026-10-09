import Link from "next/link";
import { Logo } from "@/components/logo";

const links = [
  { href: "/subjects", label: "Subjects" },
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-md text-sm text-muted-foreground">
            Modulr is an independent learning platform. It is not affiliated with, or endorsed by,
            any college or university.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm font-bold text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
