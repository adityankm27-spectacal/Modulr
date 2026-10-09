import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="How cancellations and refunds work."
      sections={[
        {
          heading: "Cancelling",
          body: (
            <p>
              You can cancel your subscription at any time from your account. You keep access until
              the end of the period you have already paid for, and you won&apos;t be charged again.
            </p>
          ),
        },
        {
          heading: "Refunds",
          body: (
            <p>
              The refund policy is being finalised and will be published here before payments open.
            </p>
          ),
        },
        {
          heading: "Account sharing",
          body: <p>Accounts banned for sharing are not eligible for a refund.</p>,
        },
      ]}
    />
  );
}
