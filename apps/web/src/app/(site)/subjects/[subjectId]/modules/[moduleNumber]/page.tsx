import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LockPanel } from "@/components/catalog/lock-panel";
import { ModuleContent } from "@/components/catalog/module-content";
import { ModuleTabsNav } from "@/components/catalog/module-tabs-nav";
import { Badge } from "@/components/ui/badge";
import { moduleLockState } from "@/lib/access";
import { getViewer, isOnboarded } from "@/lib/auth";
import {
  getActivePlans,
  getContentCounts,
  getModules,
  getSubject,
  hasSubjectAccess,
} from "@/lib/catalog";
import { parseModuleTab } from "@/lib/module-tabs";
import { parseQuestionFilters } from "@/lib/questions";
import { isUuid } from "@/lib/validation";

type Params = Promise<{ subjectId: string; moduleNumber: string }>;

async function load(params: Params) {
  const { subjectId, moduleNumber } = await params;
  const number = Number(moduleNumber);
  if (!isUuid(subjectId) || !Number.isInteger(number) || number < 1) return null;
  const subject = await getSubject(subjectId);
  if (!subject) return null;
  const modules = await getModules(subject.id);
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
  }>;
}) {
  const data = await load(params);
  if (!data) notFound();
  const { subject, modules, current, index } = data;

  const query = await searchParams;
  const tab = parseModuleTab(query.tab);
  const filters = parseQuestionFilters(query);
  const basePath = `/subjects/${subject.id}/modules/${current.number}`;
  const returnTo = tab === "videos" ? basePath : `${basePath}?tab=${tab}`;

  const viewer = await getViewer();
  if (viewer && !isOnboarded(viewer.profile)) {
    redirect(`/onboarding?next=${encodeURIComponent(returnTo)}`);
  }

  const [counts, access, plans] = await Promise.all([
    getContentCounts(subject.id),
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
  const monthly = plans.find((p) => p.interval === "month" && p.scope === "all");
  const freeModule = modules.find((m) => m.is_free_preview && m.id !== current.id);
  const previous = modules[index - 1];
  const next = modules[index + 1];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <Link
        href={`/subjects/${subject.id}`}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        {subject.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">Module {current.number}</span>
        {current.is_free_preview ? <Badge variant="free">Free preview</Badge> : null}
      </div>
      <h1 className="mt-2 text-2xl sm:text-4xl">{current.title}</h1>

      <div className="mt-6">
        <ModuleTabsNav basePath={basePath} active={tab} counts={counts.get(current.id)} />
      </div>

      <div className="mt-6">
        {lock.kind === "open" ? (
          <ModuleContent
            moduleId={current.id}
            subjectId={subject.id}
            tab={tab}
            basePath={basePath}
            filters={filters}
            viewer={
              viewer
                ? {
                    userId: viewer.userId,
                    name: viewer.profile?.full_name ?? "",
                    email: viewer.email ?? "",
                  }
                : null
            }
            selectedVideoId={typeof query.v === "string" ? query.v : undefined}
            autoplay={query.autoplay === "1"}
          />
        ) : (
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
        )}
      </div>

      <nav aria-label="Other modules" className="mt-12 grid grid-cols-2 gap-3 border-t pt-6">
        {previous ? (
          <Link
            href={`/subjects/${subject.id}/modules/${previous.number}`}
            className="flex min-h-14 flex-col justify-center rounded-2xl px-3 hover:bg-muted"
          >
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronLeft className="size-4" aria-hidden="true" /> Previous
            </span>
            <span className="line-clamp-1 font-bold">Module {previous.number}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/subjects/${subject.id}/modules/${next.number}`}
            className="flex min-h-14 flex-col items-end justify-center rounded-2xl px-3 text-right hover:bg-muted"
          >
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              Next <ChevronRight className="size-4" aria-hidden="true" />
            </span>
            <span className="line-clamp-1 font-bold">Module {next.number}</span>
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
