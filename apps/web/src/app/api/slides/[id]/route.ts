import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getViewer } from "@/lib/auth";
import { getSlideFileUrl } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

/**
 * GET /api/slides/:id — downloads a Slides-tab file. The link on the page stays valid;
 * the signed storage URL is only made when it is clicked, so it can be short-lived.
 * Entitlement is enforced by RLS (the documents row) and the `slides` storage policy.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return apiError(401, "Sign in to download.");
  const { id } = await params;
  if (!isUuid(id)) return apiError(404, "File not available.");

  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("file_path, file_name")
    .eq("id", id)
    .eq("kind", "slides")
    .maybeSingle();
  if (error) return apiError(500, "Couldn't load the file.");
  // Same response for "doesn't exist" and "not allowed", so access can't be probed.
  if (!doc?.file_path) return apiError(404, "File not available.");

  const url = await getSlideFileUrl(doc.file_path, { download: doc.file_name ?? "slides" });
  if (!url) return apiError(404, "File not available.");
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
