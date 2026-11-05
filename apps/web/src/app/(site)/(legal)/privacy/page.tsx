import type { Metadata } from "next";
import { LegalPage, SupportEmail } from "@/components/marketing/legal-page";
import { LEGAL, operatorNames } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="We collect only the personal data we need to run Modulr. We never sell it and we don't use it for advertising."
      sections={[
        {
          heading: "Who is responsible for your data",
          body: (
            <p>
              {LEGAL.brand} is run by {operatorNames}, who decide how your personal data is used
              (the &ldquo;data fiduciary&rdquo; under India&apos;s Digital Personal Data Protection
              Act, 2023). Contact us at <SupportEmail />.
            </p>
          ),
        },
        {
          heading: "What we collect and why",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">Name and email</strong>, to create your account
                and sign you in.
              </li>
              <li>
                <strong className="text-foreground">College, branch and semester</strong>, to show
                you the right subjects.
              </li>
              <li>
                <strong className="text-foreground">Study activity</strong>, such as videos watched
                and modules completed, so you can pick up where you left off.
              </li>
              <li>
                <strong className="text-foreground">Device and session details</strong>, to enforce
                the device limit on your account and keep it secure.
              </li>
              <li>
                <strong className="text-foreground">Payment records</strong> (amount, date, status
                and Razorpay reference). Card and UPI details are handled by Razorpay; we never see
                or store them.
              </li>
              <li>
                <strong className="text-foreground">Messages you send us</strong>, to answer them.
              </li>
            </ul>
          ),
        },
        {
          heading: "Consent",
          body: (
            <p>
              We use your data on the basis of the consent you give when you sign up. You can
              withdraw consent at any time by asking us to delete your account; this does not affect
              anything done before you withdrew it.
            </p>
          ),
        },
        {
          heading: "Students under 18",
          body: (
            <p>
              If you are under 18, you may use {LEGAL.brand} only with the consent of a parent or
              guardian. We do not track, profile or target advertising at anyone.
            </p>
          ),
        },
        {
          heading: "Who we share data with",
          body: (
            <>
              <p>
                Only with the service providers that run {LEGAL.brand}, and only what each needs:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Supabase: accounts and database, stored in Mumbai, India.</li>
                <li>Vercel: website hosting; requests may be processed in the United States.</li>
                <li>Razorpay: payments, in India.</li>
                <li>Bunny.net: video storage and streaming, through a global network.</li>
                <li>Google: only if you choose &ldquo;Continue with Google&rdquo; to sign in.</li>
              </ul>
              <p>
                Some of these providers process data outside India, as the DPDP Act allows. We may
                also disclose data when the law requires it.
              </p>
            </>
          ),
        },
        {
          heading: "Cookies",
          body: (
            <p>
              We use only the cookies needed to keep you signed in. There are no advertising or
              analytics cookies.
            </p>
          ),
        },
        {
          heading: "How long we keep data",
          body: (
            <p>
              We keep your account data while your account is open and delete it within 30 days of a
              deletion request. Payment records are kept for as long as tax and accounting laws
              require.
            </p>
          ),
        },
        {
          heading: "Security",
          body: (
            <p>
              Data is encrypted in transit, access to your content is checked on our servers, and
              only the people who run {LEGAL.brand} can reach the database. If a breach affects your
              data, we will inform you and the authorities as the law requires.
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can ask to access, correct or delete your data, nominate someone to act for you,
              and raise a complaint. Email <SupportEmail />. Our Grievance Officer,{" "}
              {LEGAL.grievanceOfficer}, acknowledges requests within 48 hours and resolves them
              within one month. If you are not satisfied, you can complain to the Data Protection
              Board of India.
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: (
            <p>
              If we change this policy in a significant way, we will tell you by email or on the
              website. The date at the top shows the latest version.
            </p>
          ),
        },
      ]}
    />
  );
}
