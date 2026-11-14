"use client";

import { formatTimestamp, parseChapters } from "@modulr/shared";
import { ListPlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TextAreaField } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video/video-player";
import { insertChapterLine } from "@/lib/video/chapters";

/**
 * Chapters with a live preview. Play the video, press "Add chapter" at each new topic,
 * then type its title. Students see the same list under the player and click a line to
 * jump there. The text is still saved with the rest of the video's details.
 */
export function ChapterEditor({
  videoId,
  title,
  durationSec,
  defaultValue,
}: {
  videoId: string;
  title: string;
  durationSec: number | null;
  defaultValue: string;
}) {
  const [text, setText] = useState(defaultValue);
  const [time, setTime] = useState(0);
  const [selectLine, setSelectLine] = useState<number | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  // What students would see right now, so mistakes show up before saving.
  const chapters = useMemo(() => parseChapters(text).items, [text]);

  function addChapter() {
    const result = insertChapterLine(text, time);
    setText(result.text);
    setSelectLine(result.line);
  }

  // After adding, put the cursor on the new line's title so it can be typed over at once.
  useEffect(() => {
    if (selectLine === null) return;
    const el = area.current;
    if (!el) return;
    const lines = el.value.split("\n");
    const line = lines[selectLine] ?? "";
    const start = lines.slice(0, selectLine).reduce((n, l) => n + l.length + 1, 0);
    const titleStart = start + line.indexOf(" ") + 1;
    el.focus();
    el.setSelectionRange(titleStart, start + line.length);
    setSelectLine(null);
  }, [selectLine]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">Preview and chapters</p>
      <div className="max-w-2xl">
        <VideoPlayer
          video={{ id: videoId, title, durationSec, chapters }}
          resumeAt={0}
          watermark={{ name: "Admin preview", email: "" }}
          next={null}
          recordProgress={false}
          onTimeChange={setTime}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="sunflower" size="sm" onClick={addChapter}>
          <ListPlus aria-hidden="true" />
          Add chapter at {formatTimestamp(time)}
        </Button>
        <span className="text-sm text-muted-foreground">
          Play to the start of a topic, press the button, then type its title.
        </span>
      </div>
      <TextAreaField
        ref={area}
        name="chapters"
        label="Chapters"
        hint="One per line: start time, then title, e.g.  1:35 Main idea. Save to publish them."
        mono
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
