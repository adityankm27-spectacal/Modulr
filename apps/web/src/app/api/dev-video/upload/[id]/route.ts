import { createWriteStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { apiError, json } from "@/lib/api";
import { getViewer, isAdmin } from "@/lib/auth";
import { devSecret } from "@/lib/video";
import { DEV_MAX_UPLOAD_BYTES, DEV_VIDEO_DIR, devVideoPath } from "@/lib/video/dev";
import { verifyDevToken } from "@/lib/video/signing";

/** Dev provider upload: stands in for the provider's upload endpoint. Admins only. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_VIDEO !== "true") {
    return apiError(404, "Not found");
  }
  const { id } = await params;
  const url = new URL(request.url);
  const expires = Number(url.searchParams.get("expires"));
  const token = url.searchParams.get("token") ?? "";
  if (
    !isAdmin(await getViewer()) ||
    !verifyDevToken(devSecret(), "upload", id, "admin", expires, token)
  ) {
    return apiError(403, "Upload link is invalid or expired.");
  }

  let file: string;
  try {
    file = devVideoPath(id);
  } catch {
    return apiError(400, "Invalid video id");
  }
  if (!request.body) return apiError(400, "Empty upload");

  await mkdir(DEV_VIDEO_DIR, { recursive: true });
  let size = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _enc, done) {
      size += chunk.length;
      done(size > DEV_MAX_UPLOAD_BYTES ? new Error("too large") : null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(request.body as never), limit, createWriteStream(file));
  } catch {
    await rm(file, { force: true });
    return apiError(413, "Upload failed or the file is larger than 500 MB.");
  }
  await writeFile(
    `${file}.json`,
    JSON.stringify({ type: request.headers.get("content-type") || "video/mp4" }),
  );
  return json({ ok: true, size });
}
