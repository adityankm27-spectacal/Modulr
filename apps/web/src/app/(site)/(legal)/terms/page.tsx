import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, SupportEmail } from "@/components/marketing/legal-page";
import { getSettings } from "@/lib/catalog";
import { LEGAL, operatorNames } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service" };

const link = "font-bold text-link underline underline-offset-4";

export default async function TermsPage() {
  const devices = (await getSettings())["devices.max_active"];
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms are an agreement between you and ${LEGAL.brand}. By creating an account or using the website, you accept them.`}
      sections={[
        {
          heading: "Who we are",
          body: (
            <p>
              {LEGAL.brand} is an online study platform run by {operatorNames} (&ldquo;we&rdquo;,
              &ldquo;us&rdquo;). Our contact details are on the{" "}
              <Link href="/contact" className={link}>
                Contact page
              </Link>
              .
            </p>
          ),
        },
        {
          heading: "Who can use Modulr",
          body: (
            <p>
              You must be 18 or older, or have the consent of a parent or guardian who agrees to
              these terms on your behalf. You must give us accurate details when you sign up.
            </p>
          ),
        },
        {
          heading: "Your account is personal",
          body: (
            <>
              <p>
                One account is for one student. You can use it on up to {devices}{" "}
                {devices === 1 ? "device" : "devices"} at a time, and we limit how often devices can
                be swapped. You are responsible for keeping access to your email and Google account
                safe.
              </p>
              <p className="font-bold text-foreground">
                Sharing your account, or selling or giving away access, leads to a permanent ban
                without a refund.
              </p>
            </>
          ),
        },
        {
          heading: "Subscriptions and payments",
          body: (
            <>
              <p>
                Modules marked free can be opened by any signed-in student. All other content needs
                a paid plan, priced as shown on the{" "}
                <Link href="/pricing" className={link}>
                  Pricing page
                </Link>{" "}
                at the time you subscribe. Prices include any applicable taxes unless stated
                otherwise.
              </p>
              <p>
                Payments are processed by Razorpay. Monthly plans renew automatically through a UPI
                Autopay or card mandate you approve at checkout, until you cancel. We never see or
                store your card or UPI details.
              </p>
              <p>
                If we change the price of a plan, the new price applies only to new subscriptions;
                we will tell existing subscribers in advance before any change affects them.
              </p>
            </>
          ),
        },
        {
          heading: "Cancellation and refunds",
          body: (
            <p>
              You can cancel at any time from your Account page. Cancelling stops future charges,
              and you keep access until the end of the period you have paid for. Refunds are covered
              by our{" "}
              <Link href="/refunds" className={link}>
                Refund and Cancellation Policy
              </Link>
              .
            </p>
          ),
        },
        {
          heading: "Our content",
          body: (
            <>
              <p>
                All videos, notes, formula sheets, questions and answers on {LEGAL.brand} are our
                original work or used with permission, and are protected by copyright. We give you a
                personal, non-transferable licence to use them for your own study while your account
                is in good standing.
              </p>
              <p>
                You may not record, download, screenshot for sharing, copy, scrape, resell or
                redistribute any content, or try to get around our technical protections. Content is
                watermarked with your account details so leaks can be traced.
              </p>
            </>
          ),
        },
        {
          heading: "Study aid only",
          body: (
            <p>
              {LEGAL.brand} helps you prepare, but it does not replace your lectures, textbooks or
              official syllabus, and we do not guarantee any marks or results. We work hard to keep
              content accurate; if you spot a mistake, tell us at <SupportEmail /> and we will fix
              it.
            </p>
          ),
        },
        {
          heading: "Independence",
          body: (
            <p>
              {LEGAL.brand} is independent and is not affiliated with, or endorsed by, any college
              or university. Syllabus and university names are used only to describe what our
              content covers.
            </p>
          ),
        },
        {
          heading: "Suspension and termination",
          body: (
            <p>
              We may suspend or close an account that breaks these terms, for example by sharing
              access or copying content. You can stop using {LEGAL.brand} and ask us to delete your
              account at any time.
            </p>
          ),
        },
        {
          heading: "Availability and liability",
          body: (
            <p>
              We aim to keep {LEGAL.brand} available but cannot promise it will never be
              interrupted. To the extent the law allows, our total liability to you for any claim is
              limited to the amount you paid us in the three months before the claim. Nothing in
              these terms limits rights you have under the Consumer Protection Act, 2019.
            </p>
          ),
        },
        {
          heading: "Complaints and disputes",
          body: (
            <p>
              Contact our Grievance Officer, {LEGAL.grievanceOfficer}, at <SupportEmail />. We
              acknowledge complaints within 48 hours and aim to resolve them within one month. These
              terms are governed by the laws of India, and the courts of {LEGAL.jurisdiction} have
              jurisdiction over disputes.
            </p>
          ),
        },
        {
          heading: "Changes to these terms",
          body: (
            <p>
              We may update these terms. If a change is significant, we will tell you by email or on
              the website before it takes effect. The date at the top shows the latest version.
            </p>
          ),
        },
      ]}
    />
  );
}
