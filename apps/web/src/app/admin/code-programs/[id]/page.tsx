import { Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  CheckboxField,
  TextAreaField,
  TextField,
} from "@/components/admin/action-form";
import { AdminSection, Breadcrumbs } from "@/components/admin/admin-ui";
import { AdminVideoList } from "@/components/admin/admin-video-list";
import { DeleteButton } from "@/components/admin/delete-button";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { PdfUpload } from "@/components/admin/pdf-upload";
import { buttonVariants } from "@/components/ui/button";
import { deleteCodeProgram, removeProgramPdf, saveCodeProgram } from "@/lib/admin/actions";
import { adminMetadata } from "@/lib/admin/metadata";
import { getCodeProgramAdmin } from "@/lib/admin/queries";
import { isUuid } from "@/lib/validation";

export const generateMetadata = adminMetadata("Code program");

export default async function CodeProgramEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = isUuid(id) ? await getCodeProgramAdmin(id) : null;
  if (!data) notFound();
  const { program, videos } = data;
  const mod = program.modules;
  const subject = mod.subjects;

  return (
    <>
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { href: "/admin/catalog", label: "Catalog" },
            {
              href: `/admin/syllabus/${subject.syllabus_versions.id}`,
              label: subject.syllabus_versions.label,
            },
            { href: `/admin/subjects/${subject.id}`, label: subject.name },
            { href: `/admin/modules/${mod.id}?tab=code`, label: `Module ${mod.number}` },
            { label: program.title },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl">{program.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <FlagToggle
              table="code_programs"
              id={program.id}
              value={program.is_published}
              label={program.title}
            />
            <Link
              href={`/subjects/${subject.id}/modules/${mod.number}?tab=code&p=${program.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Eye aria-hidden="true" />
              View on site
            </Link>
          </div>
        </div>
      </div>

      <AdminSection
        title="Program"
        description="Paste the full Java program. Indentation and blank lines are kept exactly; students see it with line numbers, colours and a Copy button."
      >
        <ActionForm action={saveCodeProgram} submitLabel="Save program">
          <input type="hidden" name="id" value={program.id} />
          <input type="hidden" name="module_id" value={program.module_id} />
          <TextField
            name="title"
            label="Title"
            defaultValue={program.title}
            className="max-w-2xl"
          />
          <TextAreaField
            name="code"
            label="Java code"
            mono
            rows={24}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            defaultValue={program.code}
            placeholder={"public class Stack {\n    ...\n}"}
          />
          <CheckboxField
            name="is_published"
            label="Published"
            defaultChecked={program.is_published}
          />
        </ActionForm>
      </AdminSection>

      <AdminSection
        title="Code PDF"
        description="This program's own code as a PDF. Students see it under this program's video. Each program has its own PDF."
      >
        <div className="space-y-3">
          <PdfUpload
            moduleId={mod.id}
            programId={program.id}
            hasPdf={Boolean(program.pdf_path)}
            hint="PDF only, up to 20 MB. It shows once the program is published."
          />
          {program.pdf_path ? (
            <ActionForm
              action={removeProgramPdf}
              submitLabel="Remove PDF"
              submitVariant="outline"
              confirm="Remove this program's PDF? Students will no longer see it."
            >
              <input type="hidden" name="id" value={program.id} />
            </ActionForm>
          ) : null}
        </div>
      </AdminSection>

      <AdminVideoList videos={videos} parent={{ field: "code_program_id", id: program.id }} />

      <AdminSection title="Delete">
        <p className="text-sm text-muted-foreground">
          Deleting a program also deletes its videos, including the files on the video provider.
        </p>
        <DeleteButton
          action={deleteCodeProgram}
          fields={{ id: program.id }}
          what={`“${program.title}” and its videos`}
        />
      </AdminSection>
    </>
  );
}
