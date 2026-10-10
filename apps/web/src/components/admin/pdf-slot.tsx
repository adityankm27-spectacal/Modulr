import { ActionForm } from "@/components/admin/action-form";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { PdfUpload } from "@/components/admin/pdf-upload";
import { removePdf } from "@/lib/admin/actions";
import { PDF_LABELS, type PdfDocumentKind } from "@/lib/pdf-documents";

/**
 * Upload / replace / remove the PDF for one module tab. `showPublish` adds a Published
 * switch for PDF-only documents (question sheets); notes and formula sheets publish
 * through their own form, so they don't get a second switch.
 */
export function PdfSlot({
  moduleId,
  moduleTitle,
  kind,
  doc,
  hint,
  showPublish = false,
}: {
  moduleId: string;
  moduleTitle: string;
  kind: PdfDocumentKind;
  doc: { id: string; title: string; pdf_path: string | null; is_published: boolean } | undefined;
  hint: string;
  showPublish?: boolean;
}) {
  const label = PDF_LABELS[kind];
  return (
    <div className="space-y-3">
      <PdfUpload
        moduleId={moduleId}
        kind={kind}
        title={doc?.title ?? `${label}: ${moduleTitle}`}
        hasPdf={Boolean(doc?.pdf_path)}
        hint={hint}
      />
      {doc?.pdf_path ? (
        <div className="flex flex-wrap items-center gap-3">
          {showPublish ? (
            <FlagToggle table="documents" id={doc.id} value={doc.is_published} label={label} />
          ) : null}
          <ActionForm
            action={removePdf}
            submitLabel="Remove PDF"
            submitVariant="outline"
            confirm={`Remove the ${label.toLowerCase()} PDF? Students will no longer see it.`}
          >
            <input type="hidden" name="id" value={doc.id} />
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}
