import { Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, CheckboxField, TextField } from "@/components/admin/action-form";
import { AdminSection, Breadcrumbs } from "@/components/admin/admin-ui";
import { AdminVideoList } from "@/components/admin/admin-video-list";
import { DeleteButton } from "@/components/admin/delete-button";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { buttonVariants } from "@/components/ui/button";
import { deletePractical, savePractical } from "@/lib/admin/actions";
import { adminMetadata } from "@/lib/admin/metadata";
import { getPracticalAdmin } from "@/lib/admin/queries";
import { isUuid } from "@/lib/validation";

export const generateMetadata = adminMetadata("Practical editor");

export default async function PracticalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = isUuid(id) ? await getPracticalAdmin(id) : null;
  if (!data) notFound();
  const { practical, videos } = data;
  const subject = practical.subjects;

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
            { label: `Practical ${practical.number}` },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl">
            {practical.number}. {practical.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <FlagToggle
              table="practicals"
              id={practical.id}
              value={practical.is_published}
              label={`Practical ${practical.number}`}
            />
            <Link
              href={`/subjects/${subject.id}/practicals/${practical.number}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Eye aria-hidden="true" />
              View on site
            </Link>
          </div>
        </div>
      </div>

      <AdminVideoList videos={videos} parent={{ field: "practical_id", id: practical.id }} />

      <AdminSection title="Practical details">
        <ActionForm action={savePractical} className="max-w-2xl">
          <input type="hidden" name="id" value={practical.id} />
          <input type="hidden" name="subject_id" value={practical.subject_id} />
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <TextField
              name="number"
              label="Number"
              type="number"
              min={1}
              max={99}
              defaultValue={practical.number}
            />
            <TextField name="title" label="Title" defaultValue={practical.title} />
          </div>
          <CheckboxField
            name="is_published"
            label="Published"
            defaultChecked={practical.is_published}
          />
        </ActionForm>
        <div className="border-t pt-4">
          <p className="mb-2 text-sm text-muted-foreground">
            Deleting a practical also deletes its videos, including the files on the video provider.
          </p>
          <DeleteButton
            action={deletePractical}
            fields={{ id: practical.id }}
            what={`Practical ${practical.number} and its videos`}
          />
        </div>
      </AdminSection>
    </>
  );
}
