import { z } from "zod";
import { apiError, json, readJson } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/service";
import { getVideoProvider } from "@/lib/video";
import { providerChaptersUpdate } from "@/lib/video/chapters";
import { safeEqual } from "@/lib/video/signing";

const payload = z.object({ VideoGuid: z.string().min(1).max(100) });

/**
 * Bunny Stream webhook (configure the URL in the library settings as
 * https://<domain>/api/webhooks/bunny?token=<BUNNY_WEBHOOK_SECRET>).
 * The payload is only used to know *which* video changed; its status is then
 * fetched from Bunny's API, so a forged payload can't mark a video ready.
 */
export async function POST(request: Request) {
  const secret = process.env.BUNNY_WEBHOOK_SECRET;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!secret || !safeEqual(token, secret)) return apiError(401, "Unauthorized");

  const parsed = payload.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "Invalid payload");

  const supabase = createServiceClient();
  const { data: video } = await supabase
    .from("videos")
    .select("id, duration_sec, chapters")
    .eq("provider", "bunny")
    .eq("provider_video_id", parsed.data.VideoGuid)
    // A mirrored subject (e.g. IT FM -> CS FM) has more than one row for the same video:
    // read the original (mirror_of is null) and update every row below.
    .order("mirror_of", { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();
  // Unknown videos are acknowledged so Bunny doesn't keep retrying.
  if (!video) return json({ ok: true, ignored: true });

  const status = await getVideoProvider("bunny").getStatus(parsed.data.VideoGuid);
  const { error } = await supabase
    .from("videos")
    .update({
      processing_status: status.status,
      duration_sec: status.durationSec ?? video.duration_sec,
      ...(status.thumbnailUrl ? { thumbnail_url: status.thumbnailUrl } : {}),
      ...providerChaptersUpdate(video.chapters, status),
    })
    .eq("provider", "bunny")
    .eq("provider_video_id", parsed.data.VideoGuid);
  if (error) return apiError(500, "Update failed");
  return json({ ok: true, status: status.status });
}
