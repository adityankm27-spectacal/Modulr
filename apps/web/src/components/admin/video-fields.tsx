import { formatChapters, formatTimestamp, readChapters } from "@modulr/shared";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/action-form";
import { ChapterEditor } from "@/components/admin/chapter-editor";

export interface VideoDefaults {
  id?: string;
  title: string;
  duration_sec: number | null;
  chapters: unknown;
  is_published: boolean;
}

/** Video details. The file itself is uploaded separately (VideoUpload). */
export function VideoFields({
  defaults,
  previewable = false,
}: {
  defaults?: VideoDefaults;
  /** The file is uploaded and ready, so chapters can be set while watching it. */
  previewable?: boolean;
}) {
  const chaptersText = formatChapters(readChapters(defaults?.chapters));
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <TextField name="title" label="Title" defaultValue={defaults?.title} />
        <TextField
          name="duration"
          label="Duration"
          placeholder="8:30"
          hint="Filled in from the upload."
          defaultValue={
            defaults?.duration_sec != null ? formatTimestamp(defaults.duration_sec) : ""
          }
        />
      </div>
      {previewable && defaults?.id ? (
        <ChapterEditor
          videoId={defaults.id}
          title={defaults.title}
          durationSec={defaults.duration_sec}
          defaultValue={chaptersText}
        />
      ) : (
        <TextAreaField
          name="chapters"
          label="Chapters"
          hint="One per line: start time, then title, e.g.  1:35 Main idea. Upload the video first to set them while watching it."
          mono
          rows={4}
          defaultValue={chaptersText}
        />
      )}
      <CheckboxField
        name="is_published"
        label="Published"
        defaultChecked={defaults?.is_published ?? false}
      />
    </>
  );
}
