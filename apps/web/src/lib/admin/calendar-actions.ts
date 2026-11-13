"use server";

import { z } from "zod";
import { getViewer, isAdmin } from "@/lib/auth";
import {
  MAX_CALENDAR_IMPORT_BYTES,
  validateCalendarImport,
  type CalendarImportValidation,
} from "@/lib/calendar-import";
import { AdminError, check, runAdminAction } from "./action";
import { idSchema } from "./schemas";
import type { ActionState } from "./state";

/** Validates an uploaded calendar file and returns a per-row report. Saves nothing. */
export async function previewCalendarImport(
  text: string,
  fileName: string,
): Promise<CalendarImportValidation> {
  if (!isAdmin(await getViewer())) {
    return { fileErrors: ["You don't have permission to do that."], rows: [], validCount: 0 };
  }
  if (text.length > MAX_CALENDAR_IMPORT_BYTES) {
    return { fileErrors: ["The file is larger than 1 MB."], rows: [], validCount: 0 };
  }
  return validateCalendarImport(text, fileName);
}

const commitSchema = z.object({
  collegeId: z.uuid({ error: "Choose a college." }),
  branchId: z.uuid().nullable(),
  semester: z.number().int().min(1).max(8).nullable(),
  text: z.string().max(MAX_CALENDAR_IMPORT_BYTES),
  fileName: z.string().max(200),
  skipInvalid: z.boolean(),
});

/** Re-validates on the server (never trusts the preview) and adds the events that aren't there yet. */
export async function commitCalendarImport(
  input: z.input<typeof commitSchema>,
): Promise<ActionState> {
  return runAdminAction(
    input,
    commitSchema,
    async ({ collegeId, branchId, semester, text, fileName, skipInvalid }, supabase) => {
      const result = validateCalendarImport(text, fileName);
      if (result.fileErrors.length) throw new AdminError(result.fileErrors.join(" "));
      const invalid = result.rows.length - result.validCount;
      if (invalid && !skipInvalid) {
        throw new AdminError(`${invalid} row(s) have problems. Fix them, or choose to skip them.`);
      }
      const valid = result.rows.flatMap((r) => (r.value ? [r.value] : []));
      if (valid.length === 0) throw new AdminError("There are no valid events to import.");

      // Importing the same file twice must not duplicate events.
      const dates = valid.map((v) => v.starts_on).sort();
      let existingQuery = supabase
        .from("calendar_events")
        .select("title, starts_on")
        .eq("college_id", collegeId)
        .gte("starts_on", dates[0] ?? "")
        .lte("starts_on", dates[dates.length - 1] ?? "");
      existingQuery = branchId
        ? existingQuery.eq("branch_id", branchId)
        : existingQuery.is("branch_id", null);
      existingQuery = semester
        ? existingQuery.eq("semester", semester)
        : existingQuery.is("semester", null);
      const { data: existing, error } = await existingQuery;
      check(error);

      const seen = new Set((existing ?? []).map((e) => `${e.title.toLowerCase()}|${e.starts_on}`));
      const fresh = valid.filter((event) => {
        const key = `${event.title.toLowerCase()}|${event.starts_on}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const already = valid.length - fresh.length;
      if (fresh.length === 0) {
        throw new AdminError("All of these events are already on the calendar.");
      }

      check(
        (
          await supabase.from("calendar_events").insert(
            fresh.map((event) => ({
              ...event,
              college_id: collegeId,
              branch_id: branchId,
              semester,
            })),
          )
        ).error,
      );
      const skipped = [
        invalid ? `${invalid} with problems` : "",
        already ? `${already} already added` : "",
      ].filter(Boolean);
      return `Imported ${fresh.length} event${fresh.length === 1 ? "" : "s"}${
        skipped.length ? `, skipped ${skipped.join(" and ")}` : ""
      }.`;
    },
  );
}

export async function deleteCalendarEvent(_: ActionState, form: FormData) {
  return runAdminAction(form, idSchema, async ({ id }, supabase) => {
    const { data, error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id)
      .not("college_id", "is", null)
      .select("id");
    check(error);
    if (!data?.length) throw new AdminError("That event no longer exists. Reload the page.");
    return "Event deleted";
  });
}
