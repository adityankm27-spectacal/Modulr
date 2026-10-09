import { formatChapters, formatTimestamp, readChapters } from "@modulr/shared";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/action-form";

export interface VideoDefaults {
  title: string;
  duration_sec: number | null;
  chapters: unknown;
  is_published: boolean;
}

/** Video details. The file itself is uploaded separately (VideoUpload). */
export function VideoFields({ defaults }: { defaults?: VideoDefaults }) {
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
      <TextAreaField
        name="chapters"
        label="Chapters"
        hint="One per line: start time, then title, e.g.  1:35 Main idea"
        mono
        rows={4}
        defaultValue={formatChapters(readChapters(defaults?.chapters))}
      />
      <CheckboxField
        name="is_published"
        label="Published"
        defaultChecked={defaults?.is_published ?? false}
      />
    </>
  );
}
