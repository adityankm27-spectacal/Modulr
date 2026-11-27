import type { Database } from "@modulr/shared";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/env";
import { isSessionCheckExempt, isSessionReplaced, SESSION_REPLACED } from "@/lib/session";

/**
 * Refreshes the Supabase session cookie on every request so Server Components
 * always see a valid session, and signs out sessions replaced by a sign-in on
 * another device (lib/session.ts). Route protection itself happens in the pages
 * (lib/auth.ts), never only here.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseConfig();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Triggers a token refresh when needed. Do not run code between client creation and this call.
  const claimsStart = Date.now();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const claimsMs = Date.now() - claimsStart;

  // One active device per account: sign out sessions replaced by a newer sign-in.
  // In-app navigations (client router requests: prefetches and link clicks) skip the
  // database lookup, since it sits in front of every page switch. Full page loads, API
  // calls and form actions still check, and SessionWatch polls /api/session every 30 s,
  // so a replaced device is still signed out within about half a minute.
  const isRouterRequest =
    request.headers.has("next-router-prefetch") ||
    (request.headers.get("rsc") === "1" && !request.headers.has("next-action"));
  if (claims?.sub && !isRouterRequest && !isSessionCheckExempt(request.nextUrl.pathname)) {
    const profileStart = Date.now();
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_session_id")
      .eq("id", claims.sub)
      .maybeSingle();
    const profileMs = Date.now() - profileStart;
    // Slow sign-in checks show up in the host's logs, so a stall can be traced to its cause.
    if (claimsMs + profileMs > 1500) {
      console.warn(
        `[slow-proxy] ${request.nextUrl.pathname} claims=${claimsMs}ms profile=${profileMs}ms`,
      );
    }
    if (isSessionReplaced(claims.session_id, profile?.active_session_id)) {
      // Revokes this session and clears its cookies (via setAll above).
      await supabase.auth.signOut({ scope: "local" });
      const signedOut = request.nextUrl.pathname.startsWith("/api/")
        ? NextResponse.json(
            { error: "Signed in on another device", code: SESSION_REPLACED },
            {
              status: 401,
            },
          )
        : NextResponse.redirect(
            new URL(`/sign-in?error=${SESSION_REPLACED}`, request.nextUrl.origin),
          );
      for (const cookie of response.cookies.getAll()) signedOut.cookies.set(cookie);
      return signedOut;
    }
  }

  return response;
}
