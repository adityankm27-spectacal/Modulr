import { readChapters } from "@modulr/shared";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  PlayCircle,
  Presentation,
  X,
} from "lucide-react";
import { IntentLink as Link } from "@/components/intent-link";
import type { ReactNode } from "react";
import { FormulaCard } from "@/components/content/formula-card";
import { CodeBlock } from "@/components/content/code-block";
import { ContentGuard } from "@/components/content/content-guard";
import { PdfViewer } from "@/components/content/pdf-viewer";
import { QuestionCard } from "@/components/content/question-card";
import { Markdown } from "@/components/markdown/markdown";
import { Badge } from "@/components/ui/badge";
import {
  getCodeProgramVideos,
  getCodePrograms,
  getCrossModuleQuestions,
  getDocument,
  getFormulaCards,
  getNotesPdfUrl,
  getQuestions,
  getPracticalVideos,
  getSlideFileUrl,
  getSlides,
  getVideos,
  getWatchProgress,
  type QuestionRow,
} from "@/lib/catalog";
import { formatDuration, pluralize } from "@/lib/format";
import type { ModuleTabId } from "@/lib/module-tabs";
import {
  filterOptions,
  filterQuestions,
  sortByFrequency,
  type QuestionFilters,
} from "@/lib/questions";
import { QUESTION_SHEET_KIND } from "@/lib/pdf-documents";
import { formatFileSize, SLIDE_FILE_TYPES, slideExtension } from "@/lib/slide-files";
import { cn } from "@/lib/utils";
import { resumePosition } from "@/lib/video/watch";
import { VideoPlayer } from "@/components/video/video-player";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface Props {
  moduleId: string;
  subjectId: string;
  tab: ModuleTabId;
  /** Base URL of this module page (filters append query params to it). */
  basePath: string;
  filters: QuestionFilters;
  /** Admin preview: include unpublished items and mark them as drafts. */
  drafts?: boolean;
  /** Signed-in viewer, for the watermark and watch progress. */
  viewer: { userId: string; name: string; email: string } | null;
  /** `?v=` on the videos tab (and the selected program's video on the Code tab). */
  selectedVideoId?: string;
  /** `?p=` on the Code tab. */
  selectedProgramId?: string;
  /** `?s=` on the Slides tab, when a module has more than one file. */
  selectedSlideId?: string;
  autoplay?: boolean;
}

/** Content of one module tab for a viewer who has access (RLS has already filtered rows). */
export async function ModuleContent(props: Props) {
  // The video and code tabs are excluded: focus moves into the player's iframe when it is
  // clicked. Admin previews are excluded too, so drafts can still be screenshotted.
  if (props.tab === "videos" || props.tab === "code") return <TabContent {...props} />;
  return (
    <ContentGuard enabled={!props.drafts}>
      <TabContent {...props} />
    </ContentGuard>
  );
}

async function TabContent({
  moduleId,
  subjectId,
  tab,
  basePath,
  filters,
  drafts = false,
  viewer,
  selectedVideoId,
  selectedProgramId,
  selectedSlideId,
  autoplay = false,
}: Props) {
  switch (tab) {
    case "code":
      return (
        <CodeTab
          moduleId={moduleId}
          drafts={drafts}
          viewer={viewer}
          basePath={basePath}
          selectedProgramId={selectedProgramId}
          selectedVideoId={selectedVideoId}
          autoplay={autoplay}
        />
      );
    case "videos":
      return (
        <VideosTab
          moduleId={moduleId}
          drafts={drafts}
          viewer={viewer}
          basePath={basePath}
          selectedVideoId={selectedVideoId}
          autoplay={autoplay}
        />
      );
    case "notes":
      return <NotesTab moduleId={moduleId} drafts={drafts} viewer={viewer} />;
    case "slides":
      return (
        <SlidesTab
          moduleId={moduleId}
          drafts={drafts}
          viewer={viewer}
          basePath={basePath}
          selectedSlideId={selectedSlideId}
        />
      );
    case "formulas":
      return <FormulasTab moduleId={moduleId} drafts={drafts} viewer={viewer} />;
    case "pyqs":
      return (
        <QuestionsTab
          moduleId={moduleId}
          subjectId={subjectId}
          kind="pyq"
          drafts={drafts}
          filters={filters}
          basePath={basePath}
          viewer={viewer}
        />
      );
    case "important":
    case "viva":
      return (
        <QuestionsTab
          moduleId={moduleId}
          subjectId={subjectId}
          kind={tab}
          drafts={drafts}
          viewer={viewer}
        />
      );
  }
}

export async function VideosTab({
  moduleId,
  practicalId,
  codeProgramId,
  practicalNumber,
  hrefFor,
  drafts,
  viewer,
  basePath,
  selectedVideoId,
  autoplay,
}: {
  /** A module's videos, or (instead) a practical's or a code program's. */
  moduleId?: string;
  practicalId?: string;
  codeProgramId?: string;
  /** The practical's own number, used to label its videos (2, or 2.1 and 2.2 when there are several). */
  practicalNumber?: number;
  /** Link to a video within the page; modules use ?tab=videos&v=, practicals just ?v=. */
  hrefFor?: (videoId: string) => string;
  drafts: boolean;
  viewer: Props["viewer"];
  basePath: string;
  selectedVideoId?: string;
  autoplay: boolean;
}) {
  const noun = practicalId ? "practical" : codeProgramId ? "program" : "module";
  const videos = practicalId
    ? await getPracticalVideos(practicalId, { drafts })
    : codeProgramId
      ? await getCodeProgramVideos(codeProgramId, { drafts })
      : await getVideos(moduleId ?? "", { drafts });
  if (videos.length === 0) return <ComingSoon>Videos for this {noun} are on their way.</ComingSoon>;

  const progress = viewer
    ? await getWatchProgress(
        viewer.userId,
        videos.map((v) => v.id),
      )
    : new Map();
  const ready = videos.filter((v) => v.processing_status === "ready");
  const selected =
    videos.find((v) => v.id === selectedVideoId) ??
    ready.find((v) => !progress.get(v.id)?.completed) ??
    ready[0] ??
    videos[0];
  if (!selected) return <ComingSoon>Videos for this {noun} are on their way.</ComingSoon>;

  const href = hrefFor ?? ((id: string) => `${basePath}?tab=videos&v=${id}`);
  const after = videos
    .slice(videos.indexOf(selected) + 1)
    .find((v) => v.processing_status === "ready");
  const saved = progress.get(selected.id);
  // A program with one video: its title is already above the player and a one-item list
  // adds nothing, so the code follows the video directly.
  const single = Boolean(codeProgramId) && videos.length === 1;

  return (
    <div className="space-y-6">
      <section aria-label="Now playing" className="space-y-3">
        {selected.processing_status === "ready" && viewer ? (
          <VideoPlayer
            key={selected.id}
            video={{
              id: selected.id,
              title: selected.title,
              durationSec: selected.duration_sec,
              chapters: readChapters(selected.chapters),
            }}
            resumeAt={resumePosition(
              saved?.position_sec ?? null,
              selected.duration_sec,
              saved?.completed ?? false,
            )}
            watermark={{ name: viewer.name, email: viewer.email }}
            next={after ? { href: `${href(after.id)}&autoplay=1`, title: after.title } : null}
            autoplay={autoplay}
            recordProgress={!drafts}
          />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl bg-ink p-6 text-center text-white">
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            <p className="font-semibold">This video is still being prepared. Check back soon.</p>
          </div>
        )}
        {single ? null : (
          <h2 className="font-sans text-lg font-extrabold tracking-normal">{selected.title}</h2>
        )}
      </section>

      {single ? null : (
        <section aria-label={`All videos in this ${noun}`}>
          <ol className="space-y-2">
            {videos.map((video, index) => {
              const p = progress.get(video.id);
              const duration = formatDuration(video.duration_sec);
              const percent =
                p && video.duration_sec
                  ? Math.min(100, Math.round((p.position_sec / video.duration_sec) * 100))
                  : 0;
              const current = video.id === selected.id;
              return (
                <li
                  key={video.id}
                  className="motion-safe:animate-rise"
                  style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
                >
                  <Link
                    href={href(video.id)}
                    scroll={false}
                    // Picking another video replaces the history entry, so Back leaves the module.
                    replace
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border-[3px] bg-card p-3 transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-[0_4px_0_0_var(--line)] active:translate-y-0.5 active:shadow-none",
                      current && "border-line shadow-[0_4px_0_0_var(--color-primary)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl transition-[scale,rotate] duration-300 group-hover:scale-110 group-hover:-rotate-6",
                        current ? "bg-primary text-white" : "bg-muted",
                      )}
                    >
                      {current ? (
                        // Bouncing bars: this is the video in the player above.
                        <span
                          className="flex h-4 items-end gap-0.5"
                          aria-label="Now playing"
                          role="img"
                        >
                          {[0, 1, 2].map((bar) => (
                            <span
                              key={bar}
                              className="h-full w-1 origin-bottom rounded-full bg-white motion-safe:animate-eq"
                              style={{ animationDelay: `${bar * -0.3}s` }}
                            />
                          ))}
                        </span>
                      ) : p?.completed ? (
                        <CheckCircle2 className="size-5 text-success" aria-label="Watched" />
                      ) : (
                        <PlayCircle className="size-5" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug">
                        {practicalNumber === undefined
                          ? index + 1
                          : videos.length === 1
                            ? practicalNumber
                            : `${practicalNumber}.${index + 1}`}
                        . {video.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {duration ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" aria-hidden="true" />
                            {duration}
                          </span>
                        ) : null}
                        {readChapters(video.chapters).length ? (
                          <span>{pluralize(readChapters(video.chapters).length, "chapter")}</span>
                        ) : null}
                        {video.processing_status !== "ready" ? <Badge>Processing</Badge> : null}
                        {drafts && !video.is_published ? (
                          <Badge variant="highlight">Draft</Badge>
                        ) : null}
                      </span>
                      {percent > 0 && !p?.completed ? (
                        <span
                          className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-label={`${percent}% watched`}
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

/** A document's uploaded PDF in the view-only viewer, or null if it has none (or no access). */
async function DocumentPdf({
  doc,
  viewer,
}: {
  doc: { id: string; title: string; pdf_path: string | null } | null;
  viewer: Props["viewer"];
}) {
  const url = doc?.pdf_path ? await getNotesPdfUrl(doc.pdf_path) : null;
  if (!doc || !url) return null;
  return (
    <PdfViewer
      url={url}
      title={doc.title}
      watermark={viewer ? { name: viewer.name, email: viewer.email } : null}
      userId={viewer?.userId ?? null}
      marksKey={`doc:${doc.id}:${doc.pdf_path}`}
    />
  );
}

async function NotesTab({
  moduleId,
  drafts,
  viewer,
}: {
  moduleId: string;
  drafts: boolean;
  viewer: Props["viewer"];
}) {
  const doc = await getDocument(moduleId, "short_notes", { drafts });
  // An uploaded PDF replaces the Markdown notes; the Markdown stays saved but hidden.
  if (!doc || (!doc.pdf_path && !doc.content_md.trim())) {
    return <ComingSoon>Short notes for this module are on their way.</ComingSoon>;
  }
  return (
    <article>
      <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        Updated {dateFormat.format(new Date(doc.updated_at))}
        {drafts && !doc.is_published ? <Badge variant="highlight">Draft</Badge> : null}
      </p>
      {doc.pdf_path ? (
        <DocumentPdf doc={doc} viewer={viewer} />
      ) : (
        <Markdown>{doc.content_md}</Markdown>
      )}
    </article>
  );
}

/**
 * Uploaded slide files. With several (e.g. 1.1 and 1.2), a picker at the top switches
 * between them and only the chosen one is shown; `?s=` selects it.
 */
async function SlidesTab({
  moduleId,
  drafts,
  viewer,
  basePath,
  selectedSlideId,
}: {
  moduleId: string;
  drafts: boolean;
  viewer: Props["viewer"];
  basePath: string;
  selectedSlideId?: string;
}) {
  const all = await getSlides(moduleId, { drafts });
  const chosen = all.find((s) => s.id === selectedSlideId) ?? all[0];
  if (!chosen) return <ComingSoon>Slides for this module are on their way.</ComingSoon>;
  const slides = [chosen];
  // PDFs open in the view-only viewer (signed now, like notes); PowerPoint and Word files
  // are downloaded through /api/slides/:id, which signs a URL only when clicked.
  const pdfUrls = await Promise.all(
    slides.map((slide) =>
      slide.file_path && slideExtension(slide.file_path) === "pdf"
        ? getSlideFileUrl(slide.file_path)
        : Promise.resolve(null),
    ),
  );
  return (
    <div className="space-y-6">
      {all.length > 1 ? (
        <nav aria-label="Slides in this module">
          <ol className="grid gap-2 sm:grid-cols-2">
            {all.map((slide, index) => {
              const current = slide.id === chosen.id;
              const ext = slideExtension(slide.file_path ?? "");
              return (
                <li key={slide.id}>
                  <Link
                    href={`${basePath}?tab=slides&s=${slide.id}`}
                    scroll={false}
                    replace
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "group flex h-full items-center gap-3 rounded-2xl border-[3px] bg-card p-3 transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-[0_4px_0_0_var(--line)] active:translate-y-0.5 active:shadow-none",
                      current && "border-line shadow-[0_4px_0_0_var(--color-primary)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold transition-[scale,rotate] duration-300 group-hover:scale-110 group-hover:-rotate-6",
                        current ? "bg-primary text-white" : "bg-muted",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug break-words">
                        {slide.title}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {ext ? SLIDE_FILE_TYPES[ext].label : null}
                        {drafts && !slide.is_published ? (
                          <Badge variant="highlight">Draft</Badge>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
      {slides.map((slide, index) => {
        const ext = slideExtension(slide.file_path ?? "");
        const pdfUrl = pdfUrls[index];
        const draft =
          drafts && !slide.is_published ? <Badge variant="highlight">Draft</Badge> : null;
        if (ext === "pdf") {
          return pdfUrl ? (
            <section key={slide.id} aria-label={slide.title} className="space-y-3">
              <h2 className="flex flex-wrap items-center gap-2 font-sans text-lg font-extrabold tracking-normal">
                {slide.title}
                {draft}
              </h2>
              <PdfViewer
                url={pdfUrl}
                title={slide.title}
                watermark={viewer ? { name: viewer.name, email: viewer.email } : null}
                userId={viewer?.userId ?? null}
                marksKey={`slide:${slide.id}:${slide.file_path}`}
              />
            </section>
          ) : null;
        }
        const Icon = ext === "doc" || ext === "docx" ? FileText : Presentation;
        const meta = [ext ? SLIDE_FILE_TYPES[ext].label : null, formatFileSize(slide.file_size)]
          .filter(Boolean)
          .join(" · ");
        return (
          <section
            key={slide.id}
            aria-label={slide.title}
            className="flex flex-wrap items-center gap-4 rounded-2xl border-[3px] border-line bg-card p-4 shadow-[0_4px_0_0_var(--line)]"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="flex flex-wrap items-center gap-2 font-sans text-base font-extrabold tracking-normal break-words">
                {slide.title}
                {draft}
              </h2>
              {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
            </div>
            {/* A plain link: it is an API route that redirects to the file, never prefetched. */}
            <a
              href={`/api/slides/${slide.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-[3px] border-line bg-cobalt px-4 text-sm font-bold text-white shadow-[0_4px_0_0_var(--line)] transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Download className="size-4" aria-hidden="true" />
              Download
            </a>
          </section>
        );
      })}
    </div>
  );
}

async function FormulasTab({
  moduleId,
  drafts,
  viewer,
}: {
  moduleId: string;
  drafts: boolean;
  viewer: Props["viewer"];
}) {
  const [cards, sheet] = await Promise.all([
    getFormulaCards(moduleId, { drafts }),
    getDocument(moduleId, "formula_sheet", { drafts }),
  ]);
  // A formula-sheet PDF replaces the sheet's Markdown (kept but hidden), above the cards.
  const hasPdf = Boolean(sheet?.pdf_path);
  const hasSheet = !hasPdf && Boolean(sheet?.content_md.trim());
  if (cards.length === 0 && !hasSheet && !hasPdf)
    return <ComingSoon>Formulas for this module are on their way.</ComingSoon>;

  return (
    <div className="space-y-8">
      {hasPdf ? <DocumentPdf doc={sheet} viewer={viewer} /> : null}
      {cards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <FormulaCard key={card.id} card={card} showDraftBadge={drafts} />
          ))}
        </div>
      ) : null}
      {sheet && hasSheet ? (
        <section aria-label="Formula sheet notes" className="rounded-2xl bg-muted/60 p-4 sm:p-6">
          {drafts && !sheet.is_published ? (
            <Badge variant="highlight" className="mb-4">
              Draft
            </Badge>
          ) : null}
          <Markdown>{sheet.content_md}</Markdown>
        </section>
      ) : null}
    </div>
  );
}

async function QuestionsTab({
  moduleId,
  subjectId,
  kind,
  drafts,
  filters,
  basePath,
  viewer,
}: {
  moduleId: string;
  subjectId: string;
  kind: "pyq" | "important" | "viva";
  drafts: boolean;
  filters?: QuestionFilters;
  basePath?: string;
  viewer: Props["viewer"];
}) {
  const [own, shared, sheet] = await Promise.all([
    getQuestions(moduleId, kind, { drafts }),
    getCrossModuleQuestions(subjectId, kind, { drafts }),
    getDocument(moduleId, QUESTION_SHEET_KIND[kind], { drafts }),
  ]);
  const hasPdf = Boolean(sheet?.pdf_path);
  if (own.length === 0 && shared.length === 0) {
    return hasPdf ? (
      <DocumentPdf doc={sheet} viewer={viewer} />
    ) : (
      <ComingSoon>{QUESTION_LABEL[kind]} for this module are on their way.</ComingSoon>
    );
  }

  const order = (list: QuestionRow[]) => (kind === "important" ? sortByFrequency(list) : list);
  const active = filters ?? { marks: null, session: null };
  const groups = [
    { key: "module", title: null, all: order(own) },
    { key: "shared", title: "Spans several modules", all: order(shared) },
  ].map((g) => ({ ...g, shown: filterQuestions(g.all, active) }));
  const total = own.length + shared.length;
  const shownCount = groups.reduce((n, g) => n + g.shown.length, 0);
  const options = filterOptions([...own, ...shared]);
  const filtering = active.marks !== null || active.session !== null;

  return (
    <div className="space-y-5">
      {hasPdf ? <DocumentPdf doc={sheet} viewer={viewer} /> : null}
      {kind === "pyq" && basePath && (options.marks.length > 1 || options.sessions.length > 1) ? (
        <QuestionFilterBar basePath={basePath} options={options} active={active} />
      ) : null}

      {filtering ? (
        <p className="text-sm text-muted-foreground" role="status">
          Showing {shownCount} of {pluralize(total, "question")}
        </p>
      ) : null}

      {shownCount === 0 ? <Empty>No questions match these filters.</Empty> : null}

      {groups.map((group) =>
        group.shown.length === 0 ? null : (
          <section key={group.key} aria-label={group.title ?? "This module"} className="space-y-3">
            {group.title ? (
              <h2 className="pt-2 font-sans text-base font-extrabold tracking-normal text-muted-foreground">
                {group.title}
              </h2>
            ) : null}
            <ol className="space-y-3">
              {group.shown.map((question) => (
                <li key={question.id}>
                  <QuestionCard
                    question={question}
                    number={group.all.indexOf(question) + 1}
                    showDraftBadge={drafts}
                  />
                </li>
              ))}
            </ol>
          </section>
        ),
      )}
    </div>
  );
}

function QuestionFilterBar({
  basePath,
  options,
  active,
}: {
  basePath: string;
  options: { marks: number[]; sessions: string[] };
  active: QuestionFilters;
}) {
  const href = (next: Partial<QuestionFilters>) => {
    const merged = { ...active, ...next };
    const params = new URLSearchParams({ tab: "pyqs" });
    if (merged.marks !== null) params.set("marks", String(merged.marks));
    if (merged.session !== null) params.set("session", merged.session);
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
      {options.marks.length > 1 ? (
        <FilterRow label="Marks">
          <Chip href={href({ marks: null })} active={active.marks === null}>
            All
          </Chip>
          {options.marks.map((m) => (
            <Chip key={m} href={href({ marks: m })} active={active.marks === m}>
              {m} marks
            </Chip>
          ))}
        </FilterRow>
      ) : null}
      {options.sessions.length > 1 ? (
        <FilterRow label="Exam">
          <Chip href={href({ session: null })} active={active.session === null}>
            All
          </Chip>
          {options.sessions.map((s) => (
            <Chip key={s} href={href({ session: s })} active={active.session === s}>
              {s}
            </Chip>
          ))}
        </FilterRow>
      ) : null}
      {active.marks !== null || active.session !== null ? (
        <Link
          href={href({ marks: null, session: null })}
          scroll={false}
          replace
          className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-link"
        >
          <X className="size-4" aria-hidden="true" />
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={`Filter by ${label.toLowerCase()}`}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="w-14 text-sm font-bold text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      replace
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border-2 px-3.5 text-sm font-bold transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background hover:border-input",
      )}
    >
      {children}
    </Link>
  );
}

/** File name shown above a program: its public class, else the title in PascalCase. */
function javaFileName(code: string, title: string) {
  const declared =
    /\bpublic\s+(?:final\s+|abstract\s+)*(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/.exec(
      code,
    )?.[1];
  const fromTitle = title
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return `${declared ?? (fromTitle || "Main")}.java`;
}

/**
 * Worked programs: pick one from the list to see its explanation video and its code.
 * `?p=` selects the program; its videos use `?v=` like the Videos tab.
 */
async function CodeTab({
  moduleId,
  drafts,
  viewer,
  basePath,
  selectedProgramId,
  selectedVideoId,
  autoplay,
}: {
  moduleId: string;
  drafts: boolean;
  viewer: Props["viewer"];
  basePath: string;
  selectedProgramId?: string;
  selectedVideoId?: string;
  autoplay: boolean;
}) {
  const [programs, sheet] = await Promise.all([
    getCodePrograms(moduleId, { drafts }),
    getDocument(moduleId, "code_sheet", { drafts }),
  ]);
  const pdf = sheet?.pdf_path ? <DocumentPdf doc={sheet} viewer={viewer} /> : null;
  const selected = programs.find((p) => p.id === selectedProgramId) ?? programs[0];
  if (!selected) return pdf ?? <ComingSoon>Code for this module is on its way.</ComingSoon>;
  const programHref = (id: string) => `${basePath}?tab=code&p=${id}`;
  const hasCode = Boolean(selected.code.trim());
  const hasVideos = (await getCodeProgramVideos(selected.id, { drafts })).length > 0;

  return (
    <div className="space-y-6">
      {/* Only worth showing when there's another program to switch to. */}
      {programs.length > 1 ? (
        <nav aria-label="Programs in this module">
          <ol className="grid gap-2 sm:grid-cols-2">
            {programs.map((program, index) => {
              const current = program.id === selected.id;
              return (
                <li key={program.id}>
                  <Link
                    href={programHref(program.id)}
                    scroll={false}
                    replace
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "group flex h-full items-center gap-3 rounded-2xl border-[3px] bg-card p-3 transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-[0_4px_0_0_var(--line)] active:translate-y-0.5 active:shadow-none",
                      current && "border-line shadow-[0_4px_0_0_var(--color-primary)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold transition-[scale,rotate] duration-300 group-hover:scale-110 group-hover:-rotate-6",
                        current ? "bg-primary text-white" : "bg-muted",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug">{program.title}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="min-w-0 font-mono [overflow-wrap:anywhere]">
                          {javaFileName(program.code, program.title)}
                        </span>
                        {drafts && !program.is_published ? (
                          <Badge variant="highlight">Draft</Badge>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {/* Video first, then the module's Code PDF, then the program's own code. */}
      <section aria-label={selected.title} className="space-y-6">
        <h2 className="text-2xl break-words">{selected.title}</h2>
        {hasVideos ? (
          <VideosTab
            codeProgramId={selected.id}
            hrefFor={(videoId) => `${programHref(selected.id)}&v=${videoId}`}
            drafts={drafts}
            viewer={viewer}
            basePath={basePath}
            selectedVideoId={selectedVideoId}
            autoplay={autoplay}
          />
        ) : null}
        {pdf}
        {hasCode ? (
          <CodeBlock
            code={selected.code}
            fileName={javaFileName(selected.code, selected.title)}
            language={selected.language}
          />
        ) : hasVideos || pdf ? null : (
          // Only when the program has nothing to show at all.
          <ComingSoon>The video for this program is on its way.</ComingSoon>
        )}
      </section>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-muted p-6 text-muted-foreground">{children}</p>;
}

const QUESTION_LABEL = { pyq: "PYQs", important: "Important questions", viva: "Viva questions" };

/** A tab with nothing published yet: says it's coming rather than that it's missing. */
function ComingSoon({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-muted p-6">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 -rotate-6 items-center justify-center rounded-xl border-[3px] border-line bg-sunflower text-ink shadow-[0_4px_0_0_var(--line)]"
      >
        <Clock className="size-6" />
      </span>
      <div>
        <p className="font-display text-xl font-black">Coming soon</p>
        <p className="mt-0.5 text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
