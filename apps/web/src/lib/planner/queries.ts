import "server-only";
import { MODULE_STEPS, type ModuleStep } from "@modulr/shared";
import { createClient } from "@/lib/supabase/server";
import { addDays, toISODate } from "./dates";
import type { PlannerData, PlannerEvent, PlannerSteps } from "./types";

/** Events are loaded for a window around today; the calendar pages through it locally. */
const PAST_DAYS = 120;
const FUTURE_DAYS = 400;

function must<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Failed to load ${what}: ${result.error.message}`);
  return result.data as T;
}

export async function getPlannerData(
  userId: string,
  profile: { college_id: string; branch_id: string; semester: number },
  subjects: ReadonlyArray<{ id: string; name: string }>,
): Promise<PlannerData> {
  const supabase = await createClient();
  const today = new Date();
  const from = toISODate(addDays(today, -PAST_DAYS));
  const to = toISODate(addDays(today, FUTURE_DAYS));

  // Row-level security already limits students to their own and their college's events;
  // the explicit filter also keeps admins (who can see every college) to their own view.
  const college =
    `and(college_id.eq.${profile.college_id},` +
    `or(branch_id.is.null,branch_id.eq.${profile.branch_id}),` +
    `or(semester.is.null,semester.eq.${profile.semester}))`;

  const [events, todos, stepRows, modules] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, kind, starts_on, ends_on, notes, user_id")
      .or(`user_id.eq.${userId},${college}`)
      .gte("starts_on", from)
      .lte("starts_on", to)
      .order("starts_on"),
    supabase
      .from("todos")
      .select("id, title, module_id, due_on, done_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("module_steps").select("module_id, step").eq("user_id", userId),
    subjects.length
      ? supabase
          .from("modules")
          .select("id, number, title, subject_id")
          .in(
            "subject_id",
            subjects.map((s) => s.id),
          )
          .eq("is_published", true)
          .order("number")
      : Promise.resolve({ data: [], error: null }),
  ]);

  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
  const steps: PlannerSteps = {};
  for (const row of must(stepRows, "checklist")) {
    if (!MODULE_STEPS.includes(row.step as ModuleStep)) continue;
    (steps[row.module_id] ??= []).push(row.step as ModuleStep);
  }

  return {
    events: must(events, "calendar").map((e): PlannerEvent => ({
      id: e.id,
      title: e.title,
      kind: e.kind,
      starts_on: e.starts_on,
      ends_on: e.ends_on,
      notes: e.notes,
      scope: e.user_id ? "personal" : "college",
    })),
    todos: must(todos, "to-dos").map((t) => ({
      id: t.id,
      title: t.title,
      module_id: t.module_id,
      due_on: t.due_on,
      done: t.done_at !== null,
    })),
    modules: must(modules, "modules").map((m) => ({
      id: m.id,
      number: m.number,
      title: m.title,
      subjectId: m.subject_id,
      subjectName: subjectName.get(m.subject_id) ?? "",
    })),
    steps,
  };
}
