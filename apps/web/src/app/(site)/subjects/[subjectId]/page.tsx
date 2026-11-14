import { ChevronLeft, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleList } from "@/components/catalog/module-list";
import { SubjectHero } from "@/components/catalog/subject-hero";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import {
  getContentCounts,
  getModules,
  getSubject,
  getSubjectStyle,
  hasSubjectAccess,
} from "@/lib/catalog";
import { pluralize } from "@/lib/format";
import { tabCount } from "@/lib/module-tabs";
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

  const [modules, counts, style, access] = await Promise.all([
    getModules(subject.id),
    getContentCounts(subject.id),
    getSubjectStyle(subject),
    viewer ? hasSubjectAccess(viewer.userId, subject.id) : Promise.resolve(false),
  ]);

  const videoTotal = modules.reduce((sum, m) => sum + tabCount("videos", counts.get(m.id)), 0);
  const freeNumbers = modules.filter((m) => m.is_free_preview).map((m) => m.number);
  const freeText =
    freeNumbers.length === 1
      ? `Module ${freeNumbers[0]} is free`
      : freeNumbers.length > 1
        ? `Modules ${freeNumbers.join(", ")} are free`
        : null;
  const chips = [
    `Semester ${subject.semester}`,
    ...(freeText ? [freeText] : []),
    ...(modules.length > 0 ? [pluralize(modules.length, "module")] : []),
    ...(videoTotal > 0 ? [pluralize(videoTotal, "video")] : []),
  ];
  const backHref = viewer ? `/home?semester=${subject.semester}` : "/subjects";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <Link
        href={backHref}
        className="group -ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft
          className="size-4 transition-transform group-hover:-translate-x-1"
          aria-hidden="true"
        />
        Semester {subject.semester}
      </Link>

      <div className="mt-3">
        <SubjectHero
          icon={style.icon}
          tone={style.tone}
          eyebrow={`${subject.code} · ${subject.syllabus_versions.branches.name}`}
          title={subject.name}
          description={subject.description}
          chips={chips}
        />
      </div>

      {!viewer ? (
        <div className="mt-8 flex flex-col gap-4 rounded-3xl border-[3px] border-line bg-band p-6 shadow-[0_6px_0_0_var(--color-sunflower)] text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-sunflower" aria-hidden="true" />
            <span>
              {freeText ? (
                <>
                  <strong>{freeText}.</strong> Sign in to watch, read and practise it now, with no
                  payment. Subscribe to unlock every other module of {subject.name}.
                </>
              ) : (
                <>
                  <strong>Unlock every module of {subject.name}.</strong> Sign in and subscribe to
                  watch, read and practise.
                </>
              )}
            </span>
          </p>
          <Link
            href={signInPath(`/subjects/${subject.id}`)}
            className={buttonVariants({ variant: "sunflower" })}
          >
            {freeText ? "Start free" : "Get started"}
          </Link>
        </div>
      ) : null}

      <section aria-labelledby="modules-heading" className="mt-10">
        <h2 id="modules-heading" className="text-xl">
          Modules
        </h2>
        <div className="mt-4">
          <ModuleList
            tone={style.tone}
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
