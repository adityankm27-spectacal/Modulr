import type { Enums } from "@modulr/shared";

export type ProviderName = Enums<"video_provider">;
export type ProcessingStatus = Enums<"video_processing_status">;

/** Where the admin's browser sends the file. The provider's API key never leaves the server. */
export type UploadTarget =
  | {
      protocol: "tus";
      endpoint: string;
      headers: Record<string, string>;
      metadata: Record<string, string>;
    }
  | { protocol: "put"; url: string };

/** What the student's browser needs to play a video; always short-lived. */
export type Playback =
  | { kind: "iframe"; src: string; expiresAt: string }
  | { kind: "file"; src: string; expiresAt: string };

export interface ProviderVideoStatus {
  status: ProcessingStatus;
  durationSec: number | null;
  thumbnailUrl: string | null;
}

export interface VideoChapterInput {
  title: string;
  start_sec: number;
}

/**
 * Everything Modulr needs from a video host (spec §7: VdoCipher or Bunny Stream
 * behind one interface, so the vendor can be swapped).
 */
export interface VideoProvider {
  readonly name: ProviderName;
  /** Creates an empty video on the provider and returns its id. */
  createVideo(title: string): Promise<string>;
  /** Short-lived, pre-authorised upload target for the admin's browser. */
  createUpload(
    providerVideoId: string,
    file: { name: string; type: string },
  ): Promise<UploadTarget>;
  getStatus(providerVideoId: string): Promise<ProviderVideoStatus>;
  /** Signed playback URL for one viewer, valid for `ttlSeconds`. */
  getPlayback(
    providerVideoId: string,
    viewer: { userId: string },
    ttlSeconds: number,
  ): Promise<Playback>;
  /** Pushes title and chapters to the provider's own player, where supported. */
  updateMetadata(
    providerVideoId: string,
    meta: { title: string; chapters: VideoChapterInput[]; durationSec: number | null },
  ): Promise<void>;
  deleteVideo(providerVideoId: string): Promise<void>;
}

export class VideoProviderError extends Error {}
