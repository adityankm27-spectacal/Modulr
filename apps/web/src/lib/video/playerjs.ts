/**
 * Minimal client for the player.js protocol (https://github.com/embedly/player.js),
 * which Bunny Stream's iframe player implements. Lets the page play, pause, seek
 * and listen for time updates without loading a third-party script.
 */
const CONTEXT = "player.js";
const VERSION = "0.0.11";

export interface PlayerJsMessage {
  event: string;
  value?: unknown;
  listener?: string;
}

/** Parses a postMessage payload; returns null for anything that isn't player.js. */
export function parsePlayerJsMessage(data: unknown): PlayerJsMessage | null {
  let message: unknown = data;
  if (typeof data === "string") {
    try {
      message = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (typeof message !== "object" || message === null) return null;
  const m = message as Record<string, unknown>;
  if (m.context !== CONTEXT || typeof m.event !== "string") return null;
  return {
    event: m.event,
    value: m.value,
    listener: typeof m.listener === "string" ? m.listener : undefined,
  };
}

export function playerJsCommand(method: string, value?: unknown, listener?: string): string {
  return JSON.stringify({
    context: CONTEXT,
    version: VERSION,
    method,
    ...(value === undefined ? {} : { value }),
    ...(listener ? { listener } : {}),
  });
}

/** Reads `{ seconds, duration }` from a timeupdate event value. */
export function readTimeUpdate(
  value: unknown,
): { seconds: number; duration: number | null } | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const seconds = Number(v.seconds);
  const duration = Number(v.duration);
  if (!Number.isFinite(seconds)) return null;
  return { seconds, duration: Number.isFinite(duration) && duration > 0 ? duration : null };
}
