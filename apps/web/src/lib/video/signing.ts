import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const sha256Hex = (input: string) => createHash("sha256").update(input).digest("hex");

/** Bunny Stream TUS upload signature: sha256(library_id + api_key + expiration_time + video_id). */
export function bunnyTusSignature(
  libraryId: string,
  apiKey: string,
  expires: number,
  videoId: string,
) {
  return sha256Hex(`${libraryId}${apiKey}${expires}${videoId}`);
}

/** Bunny Stream embed token authentication: sha256(token_security_key + video_id + expiration). */
export function bunnyEmbedToken(tokenKey: string, videoId: string, expires: number) {
  return sha256Hex(`${tokenKey}${videoId}${expires}`);
}

/** HMAC-signed, expiring capability for the dev provider's upload and stream routes. */
export function signDevToken(
  secret: string,
  purpose: "upload" | "stream",
  id: string,
  subject: string,
  expires: number,
) {
  return createHmac("sha256", secret)
    .update(`${purpose}.${id}.${subject}.${expires}`)
    .digest("base64url");
}

export function verifyDevToken(
  secret: string,
  purpose: "upload" | "stream",
  id: string,
  subject: string,
  expires: number,
  token: string,
  now = Date.now(),
): boolean {
  if (!Number.isFinite(expires) || expires * 1000 < now) return false;
  const expected = Buffer.from(signDevToken(secret, purpose, id, subject, expires));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Constant-time comparison for shared secrets (e.g. webhook tokens). */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);
