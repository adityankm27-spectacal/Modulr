import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AdminSection } from "@/components/admin/admin-ui";
import { getAdminCounts, getCatalogTree } from "@/lib/admin/queries";
import { adminMetadata } from "@/lib/admin/metadata";

export const generateMetadata = adminMetadata("Overview");

export default async function AdminOverviewPage() {
  const [counts, tree] = await Promise.all([getAdminCounts(), getCatalogTree()]);
  const stats = [
    { label: "Students and staff", value: counts.users },
    { label: "Subjects", value: counts.subjects },
    {
      label: "Modules",
      value: counts.modules,
      note: counts.draftModules ? `${counts.draftModules} draft` : null,
    },
    { label: "Videos", value: counts.videos },
    {
      label: "Questions",
      value: counts.questions,
      note: counts.draftQuestions ? `${counts.draftQuestions} draft` : null,
    },
  ];
  const syllabi = tree.flatMap((college) =>
    college.branches.flatMap((branch) =>
      branch.syllabus_versions.map((sv) => ({
        id: sv.id,
        label: `${branch.name} · ${sv.label}`,
        college: college.name,
        current: sv.is_current,
        subjects: sv.subjects[0]?.count ?? 0,
      })),
    ),
  );

  return (
    <>
      <h1 className="text-3xl">Overview</h1>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border-2 bg-card p-4">
            <dt className="text-sm font-semibold text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 font-display text-3xl font-black">
              {s.value.toLocaleString("en-IN")}
            </dd>
            {s.note ? (
              <dd className="text-xs font-semibold text-muted-foreground">{s.note}</dd>
            ) : null}
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">
        Subscribers, revenue and error reports appear here once payments and reporting are built.
      </p>

      <AdminSection
        title="Syllabus versions"
        description="Jump straight to a syllabus to manage its subjects."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {syllabi.map((sv) => (
            <li key={sv.id}>
              <Link
                href={`/admin/syllabus/${sv.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border-2 bg-card p-4 hover:border-input"
              >
                <span>
                  <span className="block font-bold">{sv.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {sv.college} · {sv.subjects} subjects{sv.current ? " · current" : ""}
                  </span>
                </span>
                <ArrowRight className="size-5 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </AdminSection>
    </>
  );
}
