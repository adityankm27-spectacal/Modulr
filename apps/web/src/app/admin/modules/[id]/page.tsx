import { readSymbols } from "@modulr/shared";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, CheckboxField, TextField } from "@/components/admin/action-form";
import { AdminSection, Breadcrumbs, Disclosure, EmptyState } from "@/components/admin/admin-ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { FormulaCardFields } from "@/components/admin/formula-card-fields";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { PdfSlot } from "@/components/admin/pdf-slot";
import { SortableList } from "@/components/admin/sortable-list";
import { VideoFields } from "@/components/admin/video-fields";
import { VideoUpload } from "@/components/admin/video-upload";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  deleteContent,
  deleteModule,
  saveDocument,
  saveFormulaCard,
  saveModule,
  refreshVideoStatus,
  saveVideo,
} from "@/lib/admin/actions";
import { getModuleAdmin, getModuleContentAdmin } from "@/lib/admin/queries";
import { formatDuration, plainPreview, pluralize } from "@/lib/format";
import { QUESTION_SHEET_KIND } from "@/lib/pdf-documents";
import { cn } from "@/lib/utils";
import { configuredProviderName } from "@/lib/video";
import { isUuid } from "@/lib/validation";
import { adminMetadata } from "@/lib/admin/metadata";

export const generateMetadata = adminMetadata("Module editor");

const TABS = [
  { id: "notes", label: "Short notes" },
  { id: "formulas", label: "Formulas" },
  { id: "questions", label: "Questions" },
  { id: "videos", label: "Videos" },
  { id: "details", label: "Details" },
] as const;
type Tab = (typeof TABS)[number]["id"];

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

const KINDS = [
  { kind: "pyq", label: "PYQs" },
  { kind: "important", label: "Important questions" },
  { kind: "viva", label: "Viva" },
] as const;

export default async function ModuleEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const mod = isUuid(id) ? await getModuleAdmin(id) : null;
  if (!mod) notFound();
  const requested = (await searchParams).tab;
  const tab: Tab = TABS.find((t) => t.id === requested)?.id ?? "notes";
  const content = await getModuleContentAdmin(mod.id);
  const notes = content.documents.find((d) => d.kind === "short_notes");
  const sheet = content.documents.find((d) => d.kind === "formula_sheet");
  const subject = mod.subjects;

  return (
    <>
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { href: "/admin/catalog", label: "Catalog" },
            {
              href: `/admin/syllabus/${subject.syllabus_versions.id}`,
              label: subject.syllabus_versions.label,
            },
            { href: `/admin/subjects/${subject.id}`, label: subject.name },
            { label: `Module ${mod.number}` },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl">
            {mod.number}. {mod.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <FlagToggle
              table="modules"
              id={mod.id}
              field="is_free_preview"
              value={mod.is_free_preview}
              label={`Module ${mod.number}`}
            />
            <FlagToggle
              table="modules"
              id={mod.id}
              value={mod.is_published}
              label={`Module ${mod.number}`}
            />
            <Link
              href={`/admin/modules/${mod.id}/preview${tab === "details" ? "" : `?tab=${tab === "questions" ? "pyqs" : tab}`}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Eye aria-hidden="true" />
              Preview as student
            </Link>
          </div>
        </div>
        <nav aria-label="Module editor sections" className="-mx-4 overflow-x-auto px-4">
          <ul className="flex min-w-max gap-2 border-b pb-3">
            {TABS.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/modules/${mod.id}?tab=${t.id}`}
                  aria-current={t.id === tab ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold",
                    t.id === tab
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {tab === "notes" ? (
        <AdminSection
          title="Short notes"
          description="One page per module. Use callouts generously: memory tricks are a core feature."
        >
          <PdfSlot
            moduleId={mod.id}
            moduleTitle={mod.title}
            kind="short_notes"
            doc={notes}
            hint="Upload a PDF to show your designed notes exactly as they are. It replaces the text notes below while attached."
          />
          <ActionForm action={saveDocument} submitLabel="Save notes">
            {notes ? <input type="hidden" name="id" value={notes.id} /> : null}
            {notes ? <input type="hidden" name="version" value={notes.version} /> : null}
            <input type="hidden" name="module_id" value={mod.id} />
            <input type="hidden" name="kind" value="short_notes" />
            <TextField
              name="title"
              label="Title"
              defaultValue={notes?.title ?? `Short notes: ${mod.title}`}
            />
            <MarkdownEditor
              name="content_md"
              label="Notes"
              defaultValue={notes?.content_md ?? ""}
              rows={24}
            />
            <CheckboxField
              name="is_published"
              label="Published"
              defaultChecked={notes?.is_published ?? false}
            />
          </ActionForm>
        </AdminSection>
      ) : null}

      {tab === "formulas" ? (
        <>
          <AdminSection
            title="Formula cards"
            description="Each card: the formula, what every symbol means, and when to use it."
          >
            {content.cards.length === 0 ? (
              <EmptyState>No formula cards yet.</EmptyState>
            ) : (
              <SortableList
                table="formula_cards"
                items={content.cards.map((card) => ({
                  id: card.id,
                  label: card.title,
                  content: (
                    <div className="space-y-2 pr-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold">{card.title}</span>
                        <FlagToggle
                          table="formula_cards"
                          id={card.id}
                          value={card.is_published}
                          label={card.title}
                        />
                      </div>
                      <code className="block truncate font-mono text-xs text-muted-foreground">
                        {card.formula_latex}
                      </code>
                      <div className="flex flex-wrap items-start gap-1">
                        <Disclosure summary="Edit">
                          <ActionForm action={saveFormulaCard}>
                            <input type="hidden" name="id" value={card.id} />
                            <input type="hidden" name="module_id" value={mod.id} />
                            <FormulaCardFields
                              defaults={{
                                title: card.title,
                                formula_latex: card.formula_latex,
                                symbols: readSymbols(card.symbols),
                                when_to_use: card.when_to_use,
                                is_published: card.is_published,
                              }}
                            />
                          </ActionForm>
                        </Disclosure>
                        <DeleteButton
                          action={deleteContent}
                          fields={{ table: "formula_cards", id: card.id }}
                          what={`“${card.title}”`}
                        />
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
            <Disclosure
              defaultOpen={content.cards.length === 0}
              summary={
                <>
                  <Plus className="size-4" aria-hidden="true" /> Add formula card
                </>
              }
            >
              <ActionForm action={saveFormulaCard} submitLabel="Add card" resetOnSuccess>
                <input type="hidden" name="module_id" value={mod.id} />
                <FormulaCardFields />
              </ActionForm>
            </Disclosure>
          </AdminSection>

          <AdminSection
            title="Formula sheet"
            description="Upload a formula-sheet PDF (shown above the cards), or write free-form notes shown under the cards."
          >
            <PdfSlot
              moduleId={mod.id}
              moduleTitle={mod.title}
              kind="formula_sheet"
              doc={sheet}
              hint="Upload your formula sheet as a PDF. It replaces the text formula sheet below while attached."
            />
            <ActionForm action={saveDocument} submitLabel="Save formula sheet">
              {sheet ? <input type="hidden" name="id" value={sheet.id} /> : null}
              {sheet ? <input type="hidden" name="version" value={sheet.version} /> : null}
              <input type="hidden" name="module_id" value={mod.id} />
              <input type="hidden" name="kind" value="formula_sheet" />
              <TextField
                name="title"
                label="Title"
                defaultValue={sheet?.title ?? `Formula sheet: ${mod.title}`}
              />
              <MarkdownEditor
                name="content_md"
                label="Formula sheet"
                defaultValue={sheet?.content_md ?? ""}
                rows={12}
              />
              <CheckboxField
                name="is_published"
                label="Published"
                defaultChecked={sheet?.is_published ?? false}
              />
            </ActionForm>
          </AdminSection>
        </>
      ) : null}

      {tab === "questions"
        ? KINDS.map(({ kind, label }) => {
            const list = content.questions.filter((q) => q.kind === kind);
            return (
              <AdminSection
                key={kind}
                title={label}
                description={pluralize(list.length, "question")}
                actions={
                  <Link
                    href={`/admin/questions/new?subject=${subject.id}&module=${mod.id}&kind=${kind}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Plus aria-hidden="true" />
                    New
                  </Link>
                }
              >
                <PdfSlot
                  moduleId={mod.id}
                  moduleTitle={mod.title}
                  kind={QUESTION_SHEET_KIND[kind]}
                  doc={content.documents.find((d) => d.kind === QUESTION_SHEET_KIND[kind])}
                  hint={`Upload a ${label} PDF, e.g. a solved paper or question bank. Students see it above the questions below.`}
                  showPublish
                />
                {list.length === 0 ? (
                  <EmptyState>None yet. Add one, or import a CSV from the subject page.</EmptyState>
                ) : (
                  <SortableList
                    table="questions"
                    items={list.map((q, i) => ({
                      id: q.id,
                      label: `question ${i + 1}`,
                      content: (
                        <div className="flex flex-wrap items-center justify-between gap-2 pr-2">
                          <Link
                            href={`/admin/questions/${q.id}`}
                            className="min-w-0 flex-1 text-link"
                          >
                            {plainPreview(q.question_md, 120)}
                          </Link>
                          <span className="flex flex-wrap items-center gap-2">
                            {q.marks ? <Badge variant="primary">{q.marks}m</Badge> : null}
                            {q.sessions.length ? <Badge>{q.sessions.length} sessions</Badge> : null}
                            <FlagToggle
                              table="questions"
                              id={q.id}
                              value={q.is_published}
                              label={`question ${i + 1}`}
                            />
                          </span>
                        </div>
                      ),
                    }))}
                  />
                )}
              </AdminSection>
            );
          })
        : null}

      {tab === "videos" ? (
        <AdminSection
          title="Videos"
          description={`Uploads go straight to ${PROVIDER_LABEL[configuredProviderName()]}. Students can only watch videos that are ready and published.`}
        >
          {content.videos.length === 0 ? (
            <EmptyState>No videos yet. Add one, then upload its file.</EmptyState>
          ) : (
            <SortableList
              table="videos"
              items={content.videos.map((v) => ({
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
                        <FlagToggle
                          table="videos"
                          id={v.id}
                          value={v.is_published}
                          label={v.title}
                        />
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
                          <input type="hidden" name="module_id" value={mod.id} />
                          <VideoFields defaults={v} />
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
            defaultOpen={content.videos.length === 0}
            summary={
              <>
                <Plus className="size-4" aria-hidden="true" /> Add video
              </>
            }
          >
            <ActionForm action={saveVideo} submitLabel="Add video" resetOnSuccess>
              <input type="hidden" name="module_id" value={mod.id} />
              <VideoFields />
            </ActionForm>
          </Disclosure>
        </AdminSection>
      ) : null}

      {tab === "details" ? (
        <AdminSection title="Module details">
          <ActionForm action={saveModule} className="max-w-2xl">
            <input type="hidden" name="id" value={mod.id} />
            <input type="hidden" name="subject_id" value={mod.subject_id} />
            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <TextField
                name="number"
                label="Number"
                type="number"
                min={1}
                max={99}
                defaultValue={mod.number}
              />
              <TextField name="title" label="Title" defaultValue={mod.title} />
            </div>
            <CheckboxField
              name="is_free_preview"
              label="Free preview for signed-in students"
              defaultChecked={mod.is_free_preview}
            />
            <CheckboxField
              name="is_published"
              label="Published"
              defaultChecked={mod.is_published}
            />
          </ActionForm>
          <div className="border-t pt-4">
            <p className="mb-2 text-sm text-muted-foreground">
              A module can only be deleted once its videos, notes, formulas and questions are
              removed.
            </p>
            <DeleteButton
              action={deleteModule}
              fields={{ id: mod.id }}
              what={`Module ${mod.number}`}
            />
          </div>
        </AdminSection>
      ) : null}
    </>
  );
}
