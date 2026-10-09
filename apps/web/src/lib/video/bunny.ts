import "server-only";
import { bunnyEmbedToken, bunnyTusSignature, nowSeconds } from "./signing";
import {
  VideoProviderError,
  type ProcessingStatus,
  type ProviderVideoStatus,
  type VideoChapterInput,
  type VideoProvider,
} from "./types";

/**
 * Bunny Stream adapter (https://docs.bunny.net/reference/video_createvideo).
 * Uploads go straight from the admin's browser to Bunny over TUS (resumable),
 * authorised by a short-lived signature; playback uses Bunny's DRM-capable
 * iframe player with embed token authentication.
 *
 * Status: written against Bunny's documented API, not yet exercised against a
 * real library (no account at the time of writing).
 */

export interface BunnyConfig {
  libraryId: string;
  apiKey: string;
  tokenSecurityKey: string;
  /** Pull zone hostname for thumbnails, e.g. vz-abc123.b-cdn.net */
  cdnHostname: string | null;
}

const API = "https://video.bunnycdn.com";
const EMBED = "https://iframe.mediadelivery.net/embed";

/** Bunny video status codes → Modulr processing_status. */
export function mapBunnyStatus(code: number): ProcessingStatus {
  switch (code) {
    case 0:
      return "pending"; // created, nothing uploaded
    case 4:
      return "ready"; // finished
    case 5:
    case 6:
      return "failed"; // error / upload failed
    default:
      return "processing"; // 1 uploaded, 2 processing, 3 transcoding, 7–8 JIT stages
  }
}

/** Bunny chapters need an end time: each ends where the next starts (last ends at the video end). */
export function toBunnyChapters(chapters: VideoChapterInput[], durationSec: number | null) {
  return chapters.map((c, i) => ({
    title: c.title,
    start: c.start_sec,
    end: chapters[i + 1]?.start_sec ?? durationSec ?? c.start_sec + 1,
  }));
}

export class BunnyProvider implements VideoProvider {
  readonly name = "bunny" as const;

  constructor(private readonly config: BunnyConfig) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API}/library/${this.config.libraryId}${path}`, {
      ...init,
      headers: {
        AccessKey: this.config.apiKey,
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new VideoProviderError(
        `Bunny Stream returned ${response.status} for ${init.method ?? "GET"} ${path}`,
      );
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  async createVideo(title: string) {
    const video = await this.request<{ guid: string }>("/videos", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    if (!video.guid) throw new VideoProviderError("Bunny Stream did not return a video id.");
    return video.guid;
  }

  async createUpload(providerVideoId: string, file: { name: string; type: string }) {
    const expires = nowSeconds() + 6 * 60 * 60; // long enough for a slow upload to resume
    return {
      protocol: "tus" as const,
      endpoint: `${API}/tusupload`,
      headers: {
        AuthorizationSignature: bunnyTusSignature(
          this.config.libraryId,
          this.config.apiKey,
          expires,
          providerVideoId,
        ),
        AuthorizationExpire: String(expires),
        VideoId: providerVideoId,
        LibraryId: this.config.libraryId,
      },
      metadata: { filetype: file.type || "video/mp4", title: file.name },
    };
  }

  async getStatus(providerVideoId: string): Promise<ProviderVideoStatus> {
    const video = await this.request<{
      status: number;
      length?: number;
      thumbnailFileName?: string;
    }>(`/videos/${providerVideoId}`);
    const status = mapBunnyStatus(video.status);
    return {
      status,
      durationSec: video.length ? Math.round(video.length) : null,
      thumbnailUrl:
        status === "ready" && this.config.cdnHostname && video.thumbnailFileName
          ? `https://${this.config.cdnHostname}/${providerVideoId}/${video.thumbnailFileName}`
          : null,
    };
  }

  async getPlayback(providerVideoId: string, _viewer: { userId: string }, ttlSeconds: number) {
    const expires = nowSeconds() + ttlSeconds;
    const params = new URLSearchParams({
      token: bunnyEmbedToken(this.config.tokenSecurityKey, providerVideoId, expires),
      expires: String(expires),
      autoplay: "false",
      preload: "true",
      responsive: "true",
    });
    return {
      kind: "iframe" as const,
      src: `${EMBED}/${this.config.libraryId}/${providerVideoId}?${params.toString()}`,
      expiresAt: new Date(expires * 1000).toISOString(),
    };
  }

  async updateMetadata(
    providerVideoId: string,
    meta: { title: string; chapters: VideoChapterInput[]; durationSec: number | null },
  ) {
    await this.request(`/videos/${providerVideoId}`, {
      method: "POST",
      body: JSON.stringify({
        title: meta.title,
        chapters: toBunnyChapters(meta.chapters, meta.durationSec),
      }),
    });
  }

  async deleteVideo(providerVideoId: string) {
    await this.request(`/videos/${providerVideoId}`, { method: "DELETE" });
  }
}
