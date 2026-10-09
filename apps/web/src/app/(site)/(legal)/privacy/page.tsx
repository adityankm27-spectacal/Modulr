import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="We collect as little personal data as we need to run Modulr, and we never sell it."
      sections={[
        {
          heading: "What we collect",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Your name and email address, to create your account.</li>
              <li>Your college, branch and semester, to show you the right subjects.</li>
              <li>Study activity such as videos watched, to resume where you left off.</li>
              <li>Device identifiers, to enforce the device limit on your account.</li>
              <li>
                Payment records. Card and UPI details are handled by Razorpay; we never see or store
                them.
              </li>
            </ul>
          ),
        },
        {
          heading: "Consent",
          body: (
            <p>
              We ask for your consent when you sign up, in line with India&apos;s Digital Personal
              Data Protection Act, 2023. You can withdraw consent by deleting your account.
            </p>
          ),
        },
        {
          heading: "Students under 18",
          body: (
            <p>
              Students under 18 need a parent&apos;s or guardian&apos;s consent. We collect only the
              minimum data listed above.
            </p>
          ),
        },
        {
          heading: "Service providers",
          body: (
            <p>
              We use trusted providers to run Modulr: Supabase (accounts and data), Razorpay
              (payments), a video streaming provider, Resend (email), and PostHog and Sentry
              (analytics and error reports).
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can ask to see, correct or delete your data at any time. Account deletion requests
              are handled through the contact page.
            </p>
          ),
        },
      ]}
    />
  );
}
