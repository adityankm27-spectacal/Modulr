import { NextResponse } from "next/server";

/**
 * Heartbeat for SessionWatch. The proxy does the real work: if this device's session
 * was replaced by a sign-in elsewhere, it signs it out and answers 401 before this runs.
 */
export function GET() {
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
