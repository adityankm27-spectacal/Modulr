import { z } from "zod";

const uuid = z.uuid({ error: "Choose an option." });

/** Semesters students can currently pick. Widen this list as more content is published. */
export const AVAILABLE_SEMESTERS: readonly number[] = [3];

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your name (at least 2 characters).")
    .max(80, "Keep your name under 80 characters."),
  collegeId: uuid,
  branchId: uuid,
  semester: z.coerce
    .number({ error: "Choose your semester." })
    .int()
    .min(1, "Choose your semester.")
    .max(8, "Choose your semester.")
    .refine((n) => AVAILABLE_SEMESTERS.includes(n), "Only Semester 3 is open right now."),
});

export const onboardingSchema = profileSchema.extend({
  ageConfirmed: z.literal("on", {
    error: "Please confirm you are 18+ or have a parent's or guardian's consent.",
  }),
  consent: z.literal("on", { error: "Please accept the Terms and Privacy Policy to continue." }),
});

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function parseSemester(value: string | string[] | undefined): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 && n <= 8 ? n : null;
}

export function isUuid(value: string): boolean {
  return uuid.safeParse(value).success;
}
