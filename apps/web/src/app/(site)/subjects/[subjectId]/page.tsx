import { ChevronLeft, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleList } from "@/components/catalog/module-list";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getContentCounts, getModules, getSubject, hasSubjectAccess } from "@/lib/catalog";
import { signInPath } from "@/lib/redirect";
import { isUuid } from "@/lib/validation";

type Params = Promise<{ subjectId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { subjectId } = await params;
  const subject = isUuid(subjectId) ? await getSubject(subjectId) : null;
  if (!subject) return { title: "Subject not found" };
  return {
    title: `${subject.name} (Semester ${subject.semester})`,
    description: `Every module of ${subject.name}, explained with animated videos, short notes, formula sheets and solved previous-year questions.`,
    alternates: { canonical: `/subjects/${subject.id}` },
  };
}

export default async function SubjectPage({ params }: { params: Params }) {
  const { subjectId } = await params;
  if (!isUuid(subjectId)) notFound();

  const [subject, viewer] = await Promise.all([getSubject(subjectId), getViewer()]);
  if (!subject) notFound();

  const [modules, counts, access] = await Promise.all([
    getModules(subject.id),
    getContentCounts(subject.id),
    viewer ? hasSubjectAccess(viewer.userId, subject.id) : Promise.resolve(false),
  ]);

  const backHref = viewer ? `/home?semester=${subject.semester}` : "/subjects";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <Link
        href={backHref}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Semester {subject.semester}
      </Link>

      <p className="mt-4 font-mono text-sm text-muted-foreground">
        {subject.code} · {subject.syllabus_versions.branches.name}
      </p>
      <h1 className="mt-2 text-3xl sm:text-5xl">{subject.name}</h1>
      {subject.description ? (
        <p className="mt-4 max-w-prose text-muted-foreground">{subject.description}</p>
      ) : null}

      {!viewer ? (
        <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-band p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-sunflower" aria-hidden="true" />
            <span>
              <strong>Module 1 is free.</strong> Sign in to watch, read and practise it now.
            </span>
          </p>
          <Link
            href={signInPath(`/subjects/${subject.id}`)}
            className={buttonVariants({ variant: "sunflower" })}
          >
            Start free
          </Link>
        </div>
      ) : null}

      <section aria-labelledby="modules-heading" className="mt-10">
        <h2 id="modules-heading" className="text-xl">
          Modules
        </h2>
        <div className="mt-4">
          <ModuleList
            subjectId={subject.id}
            modules={modules}
            counts={counts}
            signedIn={Boolean(viewer)}
            hasSubjectAccess={access}
          />
        </div>
      </section>
    </main>
  );
}
