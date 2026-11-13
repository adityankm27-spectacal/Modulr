import { PointerArea } from "@/components/motion/pointer-area";
import { PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SubjectCard } from "@/components/catalog/subject-card";
import { Planner, PlannerLocked, PlannerUnavailable } from "@/components/planner/planner";
import { requireOnboardedViewer } from "@/lib/auth";
import { getBilling } from "@/lib/billing/queries";
import {
  getContinueWatching,
  getCurrentSyllabusVersion,
  getSubjectsForSemester,
} from "@/lib/catalog";
import { formatTimestamp } from "@modulr/shared";
import { pluralize } from "@/lib/format";
import { canUsePlanner } from "@/lib/planner/access";
import { getPlannerData } from "@/lib/planner/queries";
import { subjectStyles } from "@/lib/subject-style";

export const metadata: Metadata = { title: "My subjects", robots: { index: false } };

export default async function HomePage() {
  const { profile, userId } = await requireOnboardedViewer("/home");
  // Students only see the semester they chose; they can change it from their account.
  const semester = profile.semester;

  const syllabus = await getCurrentSyllabusVersion(profile.branch_id);
  const [subjects, continueWatching] = await Promise.all([
    syllabus ? getSubjectsForSemester(syllabus.id, semester) : Promise.resolve([]),
    getContinueWatching(userId),
  ]);
  // The planner is part of the plan: subscribers, admins and students with free access.
  // It is an extra, so if it can't load the subjects still show.
  const { hasSubscriptionAccess } = await getBilling(userId);
  const plannerAllowed = canUsePlanner({
    role: profile.role,
    compAccessUntil: profile.comp_access_until,
    hasSubscriptionAccess,
  });
  let plannerData = null;
  let plannerFailed = false;
  if (plannerAllowed) {
    try {
      plannerData = await getPlannerData(
        userId,
        { college_id: profile.college_id, branch_id: profile.branch_id, semester },
        subjects.map((s) => ({ id: s.id, name: s.name })),
      );
    } catch (error) {
      console.error(error);
      plannerFailed = true;
    }
  }
  const firstName = profile.full_name?.split(" ")[0];
  const styles = subjectStyles(subjects);
  const moduleTotal = subjects.reduce((sum, s) => sum + (s.modules[0]?.count ?? 0), 0);

  return (
    <main className="flex flex-1 flex-col lg:h-[calc(100vh-5rem)] lg:min-h-0 lg:flex-none lg:flex-row lg:items-stretch">
      <aside
        aria-label="Dashboard"
        className="order-2 px-4 pb-8 lg:order-1 lg:w-[372px] lg:shrink-0 lg:overflow-y-auto lg:pt-8 lg:pb-4"
      >
        {plannerData ? (
          <Planner data={plannerData} />
        ) : plannerFailed ? (
          <PlannerUnavailable />
        ) : (
          <PlannerLocked />
        )}
      </aside>

      <div className="order-1 mx-auto w-full max-w-5xl min-w-0 flex-1 space-y-10 px-4 py-8 sm:py-12 lg:order-2 lg:overflow-y-auto">
        <PointerArea
          as="header"
          className="group/banner relative isolate overflow-hidden rounded-[1.75rem] border-[3px] border-line bg-cobalt p-6 text-white shadow-[0_8px_0_0_var(--line)] sm:p-10"
        >
          {/* Light that follows the pointer across the banner. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/banner:opacity-100"
            style={{
              background:
                "radial-gradient(380px circle at var(--x, 50%) var(--y, 50%), rgb(255 255 255 / 0.22), transparent 70%)",
            }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-20 -right-16 size-72 rounded-full bg-periwinkle/60 blur-3xl motion-safe:animate-drift" />
            <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-sunflower/25 blur-3xl motion-safe:animate-drift motion-safe:[animation-delay:-9s]" />
          </div>
          <p className="inline-flex -rotate-2 rounded-full border-[3px] border-line bg-sunflower px-3 py-1 text-sm font-extrabold text-ink motion-safe:animate-rise">
            Semester {semester}
          </p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl motion-safe:animate-rise motion-safe:[animation-delay:80ms]">
            {firstName ? `Hi, ${firstName}` : "My subjects"}
          </h1>
          {syllabus ? (
            <p className="mt-3 text-white/85 motion-safe:animate-rise motion-safe:[animation-delay:160ms]">
              {syllabus.branches?.name} · {syllabus.label}
            </p>
          ) : null}
          {subjects.length > 0 ? (
            <dl className="mt-6 flex flex-wrap gap-3 motion-safe:animate-rise motion-safe:[animation-delay:240ms]">
              <div className="rounded-2xl bg-white/15 px-4 py-2">
                <dt className="sr-only">Subjects</dt>
                <dd className="font-bold">{pluralize(subjects.length, "subject")}</dd>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-2">
                <dt className="sr-only">Modules</dt>
                <dd className="font-bold">{pluralize(moduleTotal, "module")} ready</dd>
              </div>
            </dl>
          ) : null}
        </PointerArea>
        {continueWatching.length > 0 ? (
          <section aria-labelledby="continue-heading">
            <h2 id="continue-heading" className="text-xl">
              Continue watching
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {continueWatching.map((item) => {
                const percent = item.duration
                  ? Math.min(100, Math.round((item.position / item.duration) * 100))
                  : 0;
                return (
                  <li key={item.videoId}>
                    <Link
                      href={`/subjects/${item.subjectId}/modules/${item.moduleNumber}?tab=videos&v=${item.videoId}`}
                      className="flex h-full flex-col gap-3 rounded-2xl border-[3px] border-line bg-card p-4 shadow-[0_4px_0_0_var(--line)] transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--line)]"
                    >
                      <span className="flex items-start gap-3">
                        <PlayCircle
                          className="mt-0.5 size-6 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block font-bold leading-snug">{item.title}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {item.subjectName} · Module {item.moduleNumber}
                          </span>
                        </span>
                      </span>
                      <span className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                        <span
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
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
                        <span className="font-mono">{formatTimestamp(item.position)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="subjects-heading">
          <h2 id="subjects-heading" className="text-2xl sm:text-3xl">
            Your subjects
          </h2>

          {subjects.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-muted p-6">
              <p className="font-bold">No subjects here yet</p>
              <p className="mt-1 text-muted-foreground">
                We&apos;re still adding Semester {semester} for your branch. Check back soon.
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject, i) => {
                const style = styles.get(subject.id);
                return (
                  <li key={subject.id}>
                    <SubjectCard
                      href={`/subjects/${subject.id}`}
                      name={subject.name}
                      description={subject.description}
                      moduleCount={subject.modules[0]?.count ?? 0}
                      icon={style?.icon ?? "atom"}
                      tone={style?.tone ?? "cobalt"}
                      index={i}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
