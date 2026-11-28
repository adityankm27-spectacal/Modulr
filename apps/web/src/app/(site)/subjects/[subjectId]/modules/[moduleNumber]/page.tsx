import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { IntentLink as Link } from "@/components/intent-link";
import { notFound, redirect } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { LockPanel } from "@/components/catalog/lock-panel";
import { ModuleContent } from "@/components/catalog/module-content";
import { ModuleTabsNav } from "@/components/catalog/module-tabs-nav";
import { SUBJECT_TONE } from "@/components/catalog/subject-visuals";
import { Badge } from "@/components/ui/badge";
import { moduleLockState } from "@/lib/access";
import { getViewer, isOnboarded } from "@/lib/auth";
import {
  getActivePlans,
  getContentCounts,
  getModules,
  getSubject,
  getSubjectStyle,
  hasSubjectAccess,
} from "@/lib/catalog";
import { InstantModuleTabs } from "@/components/catalog/instant-module-tabs";
import { moduleTabs, parseModuleTab } from "@/lib/module-tabs";
import { parseQuestionFilters } from "@/lib/questions";
import { isUuid } from "@/lib/validation";

type Params = Promise<{ subjectId: string; moduleNumber: string }>;

async function load(params: Params) {
  const { subjectId, moduleNumber } = await params;
  const number = Number(moduleNumber);
  if (!isUuid(subjectId) || !Number.isInteger(number) || number < 1) return null;
  // Fetched together: the modules query only needs the id, and an unpublished
  // subject's modules are discarded below.
  const [subject, modules] = await Promise.all([getSubject(subjectId), getModules(subjectId)]);
  if (!subject) return null;
  const index = modules.findIndex((m) => m.number === number);
  const current = modules[index];
  if (!current) return null;
  return { subject, modules, current, index };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Module not found" };
  return {
    title: `${data.current.title} · ${data.subject.name}`,
    description: `Module ${data.current.number} of ${data.subject.name}: videos, short notes, formulas, PYQs, important questions and viva prep.`,
  };
}

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{
    tab?: string | string[];
    marks?: string | string[];
    session?: string | string[];
    v?: string | string[];
    autoplay?: string | string[];
    p?: string | string[];
    s?: string | string[];
  }>;
}) {
  const [data, viewer] = await Promise.all([load(params), getViewer()]);
  if (!data) notFound();
  const { subject, modules, current, index } = data;

  const query = await searchParams;
  const hasCodeTab = subject.has_code_tab;
  const tab = parseModuleTab(query.tab, { hasCodeTab });
  const filters = parseQuestionFilters(query);
  const basePath = `/subjects/${subject.id}/modules/${current.number}`;
  const returnTo = tab === "videos" ? basePath : `${basePath}?tab=${tab}`;

  if (viewer && !isOnboarded(viewer.profile)) {
    redirect(`/onboarding?next=${encodeURIComponent(returnTo)}`);
  }

  const [counts, style, access, plans] = await Promise.all([
    getContentCounts(subject.id),
    getSubjectStyle(subject),
    viewer && !current.is_free_preview
      ? hasSubjectAccess(viewer.userId, subject.id)
      : Promise.resolve(false),
    getActivePlans(),
  ]);

  const lock = moduleLockState({
    signedIn: Boolean(viewer),
    isFreePreview: current.is_free_preview,
    hasSubjectAccess: access,
  });
  const monthly = plans.find(
    (p) => p.interval === "month" && p.billing_months === 1 && p.scope === "all",
  );
  const freeModule = modules.find((m) => m.is_free_preview && m.id !== current.id);
  const tone = SUBJECT_TONE[style.tone];
  const previous = modules[index - 1];
  const next = modules[index + 1];
  const contentViewer = viewer
    ? { userId: viewer.userId, name: viewer.profile?.full_name ?? "", email: viewer.email ?? "" }
    : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <Link
        href={`/subjects/${subject.id}`}
        className="group -ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft
          className="size-4 transition-transform group-hover:-translate-x-1"
          aria-hidden="true"
        />
        {subject.name}
      </Link>

      <header className="group mt-4 flex items-center gap-4 motion-safe:animate-rise">
        <span
          aria-hidden="true"
          style={{ "--tone": tone.color, color: tone.ink } as CSSProperties}
          className="flex size-16 shrink-0 -rotate-6 items-center justify-center rounded-2xl border-[3px] border-line bg-(--tone) font-display text-3xl font-black shadow-[0_5px_0_0_var(--line)] transition-[rotate,scale] duration-300 group-hover:scale-110 group-hover:rotate-6 sm:size-20 sm:text-4xl"
        >
          {current.number}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              Module {current.number} of {modules.length}
            </span>
            {current.is_free_preview ? <Badge variant="free">Free preview</Badge> : null}
          </div>
          <h1 className="mt-1 text-2xl break-words sm:text-4xl">{current.title}</h1>
        </div>
      </header>

      {lock.kind === "open" ? (
        // Every tab's content is sent with the page, each streaming in on its own, so
        // switching tabs happens in the browser with no wait. A new key per server render
        // (a filter, a chosen video or program) resets the open tab to the URL's.
        <InstantModuleTabs
          key={[tab, query.v, query.p, query.s, query.marks, query.session].join(":")}
          basePath={basePath}
          initialTab={tab}
          counts={counts.get(current.id)}
          hasCodeTab={hasCodeTab}
          panels={Object.fromEntries(
            moduleTabs({ hasCodeTab }).map(({ id }) => [
              id,
              <Suspense key={id} fallback={<TabSkeleton />}>
                <ModuleContent
                  moduleId={current.id}
                  subjectId={subject.id}
                  tab={id}
                  basePath={basePath}
                  filters={filters}
                  viewer={contentViewer}
                  // A chosen video or program belongs to the tab it was picked on.
                  selectedVideoId={id === tab && typeof query.v === "string" ? query.v : undefined}
                  selectedProgramId={typeof query.p === "string" ? query.p : undefined}
                  selectedSlideId={typeof query.s === "string" ? query.s : undefined}
                  autoplay={id === tab && query.autoplay === "1"}
                />
              </Suspense>,
            ]),
          )}
        />
      ) : (
        <>
          <div className="mt-6">
            <ModuleTabsNav
              basePath={basePath}
              active={tab}
              counts={counts.get(current.id)}
              hasCodeTab={hasCodeTab}
            />
          </div>
          <div className="mt-6">
            <LockPanel
              lock={lock}
              returnTo={returnTo}
              monthlyPricePaise={monthly?.price_paise ?? null}
              freeModuleHref={
                lock.kind === "paywall" && freeModule
                  ? `/subjects/${subject.id}/modules/${freeModule.number}`
                  : null
              }
            />
          </div>
        </>
      )}

      <nav aria-label="Other modules" className="mt-12 grid grid-cols-2 gap-3 border-t pt-6">
        {previous ? (
          <Link
            href={`/subjects/${subject.id}/modules/${previous.number}`}
            className="group flex min-h-16 flex-col justify-center rounded-2xl border-[3px] border-line bg-card px-4 py-2 shadow-[0_4px_0_0_var(--line)] transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_var(--line)] active:translate-y-1 active:shadow-none"
          >
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronLeft
                className="size-4 transition-transform group-hover:-translate-x-1"
                aria-hidden="true"
              />{" "}
              Previous
            </span>
            <span className="line-clamp-1 font-bold">
              {previous.number}. {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/subjects/${subject.id}/modules/${next.number}`}
            className="group flex min-h-16 flex-col items-end justify-center text-right rounded-2xl border-[3px] border-line bg-card px-4 py-2 shadow-[0_4px_0_0_var(--line)] transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_var(--line)] active:translate-y-1 active:shadow-none"
          >
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              Next{" "}
              <ChevronRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
            <span className="line-clamp-1 font-bold">
              {next.number}. {next.title}
            </span>
          </Link>
        ) : null}
      </nav>
    </main>
  );
}

/** Placeholder while a tab's content streams in; sized roughly like a video or a notes page. */
function TabSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading</span>
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-muted" />
      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  );
}
