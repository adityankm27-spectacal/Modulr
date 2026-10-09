import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { completeOnboarding } from "@/lib/actions/profile";
import { isOnboarded, requireViewer } from "@/lib/auth";
import { getCollegesWithBranches } from "@/lib/catalog";
import { safeNextPath } from "@/lib/redirect";

export const metadata: Metadata = { title: "Set up your account", robots: { index: false } };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  const viewer = await requireViewer(`/onboarding?next=${encodeURIComponent(next)}`);
  if (isOnboarded(viewer.profile)) redirect(next);

  const colleges = await getCollegesWithBranches();
  const profile = viewer.profile;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:py-14">
      <p className="text-sm font-bold text-muted-foreground">Step 1 of 1</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Tell us what you study</h1>
      <p className="mt-3 text-muted-foreground">
        We use this to show your semester&apos;s subjects first. You can change it any time from
        your account.
      </p>
      <div className="mt-8">
        <ProfileForm
          action={completeOnboarding}
          colleges={colleges}
          mode="onboarding"
          next={next}
          defaults={{
            fullName: profile?.full_name ?? "",
            collegeId: profile?.college_id ?? "",
            branchId: profile?.branch_id ?? "",
            semester: profile?.semester ? String(profile.semester) : "",
          }}
        />
      </div>
    </main>
  );
}
