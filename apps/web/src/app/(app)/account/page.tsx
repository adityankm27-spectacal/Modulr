import { LogOut, MonitorSmartphone } from "lucide-react";
import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/actions/profile";
import { requireOnboardedViewer } from "@/lib/auth";
import { getCollegesWithBranches } from "@/lib/catalog";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage() {
  const { profile, email } = await requireOnboardedViewer("/account");
  const colleges = await getCollegesWithBranches();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 space-y-10 px-4 py-10">
      <div>
        <BackButton fallbackHref="/home" />
        <h1 className="mt-4 text-3xl sm:text-4xl">Account</h1>
        <p className="mt-2 break-all text-muted-foreground">Signed in as {email}</p>
      </div>

      <section aria-labelledby="profile-heading" className="space-y-5">
        <h2 id="profile-heading" className="text-xl">
          Profile
        </h2>
        <ProfileForm
          action={updateProfile}
          colleges={colleges}
          mode="edit"
          defaults={{
            fullName: profile.full_name ?? "",
            collegeId: profile.college_id,
            branchId: profile.branch_id,
            semester: String(profile.semester),
          }}
        />
      </section>

      <section aria-labelledby="sessions-heading" className="space-y-4 border-t pt-8">
        <h2 id="sessions-heading" className="text-xl">
          Sign out
        </h2>
        <p className="text-muted-foreground">
          Signing out of all devices ends every session, including phones and laptops you have lost
          or lent out.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form action="/auth/sign-out" method="post">
            <input type="hidden" name="scope" value="local" />
            <Button type="submit" variant="outline" block>
              <LogOut aria-hidden="true" />
              Sign out of this device
            </Button>
          </form>
          <form action="/auth/sign-out" method="post">
            <input type="hidden" name="scope" value="global" />
            <Button type="submit" variant="outline" block>
              <MonitorSmartphone aria-hidden="true" />
              Sign out of all devices
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
