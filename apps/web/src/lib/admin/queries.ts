import "server-only";
import { PDF_DOCUMENT_KINDS } from "@/lib/pdf-documents";
import { createClient } from "@/lib/supabase/server";

/** Admin reads go through the admin's own session; RLS (admin_all) returns drafts too. */
function must<T>(
  result: { data: T; error: { message: string } | null },
  what: string,
): NonNullable<T> {
  if (result.error) throw new Error(`Failed to load ${what}: ${result.error.message}`);
  if (result.data === null) throw new Error(`Failed to load ${what}: not found`);
  return result.data as NonNullable<T>;
}

export async function getAdminCounts() {
  const supabase = await createClient();
  const total = (result: { count: number | null; error: { message: string } | null }) => {
    if (result.error) throw new Error(result.error.message);
    return result.count ?? 0;
  };
  const head = { count: "exact", head: true } as const;
  const [users, subjects, modules, questions, draftQuestions, videos, draftModules] = (
    await Promise.all([
      supabase.from("profiles").select("id", head),
      supabase.from("subjects").select("id", head),
      supabase.from("modules").select("id", head),
      supabase.from("questions").select("id", head),
      supabase.from("questions").select("id", head).eq("is_published", false),
      supabase.from("videos").select("id", head),
      supabase.from("modules").select("id", head).eq("is_published", false),
    ])
  ).map(total) as [number, number, number, number, number, number, number];
  return { users, subjects, modules, questions, draftQuestions, videos, draftModules };
}

export async function getCatalogTree() {
  const supabase = await createClient();
  return must(
    await supabase
      .from("colleges")
      .select(
        "id, name, short_code, branches(id, name, code, syllabus_versions(id, label, is_current, subjects(count)))",
      )
      .order("name")
      .order("name", { referencedTable: "branches" })
      .order("label", { referencedTable: "branches.syllabus_versions" }),
    "catalog",
  );
}

export async function getSyllabusAdmin(id: string) {
  const supabase = await createClient();
  const [syllabus, subjects] = await Promise.all([
    supabase
      .from("syllabus_versions")
      .select("id, label, is_current, branches!inner(id, name, code, colleges!inner(id, name))")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("id, code, name, semester, is_published, modules(count)")
      .eq("syllabus_version_id", id)
      .order("semester")
      .order("sort_order"),
  ]);
  if (syllabus.error) throw new Error(syllabus.error.message);
  if (!syllabus.data) return null;
  return { syllabus: syllabus.data, subjects: must(subjects, "subjects") };
}

export async function getSubjectAdmin(id: string) {
  const supabase = await createClient();
  const [subject, modules, crossModule] = await Promise.all([
    supabase
      .from("subjects")
      .select(
        "id, code, name, description, semester, is_published, syllabus_version_id, syllabus_versions!inner(id, label, branches!inner(name))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("modules")
      .select(
        "id, number, title, is_free_preview, is_published, videos(count), formula_cards(count), questions(count), documents(kind)",
      )
      .eq("subject_id", id)
      .order("sort_order")
      .order("number"),
    supabase
      .from("questions")
      .select("id, kind, question_md, marks, sessions, frequency, is_published")
      .eq("subject_id", id)
      .is("module_id", null)
      .order("kind")
      .order("sort_order"),
  ]);
  if (subject.error) throw new Error(subject.error.message);
  if (!subject.data) return null;
  return {
    subject: subject.data,
    modules: must(modules, "modules"),
    crossModule: must(crossModule, "questions"),
  };
}

export async function getModuleAdmin(id: string) {
  const supabase = await createClient();
  const { data: mod, error } = await supabase
    .from("modules")
    .select(
      "id, number, title, is_free_preview, is_published, subject_id, subjects!inner(id, code, name, syllabus_version_id, syllabus_versions!inner(id, label))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mod;
}

export async function getModuleContentAdmin(moduleId: string) {
  const supabase = await createClient();
  const [videos, documents, cards, questions] = await Promise.all([
    supabase
      .from("videos")
      .select(
        "id, title, provider, provider_video_id, duration_sec, chapters, processing_status, is_published",
      )
      .eq("module_id", moduleId)
      .order("sort_order"),
    supabase
      .from("documents")
      .select("id, kind, title, content_md, pdf_path, version, is_published, updated_at")
      .eq("module_id", moduleId)
      .in("kind", PDF_DOCUMENT_KINDS),
    supabase
      .from("formula_cards")
      .select("id, title, formula_latex, symbols, when_to_use, is_published")
      .eq("module_id", moduleId)
      .order("sort_order"),
    supabase
      .from("questions")
      .select("id, kind, question_md, marks, sessions, frequency, is_published")
      .eq("module_id", moduleId)
      .order("sort_order"),
  ]);
  return {
    videos: must(videos, "videos"),
    documents: must(documents, "documents"),
    cards: must(cards, "formula cards"),
    questions: must(questions, "questions"),
  };
}

export async function getQuestionAdmin(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, subject_id, module_id, kind, question_md, answer_md, marks, sessions, frequency, is_published",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getSubjectForQuestions(subjectId: string) {
  const supabase = await createClient();
  const [subject, modules] = await Promise.all([
    supabase.from("subjects").select("id, code, name").eq("id", subjectId).maybeSingle(),
    supabase
      .from("modules")
      .select("id, number, title")
      .eq("subject_id", subjectId)
      .order("number"),
  ]);
  if (subject.error) throw new Error(subject.error.message);
  if (!subject.data) return null;
  return { subject: subject.data, modules: must(modules, "modules") };
}
