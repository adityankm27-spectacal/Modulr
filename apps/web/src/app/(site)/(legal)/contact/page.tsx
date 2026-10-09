import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const email = (await getSettings())["site.support_email"];
  return (
    <LegalPage
      title="Contact"
      intro="Questions, account deletion requests or a mistake in the content? Get in touch."
      sections={[
        {
          heading: "Email",
          body: email ? (
            <p>
              <a
                href={`mailto:${email}`}
                className="font-bold text-link underline underline-offset-4"
              >
                {email}
              </a>
            </p>
          ) : (
            <p>Our support email address will be published here soon.</p>
          ),
        },
        {
          heading: "Reporting a mistake",
          body: (
            <p>
              Email us the subject, module and what looks wrong, and we&apos;ll fix it. A
              &ldquo;Report an error&rdquo; button on every page is coming soon.
            </p>
          ),
        },
      ]}
    />
  );
}
