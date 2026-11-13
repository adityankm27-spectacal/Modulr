import { LogOut, MonitorSmartphone } from "lucide-react";
import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { BackButton } from "@/components/back-button";
import { BillingSection } from "@/components/billing/billing-section";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/actions/profile";
import { parseAccountTab } from "@/lib/account-tabs";
import { requireOnboardedViewer } from "@/lib/auth";
import { getCollegesWithBranches } from "@/lib/catalog";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

const panel =
  "rounded-3xl border-[3px] border-line bg-card p-5 shadow-[0_5px_0_0_var(--line)] sm:p-6";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; tab?: string }>;
}) {
  const { profile, email, userId } = await requireOnboardedViewer("/account");
  const [colleges, params] = await Promise.all([getCollegesWithBranches(), searchParams]);
  // Landing here after checkout always shows the plan, whatever tab was open.
  const tab = params.subscribed === "1" ? "billing" : parseAccountTab(params.tab);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
      <BackButton fallbackHref="/home" />
      <h1 className="mt-4 text-3xl sm:text-4xl">Account</h1>
      <p className="mt-2 break-all text-muted-foreground lg:hidden">Signed in as {email}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <AccountNav active={tab} name={profile.full_name} email={email} />

        <div className="motion-safe:animate-rise">
          {tab === "profile" ? (
            <section aria-labelledby="profile-heading" className="space-y-5">
              <h2 id="profile-heading" className="text-2xl">
                Profile
              </h2>
              <div className={panel}>
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
              </div>
            </section>
          ) : null}

          {tab === "billing" ? (
            <BillingSection
              userId={userId}
              compAccessUntil={profile.comp_access_until}
              justSubscribed={params.subscribed === "1"}
            />
          ) : null}

          {tab === "sign-out" ? (
            <section aria-labelledby="sessions-heading" className="space-y-5">
              <h2 id="sessions-heading" className="text-2xl">
                Sign out
              </h2>
              <div className={`${panel} space-y-4`}>
                <p className="text-muted-foreground">
                  Signing out of all devices ends every session, including phones and laptops you
                  have lost or lent out.
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
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
