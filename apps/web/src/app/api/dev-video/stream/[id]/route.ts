import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { apiError } from "@/lib/api";
import { getViewer } from "@/lib/auth";
import { devSecret } from "@/lib/video";
import { devVideoPath, readDevMeta } from "@/lib/video/dev";
import { verifyDevToken } from "@/lib/video/signing";

/**
 * Dev provider playback: serves the file behind a short-lived URL bound to one
 * signed-in user (like a provider's signed playback URL). Supports HTTP Range
 * requests so the player can seek.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_VIDEO !== "true") {
    return apiError(404, "Not found");
  }
  const { id } = await params;
  const url = new URL(request.url);
  const userId = url.searchParams.get("u") ?? "";
  const expires = Number(url.searchParams.get("expires"));
  const token = url.searchParams.get("token") ?? "";
  const viewer = await getViewer();
  if (
    !viewer ||
    viewer.userId !== userId ||
    !verifyDevToken(devSecret(), "stream", id, userId, expires, token)
  ) {
    return apiError(403, "Playback link is invalid or expired.");
  }

  let file: string;
  try {
    file = devVideoPath(id);
  } catch {
    return apiError(400, "Invalid video id");
  }
  const info = await stat(file).catch(() => null);
  if (!info) return apiError(404, "Not found");
  const type = (await readDevMeta(id))?.type ?? "video/mp4";

  const headers: Record<string, string> = {
    "content-type": type,
    "accept-ranges": "bytes",
    "cache-control": "private, no-store",
    "content-disposition": "inline",
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const size = info.size;
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) {
      return new Response(null, {
        status: 416,
        headers: { ...headers, "content-range": `bytes */${size}` },
      });
    }
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        ...headers,
        "content-range": `bytes ${start}-${end}/${size}`,
        "content-length": String(end - start + 1),
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "content-length": String(info.size) } });
}
