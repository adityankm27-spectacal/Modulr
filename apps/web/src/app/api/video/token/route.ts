import { z } from "zod";
import { apiError, json, readJson } from "@/lib/api";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getVideoProvider, PLAYBACK_TTL_SECONDS } from "@/lib/video";
import { VideoProviderError } from "@/lib/video/types";

const body = z.object({ videoId: z.uuid() });

/**
 * POST /api/video/token (spec §9): checks entitlement and returns a short-lived
 * playback URL. Entitlement is enforced by RLS: a viewer without access simply
 * cannot read the video row. Device checks join here in M5.
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return apiError(401, "Sign in to watch.");

  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "Invalid request.");

  const supabase = await createClient();
  const { data: video, error } = await supabase
    .from("videos")
    .select("id, provider, provider_video_id, processing_status")
    .eq("id", parsed.data.videoId)
    .maybeSingle();
  if (error) return apiError(500, "Couldn't load the video.");
  // Same response for "doesn't exist" and "not allowed", so access can't be probed.
  if (!video) return apiError(404, "Video not available.");
  if (video.processing_status !== "ready" || !video.provider_video_id) {
    return apiError(409, "This video is still processing. Try again in a few minutes.");
  }

  try {
    const provider = getVideoProvider(video.provider);
    const playback = await provider.getPlayback(
      video.provider_video_id,
      { userId: viewer.userId },
      PLAYBACK_TTL_SECONDS,
    );
    return json({ playback });
  } catch (err) {
    console.error(err);
    return apiError(
      503,
      err instanceof VideoProviderError
        ? "Video playback is unavailable right now."
        : "Something went wrong.",
    );
  }
}
