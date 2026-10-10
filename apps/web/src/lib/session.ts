/**
 * One active device per account (spec §16 Q5 = 1): the newest sign-in wins.
 * A database trigger records each new Supabase Auth session as the profile's
 * active_session_id; any request carrying an older session is signed out.
 */

/** `?error=` on /sign-in, and the `code` of API 401s, when another device took over. */
export const SESSION_REPLACED = "other-device";

/**
 * True when this request's session has been replaced by a newer sign-in.
 * Unknown values (no session claim, or no active session recorded yet) never sign
 * anyone out, so a missing trigger run fails open rather than locking users out.
 */
export function isSessionReplaced(
  sessionId: unknown,
  activeSessionId: string | null | undefined,
): boolean {
  return typeof sessionId === "string" && Boolean(activeSessionId) && sessionId !== activeSessionId;
}

/** Paths that must keep working for a replaced session (finishing sign-in, signing out). */
export function isSessionCheckExempt(pathname: string): boolean {
  return pathname.startsWith("/auth/") || pathname === "/sign-in";
}
