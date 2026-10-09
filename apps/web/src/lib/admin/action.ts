import "server-only";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getViewer, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, type FieldErrors } from "@/lib/validation";

import type { ActionState } from "./state";

export type { ActionState } from "./state";

/** Thrown by handlers for expected, user-facing failures. */
export class AdminError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
  }
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

const PG_MESSAGES: Record<string, string> = {
  "23505": "That already exists. Use a different code, number or name.",
  "23503": "It's still used elsewhere, so it can't be removed.",
  "23514": "That combination isn't allowed.",
  "42501": "You don't have permission to do that.",
};

/** Turns a Supabase/PostgREST error into an AdminError with a readable message. */
export function check(error: { code?: string; message: string } | null): void {
  if (!error) return;
  throw new AdminError(
    (error.code && PG_MESSAGES[error.code]) ||
      `The database rejected this change: ${error.message}`,
  );
}

/**
 * Runs an admin server action: re-checks the admin role (actions are public
 * endpoints), validates the form with zod, runs the handler with the user's own
 * Supabase client (so RLS applies), and revalidates cached pages.
 */
export async function runAdminAction<S extends z.ZodType>(
  input: FormData | Record<string, unknown>,
  schema: S,
  handler: (
    data: z.infer<S>,
    supabase: Supabase,
  ) => Promise<string | { message: string; redirectTo?: string } | undefined>,
): Promise<ActionState> {
  const viewer = await getViewer();
  if (!isAdmin(viewer)) {
    return { status: "error", message: "You don't have permission to do that.", at: Date.now() };
  }

  const raw = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
      at: Date.now(),
    };
  }

  try {
    const supabase = await createClient();
    const result = await handler(parsed.data, supabase);
    revalidatePath("/", "layout");
    const { message, redirectTo } =
      typeof result === "object" ? result : { message: result ?? "Saved", redirectTo: undefined };
    return { status: "ok", message, redirectTo, at: Date.now() };
  } catch (error) {
    if (error instanceof AdminError) {
      return {
        status: "error",
        message: error.message,
        fieldErrors: error.fieldErrors,
        at: Date.now(),
      };
    }
    console.error(error);
    return { status: "error", message: "Something went wrong. Please try again.", at: Date.now() };
  }
}
