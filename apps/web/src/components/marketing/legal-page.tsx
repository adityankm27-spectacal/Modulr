import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

/** Shared layout for legal pages. All copy is a placeholder pending legal review. */
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
      <div
        role="note"
        className="flex gap-3 rounded-2xl border-2 border-orange bg-orange/10 p-4 text-sm font-semibold"
      >
        <TriangleAlert className="size-5 shrink-0 text-orange" aria-hidden="true" />
        <p>
          TODO: legal review. This is a draft placeholder, not final terms. It will be reviewed
          before launch.
        </p>
      </div>
      <h1 className="mt-8 text-4xl sm:text-5xl">{title}</h1>
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
