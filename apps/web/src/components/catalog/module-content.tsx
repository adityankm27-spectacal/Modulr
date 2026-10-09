import { readChapters } from "@modulr/shared";
import { CheckCircle2, Clock, Loader2, PlayCircle, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { FormulaCard } from "@/components/content/formula-card";
import { QuestionCard } from "@/components/content/question-card";
import { Markdown } from "@/components/markdown/markdown";
import { Badge } from "@/components/ui/badge";
import {
  getCrossModuleQuestions,
  getDocument,
  getFormulaCards,
  getQuestions,
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
  /** `?v=` on the videos tab. */
  selectedVideoId?: string;
  autoplay?: boolean;
}

/** Content of one module tab for a viewer who has access (RLS has already filtered rows). */
export async function ModuleContent({
  moduleId,
  subjectId,
  tab,
  basePath,
  filters,
  drafts = false,
  viewer,
  selectedVideoId,
  autoplay = false,
}: Props) {
  switch (tab) {
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
      return <NotesTab moduleId={moduleId} drafts={drafts} />;
    case "formulas":
      return <FormulasTab moduleId={moduleId} drafts={drafts} />;
    case "pyqs":
      return (
        <QuestionsTab
          moduleId={moduleId}
          subjectId={subjectId}
          kind="pyq"
          drafts={drafts}
          filters={filters}
          basePath={basePath}
        />
      );
    case "important":
    case "viva":
      return <QuestionsTab moduleId={moduleId} subjectId={subjectId} kind={tab} drafts={drafts} />;
  }
}

async function VideosTab({
  moduleId,
  drafts,
  viewer,
  basePath,
  selectedVideoId,
  autoplay,
}: {
  moduleId: string;
  drafts: boolean;
  viewer: Props["viewer"];
  basePath: string;
  selectedVideoId?: string;
  autoplay: boolean;
}) {
  const videos = await getVideos(moduleId, { drafts });
  if (videos.length === 0) return <Empty>No videos for this module yet.</Empty>;

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
  if (!selected) return <Empty>No videos for this module yet.</Empty>;

  const href = (id: string) => `${basePath}?tab=videos&v=${id}`;
  const after = videos
    .slice(videos.indexOf(selected) + 1)
    .find((v) => v.processing_status === "ready");
  const saved = progress.get(selected.id);

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
        <h2 className="font-sans text-lg font-extrabold tracking-normal">{selected.title}</h2>
      </section>

      <section aria-label="All videos in this module">
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
              <li key={video.id}>
                <Link
                  href={href(video.id)}
                  scroll={false}
                  aria-current={current ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border-2 bg-card p-3 transition-colors hover:border-input",
                    current && "border-primary",
                  )}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {p?.completed ? (
                      <CheckCircle2 className="size-5 text-success" aria-label="Watched" />
                    ) : (
                      <PlayCircle className="size-5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold leading-snug">
                      {index + 1}. {video.title}
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
    </div>
  );
}

async function NotesTab({ moduleId, drafts }: { moduleId: string; drafts: boolean }) {
  const doc = await getDocument(moduleId, "short_notes", { drafts });
  if (!doc || !doc.content_md.trim()) {
    return <Empty>Notes for this module are being written.</Empty>;
  }
  return (
    <article>
      <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        Updated {dateFormat.format(new Date(doc.updated_at))}
        {drafts && !doc.is_published ? <Badge variant="highlight">Draft</Badge> : null}
      </p>
      <Markdown>{doc.content_md}</Markdown>
    </article>
  );
}

async function FormulasTab({ moduleId, drafts }: { moduleId: string; drafts: boolean }) {
  const [cards, sheet] = await Promise.all([
    getFormulaCards(moduleId, { drafts }),
    getDocument(moduleId, "formula_sheet", { drafts }),
  ]);
  const hasSheet = Boolean(sheet?.content_md.trim());
  if (cards.length === 0 && !hasSheet)
    return <Empty>Formulas for this module are being written.</Empty>;

  return (
    <div className="space-y-8">
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
}: {
  moduleId: string;
  subjectId: string;
  kind: "pyq" | "important" | "viva";
  drafts: boolean;
  filters?: QuestionFilters;
  basePath?: string;
}) {
  const [own, shared] = await Promise.all([
    getQuestions(moduleId, kind, { drafts }),
    getCrossModuleQuestions(subjectId, kind, { drafts }),
  ]);
  if (own.length === 0 && shared.length === 0)
    return <Empty>No questions for this module yet.</Empty>;

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

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-muted p-6 text-muted-foreground">{children}</p>;
}
