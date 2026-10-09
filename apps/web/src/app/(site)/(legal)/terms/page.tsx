import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const devices = (await getSettings())["devices.max_active"];
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms govern your use of Modulr's website and app."
      sections={[
        {
          heading: "Your account is personal",
          body: (
            <>
              <p>
                One account is for one student. You can use it on up to {devices}{" "}
                {devices === 1 ? "device" : "devices"} at a time, and we limit how often devices can
                be swapped.
              </p>
              <p className="font-bold text-foreground">
                Sharing your account, or selling or giving away access, leads to a permanent ban
                without a refund.
              </p>
            </>
          ),
        },
        {
          heading: "Content",
          body: (
            <p>
              All videos, notes, formula sheets and answers are original work owned by Modulr. They
              are for your personal study only. Recording, downloading, copying or redistributing
              them is not allowed. Content is watermarked with your account details.
            </p>
          ),
        },
        {
          heading: "Subscriptions and payments",
          body: (
            <p>
              Paid plans are billed through Razorpay. Subscriptions renew automatically until you
              cancel. When you cancel, you keep access until the end of the period you paid for.
            </p>
          ),
        },
        {
          heading: "Students under 18",
          body: (
            <p>
              If you are under 18, you may use Modulr only with the consent of a parent or guardian.
            </p>
          ),
        },
        {
          heading: "Independence",
          body: (
            <p>
              Modulr is independent and is not affiliated with, or endorsed by, any college or
              university.
            </p>
          ),
        },
        {
          heading: "Changes and contact",
          body: (
            <p>
              We may update these terms and will tell you about significant changes. Questions? See
              the contact page.
            </p>
          ),
        },
      ]}
    />
  );
}
