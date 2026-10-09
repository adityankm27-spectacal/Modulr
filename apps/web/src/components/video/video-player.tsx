"use client";

import { formatTimestamp, type VideoChapter } from "@modulr/shared";
import { Loader2, Maximize, Minimize, Play, RotateCcw, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parsePlayerJsMessage, playerJsCommand, readTimeUpdate } from "@/lib/video/playerjs";
import type { Playback } from "@/lib/video/types";
import { currentChapterIndex, isCompleted, shouldSaveProgress } from "@/lib/video/watch";
import { Watermark } from "./watermark";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const UP_NEXT_SECONDS = 8;

interface Props {
  video: { id: string; title: string; durationSec: number | null; chapters: VideoChapter[] };
  resumeAt: number;
  watermark: { name: string; email: string };
  next: { href: string; title: string } | null;
  autoplay?: boolean;
  /** Admin preview: don't record progress. */
  recordProgress?: boolean;
}

type Load =
  | { state: "loading" }
  | { state: "ready"; playback: Playback }
  | { state: "error"; message: string };

async function fetchPlayback(videoId: string): Promise<Load> {
  try {
    const response = await fetch("/api/video/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      playback?: Playback;
      error?: string;
    };
    if (response.ok && body.playback) return { state: "ready", playback: body.playback };
    return { state: "error", message: body.error ?? "This video can't be played right now." };
  } catch {
    return { state: "error", message: "Couldn't reach the server. Check your connection." };
  }
}

/**
 * Student video player (spec §5.2, §5.5): signed short-lived playback, moving
 * watermark, speed, resume, chapters, "up next", and progress saving. Works with
 * the provider's iframe player (Bunny, via player.js) or a plain file (dev).
 */
export function VideoPlayer({
  video,
  resumeAt,
  watermark,
  next,
  autoplay = false,
  recordProgress = true,
}: Props) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const videoEl = useRef<HTMLVideoElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);

  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(video.durationSec);
  const [rate, setRate] = useState(1);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [resumed, setResumed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const position = useRef(0);
  const saved = useRef({ at: Date.now(), position: resumeAt, completed: false });
  const resumeDone = useRef(false);
  const retried = useRef(false);

  // ---- Playback URL ---------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    void fetchPlayback(video.id).then((result) => !cancelled && setLoad(result));
    return () => {
      cancelled = true;
    };
  }, [video.id]);

  // ---- Progress -------------------------------------------------------------
  const save = useCallback(
    (positionSec: number, completed: boolean, beacon = false) => {
      if (!recordProgress) return;
      const body = JSON.stringify({
        videoId: video.id,
        positionSec: Math.floor(positionSec),
        completed,
      });
      saved.current = {
        at: Date.now(),
        position: positionSec,
        completed: saved.current.completed || completed,
      };
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/progress", new Blob([body], { type: "text/plain" }));
      } else {
        void fetch("/api/progress", { method: "POST", body, keepalive: true }).catch(
          () => undefined,
        );
      }
    },
    [recordProgress, video.id],
  );

  const onTime = useCallback(
    (seconds: number, total: number | null) => {
      position.current = seconds;
      setTime(seconds);
      if (total) setDuration(total);
      const done = isCompleted(seconds, total ?? duration);
      if (done && !saved.current.completed) save(seconds, true);
      else if (
        shouldSaveProgress({
          now: Date.now(),
          lastSavedAt: saved.current.at,
          lastSavedPosition: saved.current.position,
          position: seconds,
        })
      ) {
        save(seconds, false);
      }
    },
    [duration, save],
  );

  const onPause = useCallback(() => {
    if (Math.abs(position.current - saved.current.position) >= 1) save(position.current, false);
  }, [save]);

  const onEnded = useCallback(() => {
    setEnded(true);
    save(duration ?? position.current, true);
    if (next) setCountdown(UP_NEXT_SECONDS);
  }, [duration, next, save]);

  useEffect(() => {
    const flush = () => {
      if (
        document.visibilityState === "hidden" &&
        Math.abs(position.current - saved.current.position) >= 1
      ) {
        save(position.current, false, true);
      }
    };
    document.addEventListener("visibilitychange", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      if (Math.abs(position.current - saved.current.position) >= 1)
        save(position.current, false, true);
    };
  }, [save]);

  // ---- Engine (plain file or iframe via player.js) ------------------------------
  const playback = load.state === "ready" ? load.playback : null;
  const origin = playback?.kind === "iframe" ? new URL(playback.src).origin : null;

  const command = useCallback(
    (method: string, value?: unknown, listener?: string) => {
      if (origin)
        iframe.current?.contentWindow?.postMessage(
          playerJsCommand(method, value, listener),
          origin,
        );
    },
    [origin],
  );

  const seek = useCallback(
    (seconds: number, play = true) => {
      setEnded(false);
      setCountdown(null);
      if (videoEl.current) {
        videoEl.current.currentTime = seconds;
        if (play) void videoEl.current.play().catch(() => undefined);
      } else {
        command("setCurrentTime", seconds);
        if (play) command("play");
      }
    },
    [command],
  );

  const applyResume = useCallback(() => {
    if (resumeDone.current) return;
    resumeDone.current = true;
    if (resumeAt > 0) {
      seek(resumeAt, autoplay);
      setResumed(true);
      setTimeout(() => setResumed(false), 8000);
    } else if (autoplay) {
      seek(0, true);
    }
  }, [autoplay, resumeAt, seek]);

  useEffect(() => {
    if (!origin) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const message = parsePlayerJsMessage(event.data);
      if (!message) return;
      switch (message.event) {
        case "ready":
          for (const name of ["timeupdate", "play", "pause", "ended"])
            command("addEventListener", name, name);
          applyResume();
          break;
        case "timeupdate": {
          const update = readTimeUpdate(message.value);
          if (update) onTime(update.seconds, update.duration);
          break;
        }
        case "pause":
          onPause();
          break;
        case "ended":
          onEnded();
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [applyResume, command, onEnded, onPause, onTime, origin]);

  // A file URL expired mid-watch (or a network blip): fetch a fresh one once and carry on.
  const onFileError = async () => {
    if (retried.current) {
      setLoad({ state: "error", message: "Playback stopped. Reload the page to continue." });
      return;
    }
    retried.current = true;
    const at = position.current;
    const fresh = await fetchPlayback(video.id);
    setLoad(fresh);
    if (fresh.state === "ready") {
      resumeDone.current = true;
      requestAnimationFrame(() => videoEl.current && (videoEl.current.currentTime = at));
    }
  };

  // ---- Speed, fullscreen, up next ------------------------------------------------
  useEffect(() => {
    if (videoEl.current) videoEl.current.playbackRate = rate;
  }, [rate, playback]);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const canFullscreen = typeof document !== "undefined" && Boolean(document.fullscreenEnabled);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void container.current?.requestFullscreen();
  };

  useEffect(() => {
    if (countdown === null || !next) return;
    if (countdown <= 0) {
      router.push(next.href);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, next, router]);

  const chapterIndex = currentChapterIndex(video.chapters, time);

  return (
    <div className="space-y-3">
      <div
        ref={container}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "relative overflow-hidden rounded-2xl bg-ink",
          fullscreen
            ? "flex h-full w-full items-center justify-center rounded-none"
            : "aspect-video",
        )}
      >
        {load.state === "loading" ? (
          <div
            className="absolute inset-0 flex items-center justify-center text-white"
            role="status"
          >
            <Loader2 className="size-8 animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading video</span>
          </div>
        ) : null}

        {load.state === "error" ? (
          <div
            className="absolute inset-0 flex items-center justify-center p-6 text-center text-white"
            role="alert"
          >
            <p className="max-w-sm font-semibold">{load.message}</p>
          </div>
        ) : null}

        {playback?.kind === "file" ? (
          <video
            key={playback.src}
            ref={videoEl}
            src={playback.src}
            className="h-full w-full"
            controls
            playsInline
            preload="metadata"
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
            aria-label={video.title}
            onLoadedMetadata={(e) => {
              const total = e.currentTarget.duration;
              if (Number.isFinite(total)) setDuration(total);
              e.currentTarget.playbackRate = rate;
              applyResume();
            }}
            onTimeUpdate={(e) =>
              onTime(
                e.currentTarget.currentTime,
                Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : null,
              )
            }
            onPause={onPause}
            onPlay={() => setEnded(false)}
            onEnded={onEnded}
            onError={() => void onFileError()}
          />
        ) : null}

        {playback?.kind === "iframe" ? (
          <iframe
            key={playback.src}
            ref={iframe}
            src={playback.src}
            title={video.title}
            className="h-full w-full border-0"
            // No fullscreen or picture-in-picture: both would escape the watermark.
            allow="accelerometer; gyroscope; autoplay; encrypted-media"
            loading="lazy"
          />
        ) : null}

        {playback ? <Watermark name={watermark.name} email={watermark.email} /> : null}

        {ended && next && countdown !== null ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink/90 p-6 text-center text-white">
            <p className="text-sm font-bold tracking-wide text-white/70 uppercase">
              Up next in {countdown}s
            </p>
            <p className="max-w-md font-display text-xl font-black">{next.title}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="sunflower" onClick={() => router.push(next.href)}>
                <SkipForward aria-hidden="true" />
                Play now
              </Button>
              <Button variant="inverted" onClick={() => seek(0)}>
                <RotateCcw aria-hidden="true" />
                Replay
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setCountdown(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-11 text-sm">
          {resumed ? (
            <span role="status" className="inline-flex items-center gap-2">
              Resumed at {formatTimestamp(resumeAt)}
              <button
                type="button"
                className="font-bold text-link underline underline-offset-4"
                onClick={() => {
                  setResumed(false);
                  seek(0);
                }}
              >
                Start over
              </button>
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {playback?.kind === "file" ? (
            <label className="flex items-center gap-2 text-sm font-bold">
              Speed
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="min-h-11 rounded-full border-2 border-input bg-background px-3 text-sm"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {canFullscreen && playback ? (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            >
              {fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
            </Button>
          ) : null}
        </div>
      </div>

      {video.chapters.length > 0 ? (
        <nav aria-label="Chapters" className="rounded-2xl border-2 bg-card p-2">
          <ol>
            {video.chapters.map((chapter, i) => (
              <li key={`${chapter.start_sec}-${chapter.title}`}>
                <button
                  type="button"
                  onClick={() => seek(chapter.start_sec)}
                  disabled={!playback}
                  aria-current={i === chapterIndex ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60",
                    i === chapterIndex && "bg-accent font-bold",
                  )}
                >
                  <span className="w-14 shrink-0 font-mono text-muted-foreground">
                    {formatTimestamp(chapter.start_sec)}
                  </span>
                  <span className="flex-1">{chapter.title}</span>
                  {i === chapterIndex ? (
                    <Play className="size-4 shrink-0" aria-label="Now playing" />
                  ) : null}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}
