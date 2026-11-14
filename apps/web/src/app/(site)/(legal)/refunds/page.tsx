import type { Metadata } from "next";
import { LegalPage, SupportEmail } from "@/components/marketing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund and Cancellation Policy" };

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund and Cancellation Policy"
      intro="You can cancel any time. Here is exactly what happens when you do, and when we refund."
      sections={[
        {
          heading: "Before you subscribe",
          body: (
            <p>
              You can browse every subject and module on {LEGAL.brand}, and see what each module
              includes, before you subscribe. Some modules are free to open once you sign in, with
              no payment, so you can try {LEGAL.brand} first.
            </p>
          ),
        },
        {
          heading: "Cancelling",
          body: (
            <p>
              Cancel from your Account page at any time, in one click. Your UPI Autopay or card
              mandate is stopped immediately, so you won&apos;t be charged again, and you keep
              access until the end of the period you have already paid for.
            </p>
          ),
        },
        {
          heading: "Refunds",
          body: (
            <>
              <p>
                Payments for a period that has started are not refundable, and we don&apos;t give
                partial refunds for unused days.
              </p>
              <p>
                We do refund in full if you were charged twice for the same period, charged after
                you cancelled, or charged when the payment failed on our side. Email{" "}
                <SupportEmail /> with your payment reference (shown on your Account page) within 30
                days.
              </p>
            </>
          ),
        },
        {
          heading: "How refunds are paid",
          body: (
            <p>
              Approved refunds go back to the original payment method through Razorpay within 7
              working days of approval. Your bank may take a few more days to show it.
            </p>
          ),
        },
        {
          heading: "Accounts banned for sharing",
          body: (
            <p>
              Accounts closed for sharing access or copying content are not eligible for a refund.
            </p>
          ),
        },
        {
          heading: "Questions or disputes",
          body: (
            <p>
              Contact <SupportEmail />. Our Grievance Officer, {LEGAL.grievanceOfficer},
              acknowledges complaints within 48 hours and resolves them within one month. This
              policy doesn&apos;t limit your rights under consumer protection law.
            </p>
          ),
        },
      ]}
    />
  );
}
