import type { Metadata } from "next";
import { LegalPage, SupportEmail } from "@/components/marketing/legal-page";
import { LEGAL, operatorNames } from "@/lib/legal";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact"
      intro="Questions, payment problems, data requests or a mistake in the content? Get in touch."
      sections={[
        {
          heading: "Support",
          body: (
            <>
              <p>
                Email: <SupportEmail />
              </p>
              {LEGAL.phone ? (
                <p>
                  Phone:{" "}
                  <a
                    href={`tel:${LEGAL.phone.replace(/\s+/g, "")}`}
                    className="font-bold text-link underline underline-offset-4"
                  >
                    {LEGAL.phone}
                  </a>
                </p>
              ) : null}
              <p>We reply within 2 working days.</p>
            </>
          ),
        },
        {
          heading: "Who runs Modulr",
          body: (
            <>
              <p>
                {LEGAL.brand} is run by {operatorNames}.
              </p>
              {LEGAL.address ? <p className="whitespace-pre-line">{LEGAL.address}</p> : null}
            </>
          ),
        },
        {
          heading: "Grievance Officer",
          body: (
            <>
              <p>
                {LEGAL.grievanceOfficer}, reachable at <SupportEmail />.
              </p>
              <p>
                We acknowledge complaints within 48 hours and resolve them within one month, as
                required by the Consumer Protection (E-Commerce) Rules, 2020 and the Digital
                Personal Data Protection Act, 2023.
              </p>
            </>
          ),
        },
        {
          heading: "Reporting a mistake",
          body: (
            <p>Email the subject, module and what looks wrong, and we&apos;ll fix it quickly.</p>
          ),
        },
      ]}
    />
  );
}
