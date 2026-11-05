import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { LEGAL, missingLegalDetails } from "@/lib/legal";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

/** A mailto link to the support address, for use inside legal copy. */
export function SupportEmail() {
  return (
    <a
      href={`mailto:${LEGAL.supportEmail}`}
      className="font-bold text-link underline underline-offset-4"
    >
      {LEGAL.supportEmail}
    </a>
  );
}

/** Shared layout for the legal pages. */
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  const missing = missingLegalDetails();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
      {missing.length > 0 ? (
        <div
          role="note"
          className="mb-8 flex gap-3 rounded-2xl border-2 border-orange bg-orange/10 p-4 text-sm font-semibold"
        >
          <TriangleAlert className="size-5 shrink-0 text-orange" aria-hidden="true" />
          <p>Our {missing.join(" and ")} will be added here shortly.</p>
        </div>
      ) : null}
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">
        Last updated: {LEGAL.lastUpdated}
      </p>
      <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-sans text-xl font-extrabold tracking-normal">{section.heading}</h2>
            <div className="mt-2 space-y-3 text-muted-foreground">{section.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
