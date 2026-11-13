import type { CSSProperties, ReactNode } from "react";
import { PointerArea } from "@/components/motion/pointer-area";
import type { SubjectIcon, SubjectTone } from "@/lib/subject-style";
import { SUBJECT_ICON, SUBJECT_TONE } from "./subject-visuals";

/** The coloured banner at the top of a subject's page, in that subject's colour. */
export function SubjectHero({
  icon,
  tone,
  eyebrow,
  title,
  description,
  chips,
}: {
  icon: SubjectIcon;
  tone: SubjectTone;
  eyebrow: string;
  title: string;
  description: string | null;
  chips: ReactNode[];
}) {
  const Icon = SUBJECT_ICON[icon];
  const { color, text } = SUBJECT_TONE[tone];

  return (
    <PointerArea
      as="header"
      style={{ "--tone": color, color: text } as CSSProperties}
      className="group/hero relative isolate overflow-hidden rounded-[1.75rem] border-[3px] border-line bg-(--tone) p-6 shadow-[0_8px_0_0_var(--line)] motion-safe:animate-rise sm:p-10"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-16 size-72 rounded-full bg-white/30 blur-3xl motion-safe:animate-drift" />
        <div className="absolute -bottom-24 left-1/4 size-64 rounded-full bg-white/15 blur-3xl motion-safe:animate-drift motion-safe:[animation-delay:-9s]" />
        {/* Light that follows the pointer. */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/hero:opacity-100"
          style={{
            background:
              "radial-gradient(360px circle at var(--x, 50%) var(--y, 50%), rgb(255 255 255 / 0.28), transparent 70%)",
          }}
        />
      </div>

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="inline-flex -rotate-2 rounded-full border-[3px] border-line bg-white px-3 py-1 font-mono text-sm font-semibold text-ink motion-safe:animate-rise">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-black break-words motion-safe:animate-rise motion-safe:[animation-delay:80ms] sm:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-prose opacity-90 motion-safe:animate-rise motion-safe:[animation-delay:160ms]">
              {description}
            </p>
          ) : null}
        </div>

        {/* The subject's icon, as a sticker that leans away from the pointer. */}
        <div
          aria-hidden="true"
          className="hidden shrink-0 transition-[translate] duration-500 ease-out sm:block"
          style={{ translate: "calc(var(--mx, 0) * -18px) calc(var(--my, 0) * -12px)" }}
        >
          <span className="flex size-28 rotate-6 items-center justify-center rounded-[1.75rem] border-[3px] border-line bg-white text-ink shadow-[0_7px_0_0_var(--line)] motion-safe:animate-bob">
            <Icon className="size-14" />
          </span>
        </div>
      </div>

      {chips.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-3 motion-safe:animate-rise motion-safe:[animation-delay:240ms]">
          {chips.map((chip, i) => (
            <li
              key={i}
              className="rounded-2xl border-[3px] border-line bg-white px-4 py-1.5 text-sm font-extrabold text-ink"
            >
              {chip}
            </li>
          ))}
        </ul>
      ) : null}
    </PointerArea>
  );
}
