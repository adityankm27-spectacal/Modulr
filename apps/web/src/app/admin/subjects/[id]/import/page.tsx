import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/admin/admin-ui";
import { CsvImport } from "@/components/admin/csv-import";
import { getSubjectForQuestions } from "@/lib/admin/queries";
import { isUuid } from "@/lib/validation";
import { adminMetadata } from "@/lib/admin/metadata";

export const generateMetadata = adminMetadata("Import questions");

export default async function ImportQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = isUuid(id) ? await getSubjectForQuestions(id) : null;
  if (!data) notFound();

  return (
    <>
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { href: "/admin/catalog", label: "Catalog" },
            { href: `/admin/subjects/${data.subject.id}`, label: data.subject.name },
            { label: "Import questions" },
          ]}
        />
        <h1 className="text-3xl">Import questions</h1>
        <p className="text-muted-foreground">
          Into <strong>{data.subject.name}</strong>. Modules:{" "}
          {data.modules.map((m) => `${m.number}. ${m.title}`).join(" · ") || "none yet"}
        </p>
      </div>
      <CsvImport subjectId={data.subject.id} />
    </>
  );
}
