import type { FieldErrors } from "@/lib/validation";

/** Result of an admin server action, shared by server actions and client forms. */
export interface ActionState {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
  /** Changes on every result so the UI can react to repeated identical results. */
  at?: number;
  /** Where the client should navigate after a successful create. */
  redirectTo?: string;
}

export const IDLE: ActionState = { status: "idle" };
