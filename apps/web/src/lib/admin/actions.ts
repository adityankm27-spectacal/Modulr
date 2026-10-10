"use server";

import { z } from "zod";
import { getViewer, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validateQuestionImport, type ImportValidation } from "@/lib/question-import";
import { configuredProviderName, getVideoProvider } from "@/lib/video";
import { PDF_DOCUMENT_KINDS } from "@/lib/pdf-documents";
import { providerChaptersUpdate } from "@/lib/video/chapters";
import type { UploadTarget } from "@/lib/video/types";
import { AdminError, check, runAdminAction } from "./action";
import type { ActionState } from "./state";
import {
  branchSchema,
  checkbox,
  collegeSchema,
  documentSchema,
  formulaCardSchema,
  idSchema,
  moduleSchema,
  PUBLISHABLE,
  questionSchema,
  REORDERABLE,
  subjectSchema,
  syllabusSchema,
  videoSchema,
} from "./schemas";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Fails with a clear message when an update or delete matched no row. */
function mustAffect<T>(rows: T[] | null, what: string): T {
  const row = rows?.[0];
  if (!row) throw new AdminError(`That ${what} no longer exists. Reload the page.`);
  return row;
}

async function assertEmpty(
  supabase: Supabase,
  checks: {
    table:
      | "branches"
      | "syllabus_versions"
      | "subjects"
      | "modules"
      | "questions"
      | "videos"
      | "documents"
      | "formula_cards"
      | "topics";
    column: string;
    id: string;
    label: string;
  }[],
) {
  for (const c of checks) {
    const { count, error } = await supabase
      .from(c.table)
      .select("id", { count: "exact", head: true })
      .eq(c.column, c.id);
    check(error);
    if (count) {
      throw new AdminError(`Remove its ${c.label} first (${count} left). Nothing was deleted.`);
    }
  }
}

// --- Colleges, branches, syllabus versions ----------------------------------

export async function saveCollege(_: ActionState, form: FormData) {
  return runAdminAction(form, collegeSchema, async ({ id, ...values }, supabase) => {
    const values_ = { ...values, short_code: values.short_code.toUpperCase() };
    if (id) {
      const { data, error } = await supabase
        .from("colleges")
        .update(values_)
        .eq("id", id)
        .select("id");
      check(error);
      mustAffect(data, "college");
      return "College saved";
    }
    check((await supabase.from("colleges").insert(values_)).error);
    return "College added";
  });
}

export async function deleteCollege(_: ActionState, form: FormData) {
  return runAdminAction(form, idSchema, async ({ id }, supabase) => {
    await assertEmpty(supabase, [
      { table: "branches", column: "college_id", id, label: "branches" },
    ]);
    const { data, error } = await supabase.from("colleges").delete().eq("id", id).select("id");
    check(error);
    mustAffect(data, "college");
    return "College deleted";
  });
}

export async function saveBranch(_: ActionState, form: FormData) {
  return runAdminAction(form, branchSchema, async ({ id, ...values }, supabase) => {
    const values_ = { ...values, code: values.code.toUpperCase() };
    if (id) {
      const { data, error } = await supabase
        .from("branches")
        .update(values_)
        .eq("id", id)
        .select("id");
      check(error);
      mustAffect(data, "branch");
      return "Branch saved";
    }
    check((await supabase.from("branches").insert(values_)).error);
    return "Branch added";
  });
}

export async function deleteBranch(_: ActionState, form: FormData) {
  return runAdminAction(form, idSchema, async ({ id }, supabase) => {
    await assertEmpty(supabase, [
      { table: "syllabus_versions", column: "branch_id", id, label: "syllabus versions" },
    ]);
    const { data, error } = await supabase.from("branches").delete().eq("id", id).select("id");
    check(error);
    mustAffect(data, "branch");
    return "Branch deleted";
  });
}

export async function saveSyllabus(_: ActionState, form: FormData) {
  return runAdminAction(form, syllabusSchema, async ({ id, ...values }, supabase) => {
    // Only one current syllabus per branch: clear the flag elsewhere first.
    if (values.is_current) {
      let clear = supabase
        .from("syllabus_versions")
        .update({ is_current: false })
        .eq("branch_id", values.branch_id)
        .eq("is_current", true);
      if (id) clear = clear.neq("id", id);
      check((await clear).error);
    }
    if (id) {
      const { data, error } = await supabase
        .from("syllabus_versions")
        .update(values)
        .eq("id", id)
        .select("id");
      check(error);
      mustAffect(data, "syllabus version");
      return "Syllabus version saved";
    }
    check((await supabase.from("syllabus_versions").insert(values)).error);
    return "Syllabus version added";
  });
}

export async function deleteSyllabus(_: ActionState, form: FormData) {
  return runAdminAction(form, idSchema, async ({ id }, supabase) => {
    await assertEmpty(supabase, [
      { table: "subjects", column: "syllabus_version_id", id, label: "subjects" },
    ]);
    const { data, error } = await supabase
      .from("syllabus_versions")
      .delete()
      .eq("id", id)
      .select("id");
    check(error);
    mustAffect(data, "syllabus version");
    return "Syllabus version deleted";
  });
}

// --- Subjects and modules ----------------------------------------------------

export async function saveSubject(_: ActionState, form: FormData) {
  return runAdminAction(form, subjectSchema, async ({ id, ...values }, supabase) => {
    if (id) {
      const { data, error } = await supabase
        .from("subjects")
        .update(values)
        .eq("id", id)
        .select("id");
      check(error);
      mustAffect(data, "subject");
      return "Subject saved";
    }
    const { count } = await supabase
      .from("subjects")
      .select("id", { count: "exact", head: true })
      .eq("syllabus_version_id", values.syllabus_version_id);
    check(
      (await supabase.from("subjects").insert({ ...values, sort_order: (count ?? 0) + 1 })).error,
    );
    return "Subject added";
  });
}

export async function deleteSubject(_: ActionState, form: FormData) {
  return runAdminAction(form, idSchema, async ({ id }, supabase) => {
    await assertEmpty(supabase, [
      { table: "modules", column: "subject_id", id, label: "modules" },
      { table: "questions", column: "subject_id", id, label: "questions" },
    ]);
    const { data, error } = await supabase.from("subjects").delete().eq("id", id).select("id");
    check(error);
    mustAffect(data, "subject");
    return "Subject deleted";
  });
}

export async function saveModule(_: ActionState, form: FormData) {
  return runAdminAction(
    form,
    moduleSchema,
    async ({ id, is_free_preview, ...values }, supabase) => {
      const free =
        is_free_preview === "yes" || is_free_preview === "on"
          ? true
          : is_free_preview === "no"
            ? false
            : undefined;
      if (id) {
        const { data, error } = await supabase
          .from("modules")
          .update({ ...values, is_free_preview: free ?? false })
          .eq("id", id)
          .select("id");
        check(error);
        mustAffect(data, "module");
        return "Module saved";
      }
      const { count } = await supabase
        .from("modules")
        .select("id", { count: "exact", head: true })
        .eq("subject_id", values.subject_id);
      // Omitting is_free_preview lets the database apply the default from app_settings.
      const insert =
        free === undefined
          ? { ...values, sort_order: (count ?? 0) + 1 }
          : { ...values, sort_order: (count ?? 0) + 1, is_free_preview: free };
      check(
        (
          await supabase
            .from("modules")
            .insert(insert as typeof insert & { is_free_preview: boolean })
        ).error,
      );
      return "Module added";
    },
  );
}

export async function deleteModule(_: ActionState, form: FormData) {
  return runAdminAction(form, idSchema, async ({ id }, supabase) => {
    await assertEmpty(supabase, [
      { table: "videos", column: "module_id", id, label: "videos" },
      { table: "documents", column: "module_id", id, label: "notes and formula sheet" },
      { table: "formula_cards", column: "module_id", id, label: "formula cards" },
      { table: "questions", column: "module_id", id, label: "questions" },
      { table: "topics", column: "module_id", id, label: "topics" },
    ]);
    const { data, error } = await supabase.from("modules").delete().eq("id", id).select("id");
    check(error);
    mustAffect(data, "module");
    return "Module deleted";
  });
}

// --- Generic toggles and ordering -------------------------------------------

const flagSchema = z.object({
  table: z.enum(PUBLISHABLE),
  id: z.uuid(),
  field: z.enum(["is_published", "is_free_preview"]),
  value: checkbox,
});

/** Publish/unpublish any content row, or toggle a module's free preview. */
export async function setFlag(_: ActionState, form: FormData) {
  return runAdminAction(form, flagSchema, async ({ table, id, field, value }, supabase) => {
    if (field === "is_free_preview" && table !== "modules") {
      throw new AdminError("Only modules have a free preview.");
    }
    const { data, error } = await supabase
      .from(table)
      .update({ [field]: value } as { is_published: boolean })
      .eq("id", id)
      .select("id");
    check(error);
    mustAffect(data, "item");
    if (field === "is_free_preview") return value ? "Now a free preview" : "No longer free";
    return value ? "Published" : "Unpublished";
  });
}

const reorderSchema = z.object({
  table: z.enum(REORDERABLE),
  ids: z.array(z.uuid()).min(1).max(500),
});

export async function reorder(table: string, ids: string[]): Promise<ActionState> {
  return runAdminAction({ table, ids }, reorderSchema, async (data, supabase) => {
    check((await supabase.rpc("reorder_items", { p_table: data.table, p_ids: data.ids })).error);
    return "Order saved";
  });
}

// --- Module content ------------------------------------------------------------

export async function saveVideo(_: ActionState, form: FormData) {
  return runAdminAction(form, videoSchema, async ({ id, duration: _d, ...values }, supabase) => {
    if (id) {
      const { data, error } = await supabase
        .from("videos")
        .update(values)
        .eq("id", id)
        .select("provider, provider_video_id");
      check(error);
      const row = mustAffect(data, "video");
      // Keep the provider's own player (chapters menu, title) in sync. Best effort.
      if (row.provider_video_id && row.provider !== "dev") {
        try {
          await getVideoProvider(row.provider).updateMetadata(row.provider_video_id, {
            title: values.title,
            chapters: values.chapters,
            durationSec: values.duration_sec,
          });
        } catch (error) {
          console.error(error);
          return "Saved. (Couldn't update the chapters on the video provider; they still show on Modulr.)";
        }
      }
      return "Video saved";
    }
    const { count } = await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("module_id", values.module_id);
    check(
      (
        await supabase
          .from("videos")
          .insert({ ...values, provider: configuredProviderName(), sort_order: (count ?? 0) + 1 })
      ).error,
    );
    return "Video added. Now upload the file.";
  });
}

const uploadStart = z.object({
  videoId: z.uuid(),
  fileName: z.string().min(1).max(300),
  fileType: z.string().max(100),
  fileSize: z.number().int().positive(),
});

export type StartUploadResult =
  { status: "ok"; target: UploadTarget } | { status: "error"; message: string };

/**
 * Starts an upload: creates the video on the provider if needed and returns a
 * short-lived upload target for the admin's browser. Saves the provider id first
 * so an interrupted upload can be resumed against the same video.
 */
export async function startVideoUpload(
  input: z.infer<typeof uploadStart>,
): Promise<StartUploadResult> {
  const out: { target?: UploadTarget } = {};
  const result = await runAdminAction(
    input,
    uploadStart,
    async ({ videoId, fileName, fileType }, supabase) => {
      if (!fileType.startsWith("video/"))
        throw new AdminError("Choose a video file (MP4, MOV or WebM).");
      const { data: video, error } = await supabase
        .from("videos")
        .select("id, title, provider, provider_video_id")
        .eq("id", videoId)
        .maybeSingle();
      check(error);
      if (!video) throw new AdminError("That video no longer exists. Reload the page.");

      const providerName = video.provider_video_id ? video.provider : configuredProviderName();
      const provider = getVideoProvider(providerName);
      let providerVideoId = video.provider_video_id;
      if (!providerVideoId) {
        providerVideoId = await provider.createVideo(video.title);
        check(
          (
            await supabase
              .from("videos")
              .update({
                provider: providerName,
                provider_video_id: providerVideoId,
                processing_status: "uploading",
              })
              .eq("id", videoId)
          ).error,
        );
      } else {
        check(
          (
            await supabase
              .from("videos")
              .update({ processing_status: "uploading" })
              .eq("id", videoId)
          ).error,
        );
      }
      out.target = await provider.createUpload(providerVideoId, { name: fileName, type: fileType });
      return "Uploading";
    },
  );
  if (result.status === "ok" && out.target) return { status: "ok", target: out.target };
  return { status: "error", message: result.message ?? "Couldn't start the upload." };
}

const uploadDone = z.object({
  videoId: z.uuid(),
  durationSec: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60)
    .nullable(),
});

/** Called by the browser after the bytes are uploaded; then checks the provider's status. */
export async function finishVideoUpload(input: z.infer<typeof uploadDone>): Promise<ActionState> {
  return runAdminAction(input, uploadDone, async ({ videoId, durationSec }, supabase) => {
    const { data: video, error } = await supabase
      .from("videos")
      .select("provider, provider_video_id, duration_sec, chapters")
      .eq("id", videoId)
      .maybeSingle();
    check(error);
    if (!video?.provider_video_id) throw new AdminError("Upload not found. Try again.");
    const status = await getVideoProvider(video.provider).getStatus(video.provider_video_id);
    const processing = status.status === "pending" ? "processing" : status.status;
    check(
      (
        await supabase
          .from("videos")
          .update({
            processing_status: processing,
            duration_sec: status.durationSec ?? durationSec ?? video.duration_sec,
            ...(status.thumbnailUrl ? { thumbnail_url: status.thumbnailUrl } : {}),
            ...providerChaptersUpdate(video.chapters, status),
          })
          .eq("id", videoId)
      ).error,
    );
    return processing === "ready"
      ? "Uploaded and ready"
      : "Uploaded. The provider is processing it now.";
  });
}

/** Re-reads processing status, duration and thumbnail from the provider. */
export async function refreshVideoStatus(_: ActionState, form: FormData) {
  return runAdminAction(form, idSchema, async ({ id }, supabase) => {
    const { data: video, error } = await supabase
      .from("videos")
      .select("provider, provider_video_id, duration_sec, chapters")
      .eq("id", id)
      .maybeSingle();
    check(error);
    if (!video?.provider_video_id)
      throw new AdminError("No file has been uploaded for this video yet.");
    const status = await getVideoProvider(video.provider).getStatus(video.provider_video_id);
    const chapterUpdate = providerChaptersUpdate(video.chapters, status);
    check(
      (
        await supabase
          .from("videos")
          .update({
            processing_status: status.status,
            duration_sec: status.durationSec ?? video.duration_sec,
            ...(status.thumbnailUrl ? { thumbnail_url: status.thumbnailUrl } : {}),
            ...chapterUpdate,
          })
          .eq("id", id)
      ).error,
    );
    return chapterUpdate.chapters
      ? `Status: ${status.status} · ${chapterUpdate.chapters.length} chapters added`
      : `Status: ${status.status}`;
  });
}

const pdfAttach = z.object({
  moduleId: z.uuid(),
  kind: z.enum(PDF_DOCUMENT_KINDS),
  // Uploaded by the admin's browser to notes/<module id>/<random uuid>.pdf.
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/, "Invalid file path."),
  title: z.string().trim().min(1).max(200),
});

/** Best effort: a leftover file is harmless (unreachable once no document points at it). */
async function removePdfFile(supabase: Supabase, path: string | null | undefined) {
  if (path) await supabase.storage.from("notes").remove([path]);
}

/**
 * Called after the browser uploaded a PDF to storage: attaches it to the module's
 * document of that kind (short notes, formula sheet or a question sheet), creating
 * it as a draft if needed. Any Markdown on the document is kept but hidden.
 */
export async function attachPdf(input: z.infer<typeof pdfAttach>): Promise<ActionState> {
  return runAdminAction(input, pdfAttach, async ({ moduleId, kind, path, title }, supabase) => {
    if (!path.startsWith(`${moduleId}/`))
      throw new AdminError("That file belongs to another module.");
    const { data: existing, error } = await supabase
      .from("documents")
      .select("id, pdf_path, is_published")
      .eq("module_id", moduleId)
      .eq("kind", kind)
      .maybeSingle();
    check(error);
    if (existing) {
      check(
        (await supabase.from("documents").update({ pdf_path: path }).eq("id", existing.id)).error,
      );
      if (existing.pdf_path !== path) await removePdfFile(supabase, existing.pdf_path);
      return existing.is_published
        ? "PDF attached. Students can see it now."
        : "PDF attached as a draft. Publish it to show it to students.";
    }
    check(
      (
        await supabase.from("documents").insert({
          module_id: moduleId,
          kind,
          title,
          content_md: "",
          pdf_path: path,
          is_published: false,
        })
      ).error,
    );
    return "PDF attached as a draft. Publish it to show it to students.";
  });
}

/** Detaches a document's PDF (any Markdown shows again) and deletes the file. */
export async function removePdf(_: ActionState, form: FormData) {
  return runAdminAction(form, idSchema, async ({ id }, supabase) => {
    const { data: doc, error } = await supabase
      .from("documents")
      .select("pdf_path")
      .eq("id", id)
      .maybeSingle();
    check(error);
    if (!doc) throw new AdminError("Document not found. Reload the page.");
    check((await supabase.from("documents").update({ pdf_path: null }).eq("id", id)).error);
    await removePdfFile(supabase, doc.pdf_path);
    return "PDF removed.";
  });
}

export async function saveDocument(_: ActionState, form: FormData) {
  return runAdminAction(form, documentSchema, async ({ id, version, ...values }, supabase) => {
    if (id) {
      // Only save if nobody else changed it since this editor loaded it.
      let update = supabase.from("documents").update(values).eq("id", id);
      if (version !== null) update = update.eq("version", version);
      const { data, error } = await update.select("id");
      check(error);
      if (!data?.length) {
        throw new AdminError(
          "Someone else saved this document after you opened it. Copy your text somewhere safe, reload the page, and apply your changes again.",
        );
      }
      return "Saved";
    }
    check((await supabase.from("documents").insert(values)).error);
    return "Saved";
  });
}

export async function saveFormulaCard(_: ActionState, form: FormData) {
  return runAdminAction(form, formulaCardSchema, async ({ id, ...values }, supabase) => {
    if (id) {
      const { data, error } = await supabase
        .from("formula_cards")
        .update(values)
        .eq("id", id)
        .select("id");
      check(error);
      mustAffect(data, "formula card");
      return "Formula card saved";
    }
    const { count } = await supabase
      .from("formula_cards")
      .select("id", { count: "exact", head: true })
      .eq("module_id", values.module_id);
    check(
      (await supabase.from("formula_cards").insert({ ...values, sort_order: (count ?? 0) + 1 }))
        .error,
    );
    return "Formula card added";
  });
}

export async function saveQuestion(_: ActionState, form: FormData) {
  return runAdminAction(form, questionSchema, async ({ id, ...values }, supabase) => {
    if (values.module_id) {
      const { data } = await supabase
        .from("modules")
        .select("id")
        .eq("id", values.module_id)
        .eq("subject_id", values.subject_id)
        .maybeSingle();
      if (!data)
        throw new AdminError("That module isn't part of this subject.", {
          module_id: "Choose a module from this subject.",
        });
    }
    if (id) {
      const { data, error } = await supabase
        .from("questions")
        .update(values)
        .eq("id", id)
        .select("id");
      check(error);
      mustAffect(data, "question");
      return "Question saved";
    }
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", values.subject_id)
      .eq("kind", values.kind);
    check(
      (await supabase.from("questions").insert({ ...values, sort_order: (count ?? 0) + 1 })).error,
    );
    return {
      message: "Question added",
      redirectTo: values.module_id
        ? `/admin/modules/${values.module_id}?tab=questions`
        : `/admin/subjects/${values.subject_id}`,
    };
  });
}

const deletableContent = z.object({
  table: z.enum(["videos", "documents", "formula_cards", "questions"]),
  id: z.uuid(),
});

export async function deleteContent(_: ActionState, form: FormData) {
  return runAdminAction(form, deletableContent, async ({ table, id }, supabase) => {
    if (table === "videos") {
      const { data } = await supabase
        .from("videos")
        .select("provider, provider_video_id")
        .eq("id", id)
        .maybeSingle();
      if (data?.provider_video_id) {
        try {
          await getVideoProvider(data.provider).deleteVideo(data.provider_video_id);
        } catch (error) {
          // Don't block removing it from Modulr; the provider copy can be cleaned up by hand.
          console.error(error);
        }
      }
    }
    const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
    check(error);
    mustAffect(data, "item");
    return "Deleted";
  });
}

// --- CSV import --------------------------------------------------------------------

async function importContext(supabase: Supabase, subjectId: string) {
  const [modules, existing] = await Promise.all([
    supabase.from("modules").select("id, number").eq("subject_id", subjectId),
    supabase.from("questions").select("kind, question_md").eq("subject_id", subjectId),
  ]);
  check(modules.error);
  check(existing.error);
  return { modules: modules.data ?? [], existing: existing.data ?? [] };
}

/** Validates an uploaded CSV and returns a per-row report. Saves nothing. */
export async function previewQuestionImport(
  subjectId: string,
  csvText: string,
): Promise<ImportValidation> {
  const viewer = await getViewer();
  if (!isAdmin(viewer) || !z.uuid().safeParse(subjectId).success) {
    return { fileErrors: ["You don't have permission to do that."], rows: [], validCount: 0 };
  }
  const supabase = await createClient();
  return validateQuestionImport(csvText, await importContext(supabase, subjectId));
}

const commitSchema = z.object({
  subjectId: z.uuid(),
  csvText: z.string(),
  publish: z.boolean(),
  skipInvalid: z.boolean(),
});

/** Re-validates on the server (never trusts the preview) and inserts all valid rows in one statement. */
export async function commitQuestionImport(
  input: z.infer<typeof commitSchema>,
): Promise<ActionState> {
  return runAdminAction(
    input,
    commitSchema,
    async ({ subjectId, csvText, publish, skipInvalid }, supabase) => {
      const result = validateQuestionImport(csvText, await importContext(supabase, subjectId));
      if (result.fileErrors.length) throw new AdminError(result.fileErrors.join(" "));
      const invalid = result.rows.length - result.validCount;
      if (invalid && !skipInvalid) {
        throw new AdminError(`${invalid} row(s) have problems. Fix them, or choose to skip them.`);
      }
      if (result.validCount === 0) throw new AdminError("There are no valid rows to import.");

      // Append after existing questions of the same kind.
      const { data: last } = await supabase
        .from("questions")
        .select("kind, sort_order")
        .eq("subject_id", subjectId);
      const next: Record<string, number> = {};
      for (const q of last ?? []) next[q.kind] = Math.max(next[q.kind] ?? 0, q.sort_order);

      const rows = result.rows.flatMap((r) =>
        r.value
          ? [
              {
                ...r.value,
                subject_id: subjectId,
                is_published: publish,
                sort_order: (next[r.value.kind] = (next[r.value.kind] ?? 0) + 1),
              },
            ]
          : [],
      );
      check((await supabase.from("questions").insert(rows)).error);
      return `Imported ${rows.length} question${rows.length === 1 ? "" : "s"}${invalid ? `, skipped ${invalid}` : ""}.`;
    },
  );
}
