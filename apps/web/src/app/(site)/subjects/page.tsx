import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedSubjects } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Subjects",
  description:
    "Browse the engineering subjects on Modulr, semester by semester, with every module explained.",
};

export default async function SubjectsIndexPage() {
  const subjects = await getPublishedSubjects();

  // Group by syllabus (college · branch · scheme), then semester.
  const groups = new Map<string, { title: string; semesters: Map<number, typeof subjects> }>();
  for (const subject of subjects) {
    const sv = subject.syllabus_versions;
    const key = `${sv.branches.colleges.name}|${sv.branches.name}|${sv.label}`;
    const group = groups.get(key) ?? {
      title: `${sv.branches.name} · ${sv.label}`,
      semesters: new Map(),
    };
    group.semesters.set(subject.semester, [
      ...(group.semesters.get(subject.semester) ?? []),
      subject,
    ]);
    groups.set(key, group);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
      <h1 className="text-3xl sm:text-5xl">Subjects</h1>
      <p className="mt-3 max-w-prose text-muted-foreground">
        Every module comes with animated videos, short notes, a formula sheet and solved questions.
        Module 1 of every subject is free.
      </p>

      {groups.size === 0 ? (
        <p className="mt-10 rounded-2xl bg-muted p-6 text-muted-foreground">
          Subjects are on their way.
        </p>
      ) : (
        [...groups.entries()].map(([key, group]) => (
          <section key={key} className="mt-10" aria-label={group.title}>
            <h2 className="text-xl">{group.title}</h2>
            {[...group.semesters.entries()].map(([semester, list]) => (
              <div key={semester} className="mt-5">
                <h3 className="font-sans text-sm font-bold tracking-normal text-muted-foreground uppercase">
                  Semester {semester}
                </h3>
                <ul className="mt-2 divide-y rounded-2xl border-2">
                  {list.map((subject) => (
                    <li key={subject.id}>
                      <Link
                        href={`/subjects/${subject.id}`}
                        className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                      >
                        <span className="font-bold">{subject.name}</span>
                        <span className="font-mono text-sm text-muted-foreground">
                          {subject.code}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}
    </main>
  );
}
