import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleContent } from "@/components/catalog/module-content";
import { ModuleTabsNav } from "@/components/catalog/module-tabs-nav";
import { Badge } from "@/components/ui/badge";
import { getModuleAdmin } from "@/lib/admin/queries";
import { getViewer } from "@/lib/auth";
import { parseModuleTab } from "@/lib/module-tabs";
import { parseQuestionFilters } from "@/lib/questions";
import { isUuid } from "@/lib/validation";
import { adminMetadata } from "@/lib/admin/metadata";

export const generateMetadata = adminMetadata("Preview as student");

/** The student module page with drafts included and access checks skipped (spec §5.6). */
export default async function ModulePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; marks?: string; session?: string; v?: string }>;
}) {
  const { id } = await params;
  const viewer = await getViewer();
  const mod = isUuid(id) ? await getModuleAdmin(id) : null;
  if (!mod) notFound();
  const query = await searchParams;
  const tab = parseModuleTab(query.tab);
  const basePath = `/admin/modules/${mod.id}/preview`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sunflower p-4 text-ink">
        <p className="flex items-center gap-2 font-bold">
          <Eye className="size-5" aria-hidden="true" />
          Preview as student, including drafts
        </p>
        <Link
          href={`/admin/modules/${mod.id}`}
          className="inline-flex min-h-11 items-center gap-1 font-bold underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to editor
        </Link>
      </div>

      <div>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">
            {mod.subjects.name} · Module {mod.number}
          </span>
          {mod.is_free_preview ? <Badge variant="free">Free preview</Badge> : null}
          {!mod.is_published ? <Badge variant="highlight">Draft module</Badge> : null}
        </p>
        <h1 className="mt-2 text-2xl sm:text-4xl">{mod.title}</h1>
      </div>

      <ModuleTabsNav basePath={basePath} active={tab} counts={undefined} />
      <ModuleContent
        moduleId={mod.id}
        subjectId={mod.subject_id}
        tab={tab}
        basePath={basePath}
        filters={parseQuestionFilters(query)}
        drafts
        viewer={
          viewer
            ? {
                userId: viewer.userId,
                name: viewer.profile?.full_name ?? "Admin preview",
                email: viewer.email ?? "",
              }
            : null
        }
        selectedVideoId={query.v}
      />
    </div>
  );
}
