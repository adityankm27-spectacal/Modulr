import { BookOpen, ChevronRight, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SemesterSwitcher } from "@/components/catalog/semester-switcher";
import { requireOnboardedViewer } from "@/lib/auth";
import {
  getContinueWatching,
  getCurrentSyllabusVersion,
  getSubjectsForSemester,
} from "@/lib/catalog";
import { formatTimestamp } from "@modulr/shared";
import { pluralize } from "@/lib/format";
import { parseSemester } from "@/lib/validation";

export const metadata: Metadata = { title: "My subjects", robots: { index: false } };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string | string[] }>;
}) {
  const { profile, userId } = await requireOnboardedViewer("/home");
  const semester = parseSemester((await searchParams).semester) ?? profile.semester;

  const syllabus = await getCurrentSyllabusVersion(profile.branch_id);
  const [subjects, continueWatching] = await Promise.all([
    syllabus ? getSubjectsForSemester(syllabus.id, semester) : Promise.resolve([]),
    getContinueWatching(userId),
  ]);
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8 sm:py-12">
      <div>
        <h1 className="text-3xl sm:text-4xl">{firstName ? `Hi, ${firstName}` : "My subjects"}</h1>
        {syllabus ? (
          <p className="mt-2 text-muted-foreground">
            {syllabus.branches?.name} · {syllabus.label}
          </p>
        ) : null}
      </div>

      {continueWatching.length > 0 ? (
        <section aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="text-xl">
            Continue watching
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {continueWatching.map((item) => {
              const percent = item.duration
                ? Math.min(100, Math.round((item.position / item.duration) * 100))
                : 0;
              return (
                <li key={item.videoId}>
                  <Link
                    href={`/subjects/${item.subjectId}/modules/${item.moduleNumber}?tab=videos&v=${item.videoId}`}
                    className="flex h-full flex-col gap-3 rounded-2xl border-2 bg-card p-4 transition-colors hover:border-input"
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

      <SemesterSwitcher current={semester} own={profile.semester} />

      <section aria-labelledby="subjects-heading">
        <h2 id="subjects-heading" className="text-xl">
          Semester {semester} subjects
        </h2>

        {subjects.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-muted p-6">
            <p className="font-bold">No subjects here yet</p>
            <p className="mt-1 text-muted-foreground">
              We&apos;re still adding Semester {semester} for your branch. Check back soon.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {subjects.map((subject) => {
              const moduleCount = subject.modules[0]?.count ?? 0;
              return (
                <li key={subject.id}>
                  <Link
                    href={`/subjects/${subject.id}`}
                    className="group flex h-full items-center gap-4 rounded-2xl border-2 bg-card p-5 transition-colors hover:border-input hover:bg-muted/50"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <BookOpen className="size-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug">{subject.name}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        <span className="font-mono">{subject.code}</span> ·{" "}
                        {pluralize(moduleCount, "module")}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
