/**
 * Sanitises a user-supplied `next` path so sign-in redirects can only go to
 * pages on this site (no open redirects to other origins).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  // Reject anything a URL parser would treat as another origin.
  try {
    const url = new URL(next, "http://modulr.invalid");
    if (url.origin !== "http://modulr.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function signInPath(next: string): string {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}
