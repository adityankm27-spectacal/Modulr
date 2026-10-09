import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  bunnyEmbedToken,
  bunnyTusSignature,
  safeEqual,
  signDevToken,
  verifyDevToken,
} from "./signing";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

describe("Bunny signatures", () => {
  it("concatenates fields in the documented order", () => {
    expect(bunnyTusSignature("123", "key", 1700000000, "guid")).toBe(sha("123key1700000000guid"));
    expect(bunnyEmbedToken("tok", "guid", 1700000000)).toBe(sha("tokguid1700000000"));
    expect(bunnyTusSignature("123", "key", 1700000000, "guid")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("dev tokens", () => {
  const now = Date.UTC(2026, 9, 11);
  const exp = now / 1000 + 600;

  it("verify only for the same purpose, id, subject and secret", () => {
    const token = signDevToken("s3cret", "stream", "vid", "user", exp);
    expect(verifyDevToken("s3cret", "stream", "vid", "user", exp, token, now)).toBe(true);
    expect(verifyDevToken("other", "stream", "vid", "user", exp, token, now)).toBe(false);
    expect(verifyDevToken("s3cret", "upload", "vid", "user", exp, token, now)).toBe(false);
    expect(verifyDevToken("s3cret", "stream", "vid2", "user", exp, token, now)).toBe(false);
    expect(verifyDevToken("s3cret", "stream", "vid", "user2", exp, token, now)).toBe(false);
    expect(verifyDevToken("s3cret", "stream", "vid", "user", exp + 1, token, now)).toBe(false);
  });

  it("expire", () => {
    const token = signDevToken("s3cret", "stream", "vid", "user", exp);
    expect(verifyDevToken("s3cret", "stream", "vid", "user", exp, token, (exp + 1) * 1000)).toBe(
      false,
    );
  });

  it("reject malformed tokens", () => {
    expect(verifyDevToken("s3cret", "stream", "vid", "user", exp, "short", now)).toBe(false);
    expect(verifyDevToken("s3cret", "stream", "vid", "user", Number.NaN, "x", now)).toBe(false);
  });
});

describe("safeEqual", () => {
  it("compares in constant time and handles different lengths", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
