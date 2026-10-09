import { ExternalLink, FileUp, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/action-form";
import { AdminSection, Breadcrumbs, Disclosure, EmptyState } from "@/components/admin/admin-ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { deleteSubject, saveModule, saveSubject } from "@/lib/admin/actions";
import { getSubjectAdmin } from "@/lib/admin/queries";
import { plainPreview } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import { adminMetadata } from "@/lib/admin/metadata";

export const generateMetadata = adminMetadata("Subject");

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

const KIND_LABEL = { pyq: "PYQ", important: "Important", viva: "Viva" } as const;

export default async function SubjectAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = isUuid(id) ? await getSubjectAdmin(id) : null;
  if (!data) notFound();
  const { subject, modules, crossModule } = data;
  const nextNumber = Math.max(0, ...modules.map((m) => m.number)) + 1;

  return (
    <>
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { href: "/admin/catalog", label: "Catalog" },
            {
              href: `/admin/syllabus/${subject.syllabus_versions.id}`,
              label: `${subject.syllabus_versions.branches.name} · ${subject.syllabus_versions.label}`,
            },
            { label: subject.name },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl">{subject.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <FlagToggle
              table="subjects"
              id={subject.id}
              value={subject.is_published}
              label={subject.name}
            />
            <Link
              href={`/admin/subjects/${subject.id}/import`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <FileUp aria-hidden="true" />
              Import questions
            </Link>
            {subject.is_published ? (
              <Link
                href={`/subjects/${subject.id}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <ExternalLink aria-hidden="true" />
                View on site
              </Link>
            ) : null}
          </div>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {subject.code} · Semester {subject.semester}
        </p>
      </div>

      <AdminSection
        title="Modules"
        description="Drag or use the arrows to reorder. Open a module to edit its videos, notes, formulas and questions."
      >
        {modules.length === 0 ? (
          <EmptyState>No modules yet. Add the first one below.</EmptyState>
        ) : (
          <SortableList
            table="modules"
            items={modules.map((m) => {
              const kinds = new Set(m.documents.map((d) => d.kind));
              return {
                id: m.id,
                label: `Module ${m.number}`,
                content: (
                  <div className="flex flex-wrap items-center justify-between gap-3 pr-2">
                    <Link href={`/admin/modules/${m.id}`} className="min-w-0">
                      <span className="block font-bold text-link">
                        {m.number}. {m.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {m.videos[0]?.count ?? 0} videos ·{" "}
                        {kinds.has("short_notes") ? "notes" : "no notes"} ·{" "}
                        {m.formula_cards[0]?.count ?? 0} formulas · {m.questions[0]?.count ?? 0}{" "}
                        questions
                      </span>
                    </Link>
                    <span className="flex flex-wrap gap-2">
                      <FlagToggle
                        table="modules"
                        id={m.id}
                        field="is_free_preview"
                        value={m.is_free_preview}
                        label={`Module ${m.number}`}
                      />
                      <FlagToggle
                        table="modules"
                        id={m.id}
                        value={m.is_published}
                        label={`Module ${m.number}`}
                      />
                    </span>
                  </div>
                ),
              };
            })}
          />
        )}

        <Disclosure
          defaultOpen={modules.length === 0}
          summary={
            <>
              <Plus className="size-4" aria-hidden="true" /> Add module
            </>
          }
        >
          <ActionForm action={saveModule} submitLabel="Add module" resetOnSuccess>
            <input type="hidden" name="subject_id" value={subject.id} />
            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <TextField
                name="number"
                label="Number"
                type="number"
                min={1}
                max={99}
                defaultValue={nextNumber}
              />
              <TextField name="title" label="Title" />
            </div>
            <SelectField
              name="is_free_preview"
              label="Free preview"
              defaultValue="auto"
              options={[
                { value: "auto", label: "Default (from settings: Module 1 is free)" },
                { value: "yes", label: "Free for signed-in students" },
                { value: "no", label: "Paid" },
              ]}
            />
            <CheckboxField name="is_published" label="Publish now" />
          </ActionForm>
        </Disclosure>
      </AdminSection>

      <AdminSection
        title="Questions that span modules"
        description="Questions without a module appear under “Spans several modules” in every module's question tabs (subscribers only)."
        actions={
          <Link
            href={`/admin/questions/new?subject=${subject.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus aria-hidden="true" />
            New question
          </Link>
        }
      >
        {crossModule.length === 0 ? (
          <EmptyState>None yet.</EmptyState>
        ) : (
          <ul className="divide-y rounded-2xl border-2">
            {crossModule.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <Link href={`/admin/questions/${q.id}`} className="min-w-0 flex-1 text-link">
                  <Badge className="mr-2">{KIND_LABEL[q.kind]}</Badge>
                  {plainPreview(q.question_md, 100)}
                </Link>
                <FlagToggle table="questions" id={q.id} value={q.is_published} label="question" />
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      <AdminSection title="Subject details">
        <ActionForm action={saveSubject} className="max-w-2xl">
          <input type="hidden" name="id" value={subject.id} />
          <input type="hidden" name="syllabus_version_id" value={subject.syllabus_version_id} />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              name="semester"
              label="Semester"
              options={SEMESTER_OPTIONS}
              defaultValue={String(subject.semester)}
            />
            <TextField name="code" label="Code" defaultValue={subject.code} />
            <TextField name="name" label="Name" defaultValue={subject.name} />
          </div>
          <TextAreaField
            name="description"
            label="Description"
            rows={2}
            defaultValue={subject.description ?? ""}
          />
          <CheckboxField
            name="is_published"
            label="Published"
            defaultChecked={subject.is_published}
          />
        </ActionForm>
        <DeleteButton action={deleteSubject} fields={{ id: subject.id }} what={subject.name} />
      </AdminSection>
    </>
  );
}
