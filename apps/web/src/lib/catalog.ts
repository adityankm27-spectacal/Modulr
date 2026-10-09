import "server-only";
import { resolveSettings, type AppSettings } from "@modulr/shared";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

// Both throw on query errors so they reach the route's error boundary instead of
// rendering as empty. They take the whole response so the success type is preserved.
function rows<R extends QueryResult>(result: R, what: string): NonNullable<R["data"]> {
  if (result.error) throw new Error(`Failed to load ${what}: ${result.error.message}`);
  return (result.data ?? []) as NonNullable<R["data"]>;
}

function maybe<R extends QueryResult>(result: R, what: string): R["data"] {
  if (result.error) throw new Error(`Failed to load ${what}: ${result.error.message}`);
  return result.data;
}

export const getSettings = cache(async (): Promise<AppSettings> => {
  const supabase = await createClient();
  const settingRows = rows(await supabase.from("app_settings").select("key, value"), "settings");
  return resolveSettings(settingRows);
});

export const getActivePlans = cache(async () => {
  const supabase = await createClient();
  return rows(
    await supabase
      .from("plans")
      .select("id, name, description, price_paise, interval, scope, validity_days")
      .eq("is_active", true)
      .order("sort_order")
      .order("price_paise"),
    "plans",
  );
});

export async function getCollegesWithBranches() {
  const supabase = await createClient();
  return rows(
    await supabase
      .from("colleges")
      .select("id, name, branches(id, name, code)")
      .order("name")
      .order("name", { referencedTable: "branches" }),
    "colleges",
  );
}

export async function getCurrentSyllabusVersion(branchId: string) {
  const supabase = await createClient();
  return maybe(
    await supabase
      .from("syllabus_versions")
      .select("id, label, branches(name, code)")
      .eq("branch_id", branchId)
      .eq("is_current", true)
      .maybeSingle(),
    "syllabus version",
  );
}

export async function getSubjectsForSemester(syllabusVersionId: string, semester: number) {
  const supabase = await createClient();
  return rows(
    await supabase
      .from("subjects")
      .select("id, code, name, description, modules(count)")
      .eq("syllabus_version_id", syllabusVersionId)
      .eq("semester", semester)
      .eq("is_published", true)
      .eq("modules.is_published", true)
      .order("sort_order"),
    "subjects",
  );
}

/** Every published subject with its syllabus context, for the public index and sitemap. */
export async function getPublishedSubjects() {
  const supabase = await createClient();
  return rows(
    await supabase
      .from("subjects")
      .select(
        "id, code, name, semester, updated_at, syllabus_versions!inner(label, is_current, branches!inner(name, code, colleges!inner(name)))",
      )
      .eq("is_published", true)
      .order("semester")
      .order("sort_order"),
    "subjects",
  );
}

export const getSubject = cache(async (subjectId: string) => {
  const supabase = await createClient();
  return maybe(
    await supabase
      .from("subjects")
      .select(
        "id, code, name, description, semester, syllabus_version_id, syllabus_versions!inner(label, branches!inner(name, code))",
      )
      .eq("id", subjectId)
      .eq("is_published", true)
      .maybeSingle(),
    "subject",
  );
});

export const getModules = cache(async (subjectId: string) => {
  const supabase = await createClient();
  return rows(
    await supabase
      .from("modules")
      .select("id, number, title, is_free_preview")
      .eq("subject_id", subjectId)
      .eq("is_published", true)
      .order("sort_order")
      .order("number"),
    "modules",
  );
});

export const getContentCounts = cache(async (subjectId: string) => {
  const supabase = await createClient();
  const countRows = rows(
    await supabase.rpc("module_content_counts", { p_subject: subjectId }),
    "content counts",
  );
  return new Map(countRows.map((row) => [row.module_id, row]));
});

export type ContentCounts = NonNullable<
  ReturnType<Awaited<ReturnType<typeof getContentCounts>>["get"]>
>;

/** Paid access to a whole subject (subscription, purchase, comp access, trial or admin). */
export const hasSubjectAccess = cache(async (userId: string, subjectId: string) => {
  const supabase = await createClient();
  const access = maybe(
    await supabase.rpc("has_subject_access", { p_user: userId, p_subject: subjectId }),
    "access",
  );
  return access === true;
});

/**
 * Content queries. Students only ever get published rows (`drafts: false`); RLS
 * additionally hides paid rows from unentitled users. Admins can read drafts via
 * RLS, so the explicit filter keeps the public pages truthful, and the
 * preview-as-student screen passes `drafts: true` to include them.
 */
interface ContentOptions {
  drafts?: boolean;
}

export async function getVideos(moduleId: string, { drafts = false }: ContentOptions = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("videos")
    .select("id, title, duration_sec, chapters, is_published, processing_status, thumbnail_url")
    .eq("module_id", moduleId)
    .order("sort_order");
  if (!drafts) query = query.eq("is_published", true);
  return rows(await query, "videos");
}

export async function getDocument(
  moduleId: string,
  kind: "short_notes" | "formula_sheet",
  { drafts = false }: ContentOptions = {},
) {
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select("id, title, content_md, updated_at, is_published")
    .eq("module_id", moduleId)
    .eq("kind", kind);
  if (!drafts) query = query.eq("is_published", true);
  return maybe(await query.maybeSingle(), "document");
}

export async function getFormulaCards(moduleId: string, { drafts = false }: ContentOptions = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("formula_cards")
    .select("id, title, formula_latex, symbols, when_to_use, is_published")
    .eq("module_id", moduleId)
    .order("sort_order");
  if (!drafts) query = query.eq("is_published", true);
  return rows(await query, "formula cards");
}

export async function getQuestions(
  moduleId: string,
  kind: "pyq" | "important" | "viva",
  { drafts = false }: ContentOptions = {},
) {
  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("id, question_md, answer_md, marks, sessions, frequency, is_published")
    .eq("module_id", moduleId)
    .eq("kind", kind)
    .order("sort_order");
  if (!drafts) query = query.eq("is_published", true);
  return rows(await query, "questions");
}

/** Questions that span several modules of a subject (module_id is null). Paid-only via RLS. */
export async function getCrossModuleQuestions(
  subjectId: string,
  kind: "pyq" | "important" | "viva",
  { drafts = false }: ContentOptions = {},
) {
  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("id, question_md, answer_md, marks, sessions, frequency, is_published")
    .eq("subject_id", subjectId)
    .is("module_id", null)
    .eq("kind", kind)
    .order("sort_order");
  if (!drafts) query = query.eq("is_published", true);
  return rows(await query, "questions");
}

export type QuestionRow = Awaited<ReturnType<typeof getQuestions>>[number];

/** The viewer's saved positions for a set of videos. */
export async function getWatchProgress(userId: string, videoIds: string[]) {
  if (videoIds.length === 0) return new Map<string, { position_sec: number; completed: boolean }>();
  const supabase = await createClient();
  const data = rows(
    await supabase
      .from("watch_progress")
      .select("video_id, position_sec, completed")
      .eq("user_id", userId)
      .in("video_id", videoIds),
    "progress",
  );
  return new Map(
    data.map((p) => [p.video_id, { position_sec: p.position_sec, completed: p.completed }]),
  );
}

/** Most recently watched, unfinished videos for the home page. RLS hides ones the viewer lost access to. */
export async function getContinueWatching(userId: string, limit = 3) {
  const supabase = await createClient();
  const data = rows(
    await supabase
      .from("watch_progress")
      .select(
        "position_sec, updated_at, videos!inner(id, title, duration_sec, is_published, modules!inner(number, title, is_published, subjects!inner(id, name, is_published)))",
      )
      .eq("user_id", userId)
      .eq("completed", false)
      .gt("position_sec", 0)
      .eq("videos.is_published", true)
      .eq("videos.modules.is_published", true)
      .eq("videos.modules.subjects.is_published", true)
      .order("updated_at", { ascending: false })
      .limit(limit),
    "continue watching",
  );
  return data.map((p) => ({
    videoId: p.videos.id,
    title: p.videos.title,
    position: p.position_sec,
    duration: p.videos.duration_sec,
    moduleNumber: p.videos.modules.number,
    moduleTitle: p.videos.modules.title,
    subjectId: p.videos.modules.subjects.id,
    subjectName: p.videos.modules.subjects.name,
  }));
}
