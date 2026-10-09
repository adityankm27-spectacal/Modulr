import { Plus } from "lucide-react";
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
import { FlagToggle } from "@/components/admin/flag-toggle";
import { SortableList } from "@/components/admin/sortable-list";
import { saveSubject } from "@/lib/admin/actions";
import { getSyllabusAdmin } from "@/lib/admin/queries";
import { pluralize } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import { adminMetadata } from "@/lib/admin/metadata";

export const generateMetadata = adminMetadata("Syllabus");

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

export default async function SyllabusAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = isUuid(id) ? await getSyllabusAdmin(id) : null;
  if (!data) notFound();
  const { syllabus, subjects } = data;

  const bySemester = new Map<number, typeof subjects>();
  for (const s of subjects) bySemester.set(s.semester, [...(bySemester.get(s.semester) ?? []), s]);

  return (
    <>
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { href: "/admin/catalog", label: syllabus.branches.colleges.name },
            { label: `${syllabus.branches.name} · ${syllabus.label}` },
          ]}
        />
        <h1 className="text-3xl">{syllabus.label}</h1>
        <p className="text-muted-foreground">
          {syllabus.branches.name}
          {syllabus.is_current ? " · current syllabus" : ""}
        </p>
      </div>

      {subjects.length === 0 ? <EmptyState>No subjects yet. Add one below.</EmptyState> : null}

      {[...bySemester.entries()].map(([semester, list]) => (
        <AdminSection
          key={semester}
          title={`Semester ${semester}`}
          description="Drag or use the arrows to set the order students see."
        >
          <SortableList
            table="subjects"
            items={list.map((subject) => ({
              id: subject.id,
              label: subject.name,
              content: (
                <div className="flex flex-wrap items-center justify-between gap-3 pr-2">
                  <Link href={`/admin/subjects/${subject.id}`} className="min-w-0">
                    <span className="block font-bold text-link">{subject.name}</span>
                    <span className="text-sm text-muted-foreground">
                      <span className="font-mono">{subject.code}</span> ·{" "}
                      {pluralize(subject.modules[0]?.count ?? 0, "module")}
                    </span>
                  </Link>
                  <FlagToggle
                    table="subjects"
                    id={subject.id}
                    value={subject.is_published}
                    label={subject.name}
                  />
                </div>
              ),
            }))}
          />
        </AdminSection>
      ))}

      <Disclosure
        defaultOpen={subjects.length === 0}
        summary={
          <>
            <Plus className="size-4" aria-hidden="true" /> Add subject
          </>
        }
      >
        <ActionForm action={saveSubject} submitLabel="Add subject" resetOnSuccess>
          <input type="hidden" name="syllabus_version_id" value={syllabus.id} />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              name="semester"
              label="Semester"
              options={SEMESTER_OPTIONS}
              defaultValue="1"
            />
            <TextField name="code" label="Code" placeholder="e.g. ITC301" />
            <TextField name="name" label="Name" />
          </div>
          <TextAreaField
            name="description"
            label="Description"
            rows={2}
            hint="Optional. Shown on the subject page."
          />
          <CheckboxField
            name="is_published"
            label="Publish now"
            hint="Students only see published subjects."
          />
        </ActionForm>
      </Disclosure>
    </>
  );
}
