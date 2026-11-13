"use server";

import { CALENDAR_EVENT_KINDS, MODULE_STEPS } from "@modulr/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { getBilling } from "@/lib/billing/queries";
import { createClient } from "@/lib/supabase/server";
import { canUsePlanner } from "./access";
import { parseISODate } from "./dates";
import type { PlannerResult } from "./types";

const fail = (error: string): PlannerResult => ({ ok: false, error });
const GENERIC = "Something went wrong. Please try again.";

const isoDay = z.string().refine((v) => parseISODate(v) !== null, "Choose a real date.");
const optionalDay = isoDay.nullish().transform((v) => v || null);

/** Signed-in subscribers only; every action re-checks because server actions are public endpoints. */
async function requirePlanner() {
  const viewer = await getViewer();
  if (!viewer?.profile) return null;
  const { hasSubscriptionAccess } = await getBilling(viewer.userId);
  const allowed = canUsePlanner({
    role: viewer.profile.role,
    compAccessUntil: viewer.profile.comp_access_until,
    hasSubscriptionAccess,
  });
  return allowed ? viewer.userId : null;
}

/** Runs one planner change for the signed-in subscriber and refreshes the home page. */
async function run<S extends z.ZodType>(
  input: unknown,
  schema: S,
  handler: (data: z.infer<S>, userId: string) => Promise<PlannerResult>,
): Promise<PlannerResult> {
  const userId = await requirePlanner();
  if (!userId) return fail("The planner is part of your subscription.");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check what you entered.");
  try {
    const result = await handler(parsed.data, userId);
    if (result.ok) revalidatePath("/home");
    return result;
  } catch (error) {
    console.error(error);
    return fail(GENERIC);
  }
}

const eventSchema = z
  .object({
    id: z.uuid().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Give it a title.")
      .max(120, "Keep the title under 120 characters."),
    kind: z.enum(CALENDAR_EVENT_KINDS),
    startsOn: isoDay,
    endsOn: optionalDay,
    notes: z.string().trim().max(500, "Keep notes under 500 characters.").optional(),
  })
  .refine((v) => !v.endsOn || v.endsOn >= v.startsOn, "The end date can't be before the start.");

export async function saveEvent(input: z.input<typeof eventSchema>) {
  return run(input, eventSchema, async (data, userId) => {
    const supabase = await createClient();
    const row = {
      title: data.title,
      kind: data.kind,
      starts_on: data.startsOn,
      ends_on: data.endsOn && data.endsOn !== data.startsOn ? data.endsOn : null,
      notes: data.notes || null,
    };
    if (data.id) {
      const { data: updated, error } = await supabase
        .from("calendar_events")
        .update(row)
        .eq("id", data.id)
        .eq("user_id", userId)
        .select("id");
      if (error) throw error;
      return updated.length ? { ok: true } : fail("That event no longer exists.");
    }
    const { error } = await supabase.from("calendar_events").insert({ ...row, user_id: userId });
    if (error) throw error;
    return { ok: true };
  });
}

export async function deleteEvent(input: { id: string }) {
  return run(input, z.object({ id: z.uuid() }), async ({ id }, userId) => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });
}

const todoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Write the task first.")
    .max(200, "Keep it under 200 characters."),
  moduleId: z
    .uuid()
    .nullish()
    .transform((v) => v || null),
  dueOn: optionalDay,
});

export async function addTodo(input: z.input<typeof todoSchema>) {
  return run(input, todoSchema, async (data, userId) => {
    const supabase = await createClient();
    if (data.moduleId) {
      // Row-level security only shows modules this student may see.
      const { data: module } = await supabase
        .from("modules")
        .select("id")
        .eq("id", data.moduleId)
        .maybeSingle();
      if (!module) return fail("That module isn't available.");
    }
    const { error } = await supabase.from("todos").insert({
      user_id: userId,
      title: data.title,
      module_id: data.moduleId,
      due_on: data.dueOn,
    });
    if (error) throw error;
    return { ok: true };
  });
}

export async function setTodoDone(input: { id: string; done: boolean }) {
  return run(input, z.object({ id: z.uuid(), done: z.boolean() }), async ({ id, done }, userId) => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("todos")
      .update({ done_at: done ? new Date().toISOString() : null })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });
}

export async function deleteTodo(input: { id: string }) {
  return run(input, z.object({ id: z.uuid() }), async ({ id }, userId) => {
    const supabase = await createClient();
    const { error } = await supabase.from("todos").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });
}

export async function setStep(input: { moduleId: string; step: string; done: boolean }) {
  const schema = z.object({
    moduleId: z.uuid(),
    step: z.enum(MODULE_STEPS),
    done: z.boolean(),
  });
  return run(input, schema, async ({ moduleId, step, done }, userId) => {
    const supabase = await createClient();
    if (done) {
      const { error } = await supabase
        .from("module_steps")
        .upsert(
          { user_id: userId, module_id: moduleId, step },
          { onConflict: "user_id,module_id,step", ignoreDuplicates: true },
        );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("module_steps")
        .delete()
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .eq("step", step);
      if (error) throw error;
    }
    return { ok: true };
  });
}
