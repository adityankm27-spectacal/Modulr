"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function canGoBackWithinSite(): boolean {
  // Navigation API (Chromium): its history only lists entries from this origin,
  // so canGoBack is exactly "the previous page is on Modulr".
  const navigation = (window as { navigation?: { canGoBack?: unknown } }).navigation;
  if (typeof navigation?.canGoBack === "boolean") return navigation.canGoBack;
  // Elsewhere: the referrer is only set on full page loads, so this can miss
  // in-app navigations; then the fallback link is used, which is still safe.
  try {
    return (
      window.history.length > 1 && new URL(document.referrer).origin === window.location.origin
    );
  } catch {
    return false; // no or malformed referrer
  }
}

/**
 * Returns to the previous page on this site. When there is none (opened in a new tab,
 * from a bookmark or another site), goes to `fallbackHref` instead of leaving Modulr.
 */
export function BackButton({
  fallbackHref,
  label = "Back",
}: {
  fallbackHref: string;
  label?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (canGoBackWithinSite()) router.back();
    else router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-bold text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
