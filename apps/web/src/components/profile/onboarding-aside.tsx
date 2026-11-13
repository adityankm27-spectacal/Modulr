import { FileText, History, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** The three things every module has, as the logo's stacked bars. */
const BARS = [
  {
    icon: PlayCircle,
    label: "Animated videos",
    bar: "bg-sunflower text-ink",
    chip: "bg-ink text-sunflower",
    offset: "",
  },
  {
    icon: FileText,
    label: "One-page notes",
    bar: "bg-periwinkle text-white",
    chip: "bg-white text-cobalt",
    offset: "lg:translate-x-5",
  },
  {
    icon: History,
    label: "Solved PYQs",
    bar: "bg-white text-ink",
    chip: "bg-cobalt text-white",
    offset: "",
  },
] as const;

/** Welcome panel beside (laptop) or above (phone) the sign-up form. Purely decorative copy. */
export function OnboardingAside() {
  return (
    <aside className="relative isolate flex flex-col gap-4 overflow-hidden rounded-3xl border-[3px] border-line bg-cobalt p-6 text-white shadow-[0_6px_0_0_var(--line)] motion-safe:animate-rise lg:gap-5 lg:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-16 -right-12 size-56 rounded-full bg-periwinkle/60 blur-3xl motion-safe:animate-drift" />
        <div className="absolute -bottom-20 -left-10 size-48 rounded-full bg-sunflower/25 blur-3xl motion-safe:animate-drift motion-safe:[animation-delay:-9s]" />
      </div>

      <p className="inline-flex self-start rounded-full border-[3px] border-line bg-sunflower px-3 py-0.5 text-sm font-extrabold text-ink">
        Step 1 of 1
      </p>
      <p className="font-display text-3xl leading-tight font-black lg:text-4xl">
        Welcome to Modulr
      </p>
      <p className="hidden text-white/90 lg:block">
        Tell us what you study and we&apos;ll line up the right subjects for you.
      </p>

      {/* Phone: three slim bars, like the logo. */}
      <div aria-hidden="true" className="flex gap-1.5 lg:hidden">
        {BARS.map(({ bar, label }) => (
          <span key={label} className={cn("h-2.5 w-11 rounded-full border-2 border-line", bar)} />
        ))}
      </div>

      {/* Laptop: the bars with their labels. */}
      <ul aria-hidden="true" className="mt-auto hidden flex-col gap-3 pt-6 lg:flex">
        {BARS.map(({ icon: Icon, label, bar, chip, offset }, i) => (
          <li
            key={label}
            className={cn("motion-safe:animate-slide-in", offset)}
            style={{ animationDelay: `${250 + i * 150}ms` }}
          >
            <span
              className={cn(
                "flex items-center gap-3 rounded-full border-[3px] border-line px-3 py-2 font-extrabold motion-safe:animate-sway",
                bar,
              )}
              style={{ animationDelay: `${-i * 2}s` }}
            >
              <span className={cn("flex size-9 items-center justify-center rounded-full", chip)}>
                <Icon className="size-5" />
              </span>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
