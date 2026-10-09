import { z } from "zod";
import { apiError, json, readJson } from "@/lib/api";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const body = z.object({
  videoId: z.uuid(),
  positionSec: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60),
  completed: z.boolean().optional(),
});

/**
 * POST /api/progress (spec §9): saves the viewer's position in a video.
 * RLS only allows rows for videos the viewer can see. Once a video is marked
 * completed it stays completed, even if it's rewatched from the start.
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return apiError(401, "Sign in to save progress.");

  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "Invalid request.");
  const { videoId, positionSec, completed = false } = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("watch_progress")
    .select("completed")
    .eq("user_id", viewer.userId)
    .eq("video_id", videoId)
    .maybeSingle();

  const { error } = await supabase.from("watch_progress").upsert(
    {
      user_id: viewer.userId,
      video_id: videoId,
      position_sec: positionSec,
      completed: completed || (existing?.completed ?? false),
    },
    { onConflict: "user_id,video_id" },
  );
  if (error) {
    return error.code === "42501"
      ? apiError(404, "Video not available.")
      : apiError(500, "Couldn't save progress.");
  }
  return json({ ok: true });
}
