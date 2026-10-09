"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { safeNextPath, signInPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, onboardingSchema, profileSchema, type FieldErrors } from "@/lib/validation";

export interface ProfileFormValues {
  fullName: string;
  collegeId: string;
  branchId: string;
  semester: string;
  ageConfirmed?: boolean;
  consent?: boolean;
}

export interface ProfileFormState {
  errors: FieldErrors;
  values: ProfileFormValues | null;
  saved: boolean;
}

function readValues(formData: FormData): ProfileFormValues {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    fullName: text("fullName"),
    collegeId: text("collegeId"),
    branchId: text("branchId"),
    semester: text("semester"),
    ageConfirmed: formData.get("ageConfirmed") === "on",
    consent: formData.get("consent") === "on",
  };
}

const BRANCH_MISMATCH = "23514";
const GENERIC_ERROR = "Something went wrong saving your details. Please try again.";

export async function completeOnboarding(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const viewer = await getViewer();
  if (!viewer) redirect(signInPath("/onboarding"));

  const values = readValues(formData);
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values, saved: false };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      college_id: parsed.data.collegeId,
      branch_id: parsed.data.branchId,
      semester: parsed.data.semester,
      age_confirmed_at: viewer.profile?.age_confirmed_at ?? now,
      consent_accepted_at: viewer.profile?.consent_accepted_at ?? now,
      onboarded_at: viewer.profile?.onboarded_at ?? now,
    })
    .eq("id", viewer.userId);

  if (error) {
    const errors =
      error.code === BRANCH_MISMATCH
        ? { branchId: "That branch isn't offered at the selected college." }
        : { form: GENERIC_ERROR };
    return { errors, values, saved: false };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")?.toString()));
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const viewer = await getViewer();
  if (!viewer) redirect(signInPath("/account"));

  const values = readValues(formData);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values, saved: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      college_id: parsed.data.collegeId,
      branch_id: parsed.data.branchId,
      semester: parsed.data.semester,
    })
    .eq("id", viewer.userId);

  if (error) {
    const errors =
      error.code === BRANCH_MISMATCH
        ? { branchId: "That branch isn't offered at the selected college." }
        : { form: GENERIC_ERROR };
    return { errors, values, saved: false };
  }

  revalidatePath("/", "layout");
  return { errors: {}, values, saved: true };
}
