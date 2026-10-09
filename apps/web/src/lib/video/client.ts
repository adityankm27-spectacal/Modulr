/**
 * Reads a video file's duration in the browser. Some recorders (e.g. MediaRecorder
 * WebM) report Infinity until the end is sought, so seek far ahead to force it.
 */
export function readVideoDuration(file: File, timeoutMs = 15_000): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let settled = false;
    const done = (value: number | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(value !== null && Number.isFinite(value) && value > 0 ? Math.round(value) : null);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration)) {
        clearTimeout(timer);
        done(video.duration);
      } else {
        video.ondurationchange = () => {
          if (Number.isFinite(video.duration)) {
            clearTimeout(timer);
            done(video.duration);
          }
        };
        video.currentTime = 1e7;
      }
    };
    video.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    video.src = url;
  });
}
