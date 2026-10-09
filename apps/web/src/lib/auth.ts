import "server-only";
import type { Tables } from "@modulr/shared";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { signInPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export type Profile = Tables<"profiles">;

export type OnboardedProfile = Profile & {
  college_id: string;
  branch_id: string;
  semester: number;
  onboarded_at: string;
};

export interface Viewer {
  userId: string;
  email: string | null;
  profile: Profile | null;
}

export function isOnboarded(profile: Profile | null): profile is OnboardedProfile {
  return Boolean(
    profile?.onboarded_at && profile.college_id && profile.branch_id && profile.semester,
  );
}

/** The signed-in user (verified JWT) and their profile, once per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { userId, email: email ?? profile?.email ?? null, profile };
});

/** Redirects visitors to sign-in, returning to `next` afterwards. */
export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(signInPath(next));
  return viewer;
}

/** Like requireViewer, and also sends users who haven't finished onboarding there first. */
export async function requireOnboardedViewer(
  next: string,
): Promise<Viewer & { profile: OnboardedProfile }> {
  const viewer = await requireViewer(next);
  const { profile } = viewer;
  if (!isOnboarded(profile)) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  }
  return { ...viewer, profile };
}

export function isAdmin(viewer: Viewer | null): boolean {
  return viewer?.profile?.role === "admin";
}

/**
 * Admin pages: visitors go to sign-in; signed-in non-admins get a 404 so the
 * admin area's existence isn't revealed. RLS enforces the same rule on data.
 */
export async function requireAdmin(next: string): Promise<Viewer> {
  const viewer = await requireViewer(next);
  if (!isAdmin(viewer)) notFound();
  return viewer;
}
