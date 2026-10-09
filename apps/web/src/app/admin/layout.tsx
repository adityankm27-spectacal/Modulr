import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getViewer, isAdmin, requireAdmin } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  // Only admins get the admin title template (see lib/admin/metadata.ts).
  return isAdmin(await getViewer())
    ? { title: { default: "Admin", template: "%s · Admin · Modulr" } }
    : {};
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/admin");

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-muted/40">
        <nav aria-label="Admin" className="mx-auto flex max-w-6xl items-center gap-1 px-4">
          <span className="mr-2 rounded-full bg-ink px-2.5 py-0.5 text-xs font-extrabold text-white">
            ADMIN
          </span>
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold hover:bg-muted"
          >
            Overview
          </Link>
          <Link
            href="/admin/catalog"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold hover:bg-muted"
          >
            Catalog
          </Link>
        </nav>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8">{children}</main>
    </div>
  );
}
