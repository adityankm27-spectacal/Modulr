import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LockPanel } from "@/components/catalog/lock-panel";
import { VideosTab } from "@/components/catalog/module-content";
import { moduleLockState } from "@/lib/access";
import { getViewer, isOnboarded } from "@/lib/auth";
import {
  getActivePlans,
  getPractical,
  getPracticals,
  getSubject,
  hasSubjectAccess,
} from "@/lib/catalog";
import { isUuid } from "@/lib/validation";

type Params = Promise<{ subjectId: string; practicalNumber: string }>;

async function load(params: Params) {
  const { subjectId, practicalNumber } = await params;
  const number = Number(practicalNumber);
  if (!isUuid(subjectId) || !Number.isInteger(number) || number < 1) return null;
  const subject = await getSubject(subjectId);
  if (!subject) return null;
  const practical = await getPractical(subject.id, number);
  if (!practical) return null;
  return { subject, practical };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Practical not found" };
  return {
    title: `Practical ${data.practical.number}: ${data.practical.title} · ${data.subject.name}`,
    description: `Video explanation of practical ${data.practical.number}, ${data.practical.title}, for ${data.subject.name}.`,
  };
}

export default async function PracticalPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ v?: string | string[]; autoplay?: string | string[] }>;
}) {
  const data = await load(params);
  if (!data) notFound();
  const { subject, practical } = data;
  const query = await searchParams;
  const basePath = `/subjects/${subject.id}/practicals/${practical.number}`;

  const viewer = await getViewer();
  if (viewer && !isOnboarded(viewer.profile)) {
    redirect(`/onboarding?next=${encodeURIComponent(basePath)}`);
  }

  const [all, access, plans] = await Promise.all([
    getPracticals(subject.id),
    viewer ? hasSubjectAccess(viewer.userId, subject.id) : Promise.resolve(false),
    getActivePlans(),
  ]);
  // Practical videos follow the subject's paid access; none are free previews.
  const lock = moduleLockState({
    signedIn: Boolean(viewer),
    isFreePreview: false,
    hasSubjectAccess: access,
  });
  const monthly = plans.find(
    (p) => p.interval === "month" && p.billing_months === 1 && p.scope === "all",
  );
  const index = all.findIndex((p) => p.id === practical.id);
  const previous = all[index - 1];
  const next = all[index + 1];

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
          className="flex size-16 shrink-0 -rotate-6 items-center justify-center rounded-2xl border-[3px] border-line bg-mint font-display text-3xl font-black text-ink shadow-[0_5px_0_0_var(--line)] transition-[rotate,scale] duration-300 group-hover:scale-110 group-hover:rotate-6 sm:size-20 sm:text-4xl"
        >
          {practical.number}
        </span>
        <div className="min-w-0">
          <span className="font-mono text-sm text-muted-foreground">
            Practical {practical.number} of {all.length}
          </span>
          <h1 className="mt-1 text-2xl break-words sm:text-4xl">{practical.title}</h1>
        </div>
      </header>

      <div className="mt-8">
        {lock.kind === "open" ? (
          <VideosTab
            practicalId={practical.id}
            practicalNumber={practical.number}
            hrefFor={(id) => `${basePath}?v=${id}`}
            drafts={false}
            viewer={
              viewer
                ? {
                    userId: viewer.userId,
                    name: viewer.profile?.full_name ?? "",
                    email: viewer.email ?? "",
                  }
                : null
            }
            basePath={basePath}
            selectedVideoId={typeof query.v === "string" ? query.v : undefined}
            autoplay={query.autoplay === "1"}
          />
        ) : (
          <LockPanel
            lock={lock}
            returnTo={basePath}
            monthlyPricePaise={monthly?.price_paise ?? null}
            freeModuleHref={null}
          />
        )}
      </div>

      <nav aria-label="Other practicals" className="mt-12 grid grid-cols-2 gap-3 border-t pt-6">
        {previous ? (
          <Link
            href={`/subjects/${subject.id}/practicals/${previous.number}`}
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
            href={`/subjects/${subject.id}/practicals/${next.number}`}
            className="group flex min-h-16 flex-col items-end justify-center rounded-2xl border-[3px] border-line bg-card px-4 py-2 text-right shadow-[0_4px_0_0_var(--line)] transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_var(--line)] active:translate-y-1 active:shadow-none"
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
