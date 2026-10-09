import { notFound } from "next/navigation";
import { ActionForm, CheckboxField, SelectField, TextField } from "@/components/admin/action-form";
import { Breadcrumbs } from "@/components/admin/admin-ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { deleteContent, saveQuestion } from "@/lib/admin/actions";
import { getQuestionAdmin, getSubjectForQuestions } from "@/lib/admin/queries";
import { isUuid } from "@/lib/validation";
import { adminMetadata } from "@/lib/admin/metadata";

export const generateMetadata = adminMetadata("Question");

const KIND_OPTIONS = [
  { value: "pyq", label: "Previous-year question (PYQ)" },
  { value: "important", label: "Important question" },
  { value: "viva", label: "Viva question" },
];

const FREQUENCY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "very_frequent", label: "Very frequent" },
  { value: "frequent", label: "Frequent" },
  { value: "sometimes", label: "Sometimes" },
];

export default async function QuestionEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subject?: string; module?: string; kind?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const isNew = id === "new";

  const question = isNew ? null : isUuid(id) ? await getQuestionAdmin(id) : null;
  if (!isNew && !question) notFound();

  const subjectId = question?.subject_id ?? query.subject ?? "";
  const data = isUuid(subjectId) ? await getSubjectForQuestions(subjectId) : null;
  if (!data) notFound();

  const moduleId =
    question?.module_id ?? (query.module && isUuid(query.module) ? query.module : "");
  const kind = question?.kind ?? KIND_OPTIONS.find((o) => o.value === query.kind)?.value ?? "pyq";
  const mod = data.modules.find((m) => m.id === moduleId);
  const backHref = mod
    ? `/admin/modules/${mod.id}?tab=questions`
    : `/admin/subjects/${data.subject.id}`;

  return (
    <>
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { href: "/admin/catalog", label: "Catalog" },
            { href: `/admin/subjects/${data.subject.id}`, label: data.subject.name },
            ...(mod ? [{ href: backHref, label: `Module ${mod.number}` }] : []),
            { label: isNew ? "New question" : "Edit question" },
          ]}
        />
        <h1 className="text-3xl">{isNew ? "New question" : "Edit question"}</h1>
      </div>

      <ActionForm action={saveQuestion} submitLabel={isNew ? "Add question" : "Save question"}>
        {question ? <input type="hidden" name="id" value={question.id} /> : null}
        <input type="hidden" name="subject_id" value={data.subject.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="kind" label="Type" options={KIND_OPTIONS} defaultValue={kind} />
          <SelectField
            name="module_id"
            label="Module"
            defaultValue={moduleId}
            options={[
              { value: "", label: "Spans several modules" },
              ...data.modules.map((m) => ({ value: m.id, label: `${m.number}. ${m.title}` })),
            ]}
          />
        </div>
        <MarkdownEditor
          name="question_md"
          label="Question"
          defaultValue={question?.question_md ?? ""}
          rows={6}
        />
        <MarkdownEditor
          name="answer_md"
          label="Answer"
          defaultValue={question?.answer_md ?? ""}
          rows={14}
          hint="Shown behind “Show answer”. Add exam tips and common mistakes as callouts."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            name="marks"
            label="Marks"
            type="number"
            min={1}
            max={100}
            defaultValue={question?.marks ?? ""}
          />
          <TextField
            name="sessions"
            label="Exam sessions"
            placeholder="May 2024; Dec 2023"
            hint="Separate with semicolons."
            defaultValue={question?.sessions.join("; ") ?? ""}
          />
          <SelectField
            name="frequency"
            label="How often it's asked"
            options={FREQUENCY_OPTIONS}
            defaultValue={question?.frequency ?? ""}
          />
        </div>
        <CheckboxField
          name="is_published"
          label="Published"
          defaultChecked={question?.is_published ?? false}
        />
      </ActionForm>

      {question ? (
        <div className="border-t pt-4">
          <DeleteButton
            action={deleteContent}
            fields={{ table: "questions", id: question.id }}
            what="this question"
          />
        </div>
      ) : null}
    </>
  );
}
