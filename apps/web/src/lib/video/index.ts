import "server-only";
import { BunnyProvider } from "./bunny";
import { DevProvider } from "./dev";
import { VideoProviderError, type ProviderName, type VideoProvider } from "./types";

/** Lifetime of a playback URL. Long enough to start and watch; re-requested on reload. */
export const PLAYBACK_TTL_SECONDS = 2 * 60 * 60;

function devSecret() {
  return process.env.DEV_VIDEO_SECRET ?? "modulr-local-dev-video-secret-not-for-production";
}

/** The provider new uploads go to (env VIDEO_PROVIDER). */
export function configuredProviderName(): ProviderName {
  const name =
    process.env.VIDEO_PROVIDER ?? (process.env.NODE_ENV === "production" ? "bunny" : "dev");
  if (name !== "bunny" && name !== "dev" && name !== "vdocipher") {
    throw new VideoProviderError(`Unknown VIDEO_PROVIDER "${name}".`);
  }
  return name;
}

export function getVideoProvider(name: ProviderName = configuredProviderName()): VideoProvider {
  switch (name) {
    case "bunny": {
      const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
      const apiKey = process.env.BUNNY_STREAM_API_KEY;
      const tokenSecurityKey = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY;
      if (!libraryId || !apiKey || !tokenSecurityKey) {
        throw new VideoProviderError(
          "Bunny Stream is not configured. Set BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY and BUNNY_STREAM_TOKEN_SECURITY_KEY.",
        );
      }
      return new BunnyProvider({
        libraryId,
        apiKey,
        tokenSecurityKey,
        cdnHostname: process.env.BUNNY_STREAM_CDN_HOSTNAME ?? null,
      });
    }
    case "dev":
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_VIDEO !== "true") {
        throw new VideoProviderError("The dev video provider is disabled in production.");
      }
      return new DevProvider(devSecret());
    case "vdocipher":
      throw new VideoProviderError(
        "The VdoCipher adapter is not built yet (spec §7: Bunny was chosen first).",
      );
  }
}

export { devSecret };
