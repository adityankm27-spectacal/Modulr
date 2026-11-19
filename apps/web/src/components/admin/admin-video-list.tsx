import { Plus } from "lucide-react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminSection, Disclosure, EmptyState } from "@/components/admin/admin-ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { SortableList } from "@/components/admin/sortable-list";
import { VideoFields, type VideoDefaults } from "@/components/admin/video-fields";
import { VideoUpload } from "@/components/admin/video-upload";
import { Badge } from "@/components/ui/badge";
import { deleteContent, refreshVideoStatus, saveVideo } from "@/lib/admin/actions";
import { formatDuration } from "@/lib/format";
import { configuredProviderName } from "@/lib/video";

const PROVIDER_LABEL = {
  bunny: "Bunny Stream",
  vdocipher: "VdoCipher",
  dev: "the local dev store",
} as const;

const STATUS_LABEL = {
  pending: "No file yet",
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
} as const;

export interface AdminVideo extends VideoDefaults {
  id: string;
  provider: keyof typeof PROVIDER_LABEL;
  provider_video_id: string | null;
  processing_status: keyof typeof STATUS_LABEL;
}

/**
 * The admin's video list with upload, chapters, publish and delete, for a module or a
 * practical. `parent` says which one new videos are added to.
 */
export function AdminVideoList({
  videos,
  parent,
}: {
  videos: AdminVideo[];
  parent: { field: "module_id" | "practical_id"; id: string };
}) {
  return (
    <AdminSection
      title="Videos"
      description={`Uploads go straight to ${PROVIDER_LABEL[configuredProviderName()]}. Students can only watch videos that are ready and published.`}
    >
      {videos.length === 0 ? (
        <EmptyState>No videos yet. Add one, then upload its file.</EmptyState>
      ) : (
        <SortableList
          table="videos"
          items={videos.map((v) => ({
            id: v.id,
            label: v.title,
            content: (
              <div className="space-y-3 pr-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{v.title}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        v.processing_status === "ready"
                          ? "free"
                          : v.processing_status === "failed"
                            ? "locked"
                            : "highlight"
                      }
                    >
                      {STATUS_LABEL[v.processing_status]}
                    </Badge>
                    {v.duration_sec ? <Badge>{formatDuration(v.duration_sec)}</Badge> : null}
                    <FlagToggle table="videos" id={v.id} value={v.is_published} label={v.title} />
                  </span>
                </div>
                <div className="flex flex-wrap items-start gap-3">
                  <VideoUpload
                    videoId={v.id}
                    hasFile={Boolean(v.provider_video_id)}
                    label={v.title}
                  />
                  {v.provider_video_id && v.processing_status !== "ready" ? (
                    <ActionForm
                      action={refreshVideoStatus}
                      submitLabel="Refresh status"
                      submitVariant="ghost"
                      className="space-y-0"
                    >
                      <input type="hidden" name="id" value={v.id} />
                    </ActionForm>
                  ) : null}
                </div>
                {v.provider_video_id ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {PROVIDER_LABEL[v.provider]} · {v.provider_video_id}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-start gap-1">
                  <Disclosure summary="Edit details and chapters">
                    <ActionForm action={saveVideo}>
                      <input type="hidden" name="id" value={v.id} />
                      <input type="hidden" name={parent.field} value={parent.id} />
                      <VideoFields
                        defaults={v}
                        previewable={
                          v.processing_status === "ready" && Boolean(v.provider_video_id)
                        }
                      />
                    </ActionForm>
                  </Disclosure>
                  <DeleteButton
                    action={deleteContent}
                    fields={{ table: "videos", id: v.id }}
                    what={`“${v.title}” (also removes the file from the provider)`}
                  />
                </div>
              </div>
            ),
          }))}
        />
      )}
      <Disclosure
        defaultOpen={videos.length === 0}
        summary={
          <>
            <Plus className="size-4" aria-hidden="true" /> Add video
          </>
        }
      >
        <ActionForm action={saveVideo} submitLabel="Add video" resetOnSuccess>
          <input type="hidden" name={parent.field} value={parent.id} />
          <VideoFields />
        </ActionForm>
      </Disclosure>
    </AdminSection>
  );
}
