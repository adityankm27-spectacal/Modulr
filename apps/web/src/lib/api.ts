import { NextResponse } from "next/server";

const NO_STORE = { "cache-control": "private, no-store" };

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function apiError(status: number, error: string) {
  return json({ error }, status);
}

/** Parses a JSON body, including sendBeacon's text/plain bodies. */
export async function readJson(request: Request, maxBytes = 10_000): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
