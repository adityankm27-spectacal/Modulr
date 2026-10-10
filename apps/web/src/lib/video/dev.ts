import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { nowSeconds, signDevToken } from "./signing";
import type { ProviderVideoStatus, VideoProvider } from "./types";

/**
 * Local stand-in for a video host, for development only. Files live under
 * apps/web/.dev-videos and are served by /api/dev-video/* behind short-lived
 * HMAC-signed URLs, mimicking a real provider's signed playback. No DRM.
 */
export const DEV_VIDEO_DIR = path.join(process.cwd(), ".dev-videos");
export const DEV_MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

export function devVideoPath(providerVideoId: string) {
  if (!/^dev-[0-9a-f-]{36}$/.test(providerVideoId)) throw new Error("Invalid dev video id");
  return path.join(DEV_VIDEO_DIR, `${providerVideoId}.bin`);
}

export async function readDevMeta(providerVideoId: string): Promise<{ type: string } | null> {
  try {
    return JSON.parse(await readFile(`${devVideoPath(providerVideoId)}.json`, "utf8"));
  } catch {
    return null;
  }
}

export class DevProvider implements VideoProvider {
  readonly name = "dev" as const;

  constructor(private readonly secret: string) {}

  async createVideo() {
    await mkdir(DEV_VIDEO_DIR, { recursive: true });
    return `dev-${randomUUID()}`;
  }

  async createUpload(providerVideoId: string) {
    const expires = nowSeconds() + 60 * 60;
    const token = signDevToken(this.secret, "upload", providerVideoId, "admin", expires);
    return {
      protocol: "put" as const,
      url: `/api/dev-video/upload/${providerVideoId}?expires=${expires}&token=${token}`,
    };
  }

  async getStatus(providerVideoId: string): Promise<ProviderVideoStatus> {
    try {
      await stat(devVideoPath(providerVideoId));
      return { status: "ready", durationSec: null, thumbnailUrl: null, chapters: [] };
    } catch {
      return { status: "pending", durationSec: null, thumbnailUrl: null, chapters: [] };
    }
  }

  async getPlayback(providerVideoId: string, viewer: { userId: string }, ttlSeconds: number) {
    const expires = nowSeconds() + ttlSeconds;
    const token = signDevToken(this.secret, "stream", providerVideoId, viewer.userId, expires);
    const params = new URLSearchParams({ u: viewer.userId, expires: String(expires), token });
    return {
      kind: "file" as const,
      src: `/api/dev-video/stream/${providerVideoId}?${params.toString()}`,
      expiresAt: new Date(expires * 1000).toISOString(),
    };
  }

  async updateMetadata() {
    // Chapters live in Modulr's own database; nothing to push.
  }

  async deleteVideo(providerVideoId: string) {
    const file = devVideoPath(providerVideoId);
    await rm(file, { force: true });
    await rm(`${file}.json`, { force: true });
  }
}
