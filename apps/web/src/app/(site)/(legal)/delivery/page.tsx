import type { Metadata } from "next";
import { LegalPage, SupportEmail } from "@/components/marketing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Delivery Policy" };

export default function DeliveryPage() {
  return (
    <LegalPage
      title="Delivery Policy"
      intro={`${LEGAL.brand} is a digital service. Nothing is shipped to you.`}
      sections={[
        {
          heading: "When you get access",
          body: (
            <p>
              Access starts immediately after a successful payment. Every module of every subject
              unlocks on the website for your account, usually within a minute.
            </p>
          ),
        },
        {
          heading: "How content is delivered",
          body: (
            <p>
              Videos, notes, formula sheets and questions are streamed and shown in your browser
              while you are signed in. Downloads are not offered, and there are no physical goods,
              shipping or delivery charges.
            </p>
          ),
        },
        {
          heading: "If access doesn't start",
          body: (
            <p>
              Refresh the page and check your Account page. If your plan still isn&apos;t active
              after 30 minutes, email <SupportEmail /> with your payment reference and we will fix
              it or refund you.
            </p>
          ),
        },
      ]}
    />
  );
}
