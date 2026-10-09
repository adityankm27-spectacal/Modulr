import "server-only";
import type { Metadata } from "next";
import { getViewer, isAdmin } from "@/lib/auth";

const HIDDEN: Metadata = {
  title: { absolute: "Page not found · Modulr" },
  robots: { index: false, follow: false },
};

/**
 * Page titles for admin routes. Metadata resolves independently of the layout's
 * notFound(), so non-admins must not get a title that reveals the admin area.
 */
export function adminMetadata(title: string) {
  return async (): Promise<Metadata> =>
    isAdmin(await getViewer()) ? { title, robots: { index: false, follow: false } } : HIDDEN;
}
